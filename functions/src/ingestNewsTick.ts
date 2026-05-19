/* eslint-disable require-jsdoc */
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import {
  INTERNATIONAL_FEED_SOURCES,
  PAKISTAN_FEED_SOURCES,
  QUERY_FEED_SOURCES,
  REDDIT_FEED_SOURCE,
} from "./constants/sources";
import type {
  AgentFeedSelection,
  FeedArticleDraft,
  FeedSource,
  IngestionResult,
  NewsFeedSettings,
  SyncLog,
} from "./constants/types";

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "PK";
const IDLE_ARCHIVE_MS = 2 * 24 * 60 * 60 * 1000;
const ARCHIVE_DELETE_MS = 31 * 24 * 60 * 60 * 1000;
const MAX_AGENT_INPUT_ITEMS = 30; // Reduced from 80 to focus on quality
const MIN_RELEVANCE_SCORE = 75; // Increased from 70 to be more selective
const IMMUTABLE_NEWS_PROMPT =
  "System rule: use the saved business profile as the source of truth, " +
  "classify only enabled user-configured sources, and return operationally " +
  "relevant news for the content-to-action workflow. Prioritize high-impact, " +
  "actionable news with clear business implications. Only select articles that " +
  "directly affect the business's operations, costs, or strategic decisions.";
const DEFAULT_NEWS_PROMPT =
  "Collect operationally relevant news that directly impacts: costs, margins, " +
  "customer churn, market access, compliance, logistics, supply chains, " +
  "fuel, tax policy, pricing, or regional operations. Exclude generic news " +
  "unless directly related to business operations.";

function generateHash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function cleanXML(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toIsoDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function timestampMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return null;
}

function renderTemplate(value: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (next, [key, paramValue]) =>
      next.split(`{{${key}}}`).join(encodeURIComponent(paramValue)),
    value
  );
}

function resolveSources(settings: NewsFeedSettings): FeedSource[] {
  const systemPrompt = settings.systemPrompt || "";
  const configured = Array.isArray(settings.sources) &&
    settings.sources.length > 0 ?
    settings.sources :
    [];
  const resolved: FeedSource[] = [];
  let googleAdded = false;

  for (const source of configured) {
    if (source.enabled === false) continue;
    const type = source.type || source.providerId || "custom_rss";

    const querySource = QUERY_FEED_SOURCES[type];
    if (querySource) {
      if (type === "google_news" && googleAdded) continue;
      if (type === "google_news") googleAdded = true;
      resolved.push({
        ...querySource,
        ...source,
        id: source.id || querySource.id,
        name: source.name || querySource.name,
        type: querySource.type,
        url: renderTemplate(querySource.url || "", {
          query: systemPrompt,
        }),
        language: source.language || querySource.language,
        country: source.country || querySource.country,
      });
      continue;
    }

    if (type === "reddit") {
      const subreddit = String(source.subreddit || "")
        .replace(/^\/?r\//i, "")
        .trim();
      if (!subreddit) continue;
      resolved.push({
        ...REDDIT_FEED_SOURCE,
        ...source,
        id: source.id || `reddit_${subreddit.toLowerCase()}`,
        name: source.name || `r/${subreddit}`,
        type,
        url: renderTemplate(REDDIT_FEED_SOURCE.url || "", {subreddit}),
        language: source.language || REDDIT_FEED_SOURCE.language,
        country: source.country || REDDIT_FEED_SOURCE.country,
      });
      continue;
    }

    const internationalSource = INTERNATIONAL_FEED_SOURCES[type];
    if (internationalSource) {
      resolved.push({
        ...internationalSource,
        ...source,
        id: source.id || internationalSource.id,
        name: source.name || internationalSource.name,
        type: internationalSource.type,
        url: internationalSource.url,
        language: source.language || internationalSource.language,
        country: source.country || internationalSource.country,
      });
      continue;
    }

    const pakistanSource = PAKISTAN_FEED_SOURCES[type];
    if (pakistanSource) {
      resolved.push({
        ...pakistanSource,
        ...source,
        id: source.id || pakistanSource.id,
        name: source.name || pakistanSource.name,
        type: pakistanSource.type,
        url: pakistanSource.url,
        language: source.language || pakistanSource.language,
        country: source.country || pakistanSource.country,
      });
      continue;
    }

    const url = source.sourceUrl || source.url;
    if (type === "custom_rss" && url) {
      resolved.push({
        ...source,
        id: source.id || generateHash(url),
        name: source.name || "Custom RSS",
        type,
        url,
        language: source.language || DEFAULT_LANGUAGE,
        country: source.country || DEFAULT_COUNTRY,
      });
    }
  }

  return resolved;
}

function parseRSS(xmlText: string, source: FeedSource): FeedArticleDraft[] {
  const items: FeedArticleDraft[] = [];
  const sourceName = source.name || "News Source";
  const language = source.language || DEFAULT_LANGUAGE;
  const country = source.country || DEFAULT_COUNTRY;

  const rssItems = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  if (rssItems) {
    for (const itemXml of rssItems) {
      const title =
        (itemXml.match(/<title>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/) ||
          [])[2] || "";
      const description =
        (itemXml.match(
          /<description>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/description>/
        ) || [])[2] || "";
      const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || "";
      const guid =
        (itemXml.match(/<guid[\s\S]*?>([\s\S]*?)<\/guid>/) || [])[1] ||
        link;
      const pubDate =
        (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "";

      items.push({
        title: cleanXML(title),
        summary: cleanXML(description),
        url: link.trim(),
        canonicalUrl: cleanXML(guid),
        publishedAt: toIsoDate(pubDate.trim()),
        sourceName,
        sourceId: source.id,
        sourceType: source.type,
        language,
        country,
      });
    }
  }

  if (items.length === 0) {
    const atomEntries = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    if (atomEntries) {
      for (const entryXml of atomEntries) {
        const title =
          (entryXml.match(
            /<title[\s\S]*?>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/
          ) || [])[2] || "";
        const summary =
          (entryXml.match(
            /<summary[\s\S]*?>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/summary>/
          ) || [])[2] || "";
        const linkMatch = entryXml.match(
          /<link[\s\S]*?href=["']([\s\S]*?)["']/
        );
        const link = linkMatch ? linkMatch[1] : "";
        const id = (entryXml.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || link;
        const updated =
          (entryXml.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1] || "";

        items.push({
          title: cleanXML(title),
          summary: cleanXML(summary),
          url: link.trim(),
          canonicalUrl: cleanXML(id),
          publishedAt: toIsoDate(updated.trim()),
          sourceName,
          sourceId: source.id,
          sourceType: source.type,
          language,
          country,
        });
      }
    }
  }

  return items.filter((item) => item.title.length > 0);
}

function getFeedItemId(raw: FeedArticleDraft | AgentFeedSelection): string {
  const sourceUrl = "sourceUrl" in raw ? raw.sourceUrl : "";
  const canonicalUrl = raw.canonicalUrl || raw.url || sourceUrl;
  if (canonicalUrl.trim().length > 0) {
    return generateHash(canonicalUrl.trim());
  }

  return generateHash(
    `${raw.title.trim()}_${raw.sourceName.trim()}_${raw.publishedAt.trim()}`
  );
}

async function fetchSource(source: FeedSource): Promise<{
  articles: FeedArticleDraft[];
  syncLog: SyncLog;
}> {
  const response = await fetch(source.url || "");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  const articles = parseRSS(text, source);

  return {
    articles,
    syncLog: {
      type: "pull",
      sourceName: source.name || "News Source",
      status: "success",
      message: `Fetched and parsed ${articles.length} items.`,
      reason: "Fetched RSS/Atom feed. Selection delegated to agent.",
    },
  };
}

async function selectFeedItemsWithAgent(input: {
  uid: string;
  articles: FeedArticleDraft[];
  syncLogs: SyncLog[];
}): Promise<AgentFeedSelection[]> {
  const {uid, articles, syncLogs} = input;

  if (articles.length === 0) {
    return [];
  }

  const profileRef = db.doc(`users/${uid}/profile/main`);
  const profileSnap = await profileRef.get();

  if (!profileSnap.exists) {
    console.warn(`User profile users/${uid}/profile/main does not exist.`);
    syncLogs.push({
      type: "pull",
      sourceName: "Agent Selection",
      status: "failed",
      errorType: "Missing Profile",
      message: `User profile users/${uid}/profile/main not found.`,
      reason: "Relevance check skipped because user profile is missing.",
    });
    return [];
  }

  const profile = profileSnap.data() || {};
  const settingsSnap = await db.doc(`users/${uid}/settings/newsFeed`).get();
  const settings = settingsSnap.exists ?
    (settingsSnap.data() as NewsFeedSettings) :
    {};

  const userPrompt = profile.systemPrompt ||
    profile.newsSystemPrompt ||
    settings.systemPrompt ||
    DEFAULT_NEWS_PROMPT;
  const immutablePrompt = profile.immutableNewsPrompt ||
    IMMUTABLE_NEWS_PROMPT;
  const systemPrompt = [
    immutablePrompt,
    "",
    "User-configured news focus:",
    userPrompt,
  ].join("\n");

  const compactProfile = {
    businessName: profile.businessName || "",
    industry: profile.industry || profile.domain || "",
    locations: Array.isArray(profile.locations) ?
      profile.locations.join(", ") :
      (profile.locations || ""),
    keyConcerns: profile.keyConcerns || profile.concerns || "",
    goals: profile.goals || profile.primaryGoal || "",
    targetAudience: profile.targetAudience || "",
    riskSensitivity: profile.riskSensitivity || "Medium",
    systemPrompt,
  };

  // Pre-filter: remove duplicates and sort by recency
  const seenTitles = new Set<string>();
  const dedupedArticles = articles.filter((article) => {
    const titleKey = article.title.toLowerCase().trim();
    if (seenTitles.has(titleKey)) return false;
    seenTitles.add(titleKey);
    return true;
  });

  // Sort by publication date (newest first) to prioritize fresh content
  dedupedArticles.sort((a, b) => {
    const aTime = new Date(a.publishedAt).getTime();
    const bTime = new Date(b.publishedAt).getTime();
    return bTime - aTime;
  });

  const inputArticles = dedupedArticles
    .slice(0, MAX_AGENT_INPUT_ITEMS)
    .map((article) => ({
      feedItemId: getFeedItemId(article),
      title: article.title,
      summary: article.summary,
      source: article.sourceName,
      url: article.url,
      publishedAt: article.publishedAt,
      language: article.language,
      country: article.country,
    }));

  const promptText = [
    "You are a strict news selection and classification assistant.",
    "Evaluate RSS articles against the user's saved business profile.",
    "CRITICAL: Only return articles with relevanceScore >= 75 that have direct, clear, actionable business impact.",
    "If an article is generic, speculative, or only tangentially related, give it a score below 75.",
    "Prioritize articles that could directly trigger immediate business decisions or operational changes.",
    "Filter out: generic industry news, tangential mentions, competitor gossip, or unrelated geopolitical events.",
    "",
    "USER BUSINESS PROFILE:",
    `Business Name: ${compactProfile.businessName}`,
    `Industry/Domain: ${compactProfile.industry}`,
    `Operating Locations: ${compactProfile.locations}`,
    `Key Concerns: ${compactProfile.keyConcerns}`,
    `Goals: ${compactProfile.goals}`,
    `Target Audience: ${compactProfile.targetAudience}`,
    `Risk Sensitivity: ${compactProfile.riskSensitivity}`,
    "",
    "SELECTION INSTRUCTION:",
    String(compactProfile.systemPrompt),
    "",
    "Quality Rules:",
    "- feedItemId must exactly match one input article feedItemId.",
    "- relevanceScore must be 0..100, with 75+ indicating direct business impact AND actionability.",
    "- selectionReason must explain specific operational relevance.",
    "- brief must be under 280 characters and highlight key action items.",
    "- ONLY select articles that could directly trigger business decisions or operational actions.",
    "- When in doubt, score lower rather than higher.",
    "",
    "INPUT ARTICLES JSON:",
    JSON.stringify(inputArticles, null, 2),
  ].join("\n");

  let response;
  try {
    response = await ai.generate({
      prompt: promptText,
      output: {
        schema: z.object({
          selectedItems: z.array(
            z.object({
              feedItemId: z.string().describe(
                "Must exactly match one input article feedItemId."
              ),
              relevanceScore: z.number().describe(
                "Relevance score between 0 and 100."
              ),
              selectionReason: z.string().describe(
                "Brief explanation of relevance."
              ),
              brief: z.string().describe(
                "Engaging summary under 280 characters."
              ),
            })
          ),
        }),
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Genkit news selection failed:", error);
    syncLogs.push({
      type: "pull",
      sourceName: "Agent Selection",
      status: "failed",
      errorType: "LLM Error",
      message: error.message,
      reason: "Agent news selection encountered an LLM or schema error.",
    });
    return [];
  }

  const selectedItems: AgentFeedSelection[] = [];
  const rawSelected = response.output?.selectedItems || [];

  const originalMap = new Map<string, FeedArticleDraft>();
  for (const article of articles) {
    const feedItemId = getFeedItemId(article);
    originalMap.set(feedItemId, article);
  }

  for (const item of rawSelected) {
    if (!item.feedItemId) continue;

    const original = originalMap.get(item.feedItemId);
    if (!original) continue;

    let score = Math.round(item.relevanceScore);
    if (Number.isNaN(score)) score = 0;
    score = Math.max(0, Math.min(100, score));

    if (score < MIN_RELEVANCE_SCORE) continue;

    const brief = truncate(
      item.brief || item.selectionReason || original.summary || original.title,
      280
    );

    selectedItems.push({
      feedItemId: item.feedItemId,
      title: original.title,
      summary: original.summary,
      sourceName: original.sourceName,
      sourceUrl: original.url,
      url: original.url,
      canonicalUrl: original.canonicalUrl,
      publishedAt: original.publishedAt,
      relevanceScore: score,
      selectionReason: item.selectionReason || "Relevant to profile concerns.",
      brief,
      sourceId: original.sourceId,
      sourceType: original.sourceType,
    });
  }

  selectedItems.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const finalSelected = selectedItems.slice(0, 15);

  syncLogs.push({
    type: "pull",
    sourceName: "Agent Selection",
    status: "success",
    message:
      `Agent selected ${finalSelected.length} relevant articles out of ` +
      `${inputArticles.length} inputs.`,
    reason: "Evaluated articles against business profile.",
  });

  return finalSelected;
}

async function loadNewsFeedSettings(uid: string): Promise<NewsFeedSettings> {
  const settingsSnap = await db.doc(`users/${uid}/settings/newsFeed`).get();
  if (!settingsSnap.exists) {
    return {
      systemPrompt: "",
      sources: [],
    };
  }

  const data = settingsSnap.data() as NewsFeedSettings;
  return {
    systemPrompt: data.systemPrompt || "",
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

async function cleanupFeedLifecycle(uid: string): Promise<void> {
  const now = Date.now();
  const activeSnap = await db.collection(`users/${uid}/feedItems`).get();

  for (const itemDoc of activeSnap.docs) {
    const data = itemDoc.data();
    const createdAt = timestampMillis(data.createdAt) ||
      timestampMillis(data.fetchedAt) ||
      timestampMillis(data.publishedAt);

    if (
      data.status !== "analyzed" &&
      createdAt !== null &&
      now - createdAt > IDLE_ARCHIVE_MS
    ) {
      const archiveRef = db.doc(
        `users/${uid}/archivedFeedItems/${itemDoc.id}`
      );
      await archiveRef.set({
        ...data,
        status: "archived",
        archiveReason: "idle_2_days",
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      await itemDoc.ref.delete();
    }
  }

  const archivedSnap = await db.collection(`users/${uid}/archivedFeedItems`)
    .get();
  for (const archiveDoc of archivedSnap.docs) {
    const data = archiveDoc.data();
    const archivedAt = timestampMillis(data.archivedAt) ||
      timestampMillis(data.createdAt);

    if (archivedAt !== null && now - archivedAt > ARCHIVE_DELETE_MS) {
      await archiveDoc.ref.delete();
    }
  }
}

async function upsertSelectedFeedItem(
  uid: string,
  item: AgentFeedSelection
): Promise<void> {
  const feedItemId = item.feedItemId || getFeedItemId(item);
  const userFeedRef = db.doc(`users/${uid}/feedItems/${feedItemId}`);
  const userFeedSnap = await userFeedRef.get();
  const existing = userFeedSnap.exists ? userFeedSnap.data() : {};

  const payload: FirebaseFirestore.DocumentData = {
    id: feedItemId,
    feedItemId,
    title: item.title,
    summary: item.summary,
    brief: item.brief,
    url: item.url || item.sourceUrl,
    canonicalUrl: item.canonicalUrl,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl || item.url,
    sourceId: item.sourceId,
    sourceType: item.sourceType,
    publishedAt: item.publishedAt,
    relevanceScore: item.relevanceScore,
    selectionReason: item.selectionReason,
    relevanceExplanation: item.selectionReason,
    reason: item.selectionReason,
    status: existing?.status || "unread",
    saved: existing?.saved === true,
    type: "agent_signal",
    isAgentSignal: true,
    fetchedAt: new Date().toISOString(),
    contentHash: generateHash(`${item.title}_${item.summary}`),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!userFeedSnap.exists) {
    payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await userFeedRef.set(payload, {merge: true});
}

async function refreshUserFeed(uid: string): Promise<IngestionResult> {
  await cleanupFeedLifecycle(uid);

  const settings = await loadNewsFeedSettings(uid);
  const profileSnap = await db.doc(`users/${uid}/profile/main`).get();
  const profile = profileSnap.exists ? profileSnap.data() || {} : {};
  const sourceQueryPrompt =
    profile.newsSystemPrompt ||
    profile.systemPrompt ||
    settings.systemPrompt ||
    DEFAULT_NEWS_PROMPT;
  const configuredSources = Array.isArray(settings.sources) &&
    settings.sources.length > 0 ?
    settings.sources :
    (Array.isArray(profile.newsSources) ? profile.newsSources : []);
  const sources = resolveSources({
    ...settings,
    systemPrompt: sourceQueryPrompt,
    sources: configuredSources,
  });
  const syncLogs: SyncLog[] = [];
  const rawArticles: FeedArticleDraft[] = [];

  if (sources.length === 0) {
    syncLogs.push({
      type: "pull",
      sourceName: "News Sources",
      status: "failed",
      errorType: "No Sources Enabled",
      message: "No enabled news sources found. Ingestion stopped.",
      reason: "News aggregation stopped as no sources are enabled.",
    });

    await db.doc(`users/${uid}/settings/newsFeed`).set({
      systemPrompt: settings.systemPrompt || "",
      sources: configuredSources,
      lastRefreshAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});

    return {
      status: "empty",
      items: [],
      syncLogs,
    };
  }

  for (const source of sources) {
    try {
      const result = await fetchSource(source);
      rawArticles.push(...result.articles);
      syncLogs.push(result.syncLog);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Failed to fetch ${source.name}:`, error);
      syncLogs.push({
        type: "pull",
        sourceName: source.name || "News Source",
        status: "failed",
        errorType: "Fetch Error",
        message: error.message,
        reason: "Remote feed request failed. No content was selected.",
      });
    }
  }

  const selectedItems = await selectFeedItemsWithAgent({
    uid,
    articles: rawArticles,
    syncLogs,
  });

  for (const selectedItem of selectedItems) {
    await upsertSelectedFeedItem(uid, selectedItem);
  }

  await db.doc(`users/${uid}/settings/newsFeed`).set({
    systemPrompt: settings.systemPrompt || "",
    sources: configuredSources,
    lastRefreshAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return {
    status: selectedItems.length > 0 ? "success" : "empty",
    items: selectedItems.map((item) => ({
      feedItemId: item.feedItemId,
      title: item.title,
      summary: item.summary,
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
      relevanceScore: item.relevanceScore,
      selectionReason: item.selectionReason,
      brief: item.brief,
    })),
    syncLogs,
  };
}

export async function processIngestion(
  uid?: string
): Promise<IngestionResult> {
  if (!uid) {
    throw new HttpsError("invalid-argument", "User id is required.");
  }
  return refreshUserFeed(uid);
}

export const ingestNewsTick = onSchedule("every 12 hours", async () => {
  console.log("Starting scheduled user news ingestion...");
  const usersSnap = await db.collection("users").get();
  let selectedCount = 0;
  let refreshedCount = 0;

  for (const userDoc of usersSnap.docs) {
    try {
      const result = await refreshUserFeed(userDoc.id);
      selectedCount += result.items.length;
      refreshedCount++;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`Feed refresh failed for user ${userDoc.id}:`, error);
    }
  }

  console.log(
    `Finished scheduled ingestion. Refreshed ${refreshedCount} users. ` +
      `Selected ${selectedCount} relevant items.`
  );
});

export const getContentFeed = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to refresh the content feed."
    );
  }

  return refreshUserFeed(request.auth.uid);
});
