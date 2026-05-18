/* eslint-disable require-jsdoc */
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import {
  DEFAULT_FEED_SOURCES,
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

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const DEFAULT_LANGUAGE = "en";
const DEFAULT_COUNTRY = "PK";
const IDLE_ARCHIVE_MS = 2 * 24 * 60 * 60 * 1000;
const ARCHIVE_DELETE_MS = 31 * 24 * 60 * 60 * 1000;
const MAX_AGENT_INPUT_ITEMS = 80;
const DEFAULT_NEWS_PROMPT =
  "Collect operationally relevant news that could affect costs, margins, " +
  "customer churn, market access, compliance, logistics, supply chains, " +
  "fuel, tax policy, pricing, or regional operations.";

function generateHash(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function cleanXML(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
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
  const systemPrompt = settings.systemPrompt || DEFAULT_NEWS_PROMPT;
  const configured = Array.isArray(settings.sources) &&
    settings.sources.length > 0 ?
    settings.sources :
    DEFAULT_FEED_SOURCES;
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

  return resolved.length > 0 ?
    resolved :
    resolveSources({systemPrompt, sources: DEFAULT_FEED_SOURCES});
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
}): Promise<AgentFeedSelection[]> {
  void input.uid;

  // Agent stub contract:
  // Replace with real agent call. Agent receives uid + parsed RSS articles.
  // Agent must load profile/settings/location from Firestore itself,
  // then return only selected relevant items in this exact shape.
  return input.articles.slice(0, MAX_AGENT_INPUT_ITEMS).map((article) => {
    const brief = truncate(article.summary || article.title, 280);
    return {
      feedItemId: getFeedItemId(article),
      title: article.title,
      summary: article.summary,
      sourceName: article.sourceName,
      sourceUrl: article.url,
      url: article.url,
      canonicalUrl: article.canonicalUrl,
      publishedAt: article.publishedAt,
      relevanceScore: 50,
      selectionReason:
        "Agent selection stub: replace with real Firestore-aware feed agent.",
      brief,
      sourceId: article.sourceId,
      sourceType: article.sourceType,
    };
  });
}

async function loadNewsFeedSettings(uid: string): Promise<NewsFeedSettings> {
  const settingsSnap = await db.doc(`users/${uid}/settings/newsFeed`).get();
  if (!settingsSnap.exists) {
    return {
      systemPrompt: DEFAULT_NEWS_PROMPT,
      sources: DEFAULT_FEED_SOURCES,
    };
  }

  const data = settingsSnap.data() as NewsFeedSettings;
  return {
    systemPrompt: data.systemPrompt || DEFAULT_NEWS_PROMPT,
    sources: Array.isArray(data.sources) ? data.sources : DEFAULT_FEED_SOURCES,
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
  const systemPrompt = settings.systemPrompt || DEFAULT_NEWS_PROMPT;
  const sources = resolveSources(settings);
  const syncLogs: SyncLog[] = [];
  const rawArticles: FeedArticleDraft[] = [];

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
  });

  for (const selectedItem of selectedItems) {
    await upsertSelectedFeedItem(uid, selectedItem);
  }

  await db.doc(`users/${uid}/settings/newsFeed`).set({
    systemPrompt,
    sources: settings.sources || DEFAULT_FEED_SOURCES,
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
