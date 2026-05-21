/**
 * Client-side RSS feed ingestion with heuristic relevance scoring.
 * Fallback when Cloud Functions (getContentFeed) are not deployed.
 *
 * Flow: resolve sources → fetch RSS → parse XML → deduplicate →
 *       score relevance against saved profile → return sorted items.
 */

import { getProfile } from './profileService';
import { createHash } from '../utils/hashUtils';

// ─── Source Registry ───────────────────────────────────────────────

const QUERY_SOURCES = {
  google_news: {
    id: 'google_news',
    name: 'Google News',
    type: 'google_news',
    buildUrl: (query) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`,
  },
  bing_news: {
    id: 'bing_news',
    name: 'Bing News',
    type: 'bing_news',
    buildUrl: (query) =>
      `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`,
  },
};

const STATIC_SOURCES = {
  hackernews: {
    id: 'hackernews', name: 'Hacker News', type: 'hackernews',
    url: 'https://hnrss.org/frontpage',
  },
  dawn: {
    id: 'dawn', name: 'Dawn News', type: 'dawn',
    url: 'https://www.dawn.com/feeds/home',
  },
  geo: {
    id: 'geo', name: 'Geo News', type: 'geo',
    url: 'https://www.geo.tv/rss/1/1',
  },
  express_tribune: {
    id: 'express_tribune', name: 'Express Tribune', type: 'express_tribune',
    url: 'https://tribune.com.pk/feed/home',
  },
  ary: {
    id: 'ary', name: 'ARY News', type: 'ary',
    url: 'https://arynews.tv/feed/',
  },
  business_recorder: {
    id: 'business_recorder', name: 'Business Recorder', type: 'business_recorder',
    url: 'https://www.brecorder.com/feeds/latest-news',
  },
};

const REDDIT_BASE = 'https://www.reddit.com/r/';

// ─── XML Helpers ───────────────────────────────────────────────────

function cleanXML(str) {
  return (str || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function truncate(s, max) {
  return s.length <= max ? s : s.slice(0, max - 1).trim() + '...';
}

// ─── RSS Parser ────────────────────────────────────────────────────

function parseRSS(xmlText, source) {
  const items = [];
  const sourceName = source.name || 'News';

  // RSS 2.0
  const rssItems = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  if (rssItems) {
    for (const itemXml of rssItems) {
      const title = (itemXml.match(/<title>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/) || [])[2] || '';
      const desc = (itemXml.match(/<description>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/description>/) || [])[2] || '';
      const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const guid = (itemXml.match(/<guid[\s\S]*?>([\s\S]*?)<\/guid>/) || [])[1] || link;
      const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';

      items.push({
        title: cleanXML(title),
        summary: cleanXML(desc),
        url: link.trim(),
        canonicalUrl: cleanXML(guid),
        publishedAt: toIsoDate(pubDate.trim()),
        sourceName,
        sourceId: source.id,
        sourceType: source.type,
      });
    }
  }

  // Atom fallback
  if (items.length === 0) {
    const atomEntries = xmlText.match(/<entry>([\s\S]*?)<\/entry>/g);
    if (atomEntries) {
      for (const entryXml of atomEntries) {
        const title = (entryXml.match(/<title[\s\S]*?>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/title>/) || [])[2] || '';
        const summary = (entryXml.match(/<summary[\s\S]*?>(<!\[CDATA\[)?([\s\S]*?)(\]\]>)?<\/summary>/) || [])[2] || '';
        const linkMatch = entryXml.match(/<link[\s\S]*?href=["']([\s\S]*?)["']/);
        const link = linkMatch ? linkMatch[1] : '';
        const id = (entryXml.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || link;
        const updated = (entryXml.match(/<updated>([\s\S]*?)<\/updated>/) || [])[1] || '';

        items.push({
          title: cleanXML(title),
          summary: cleanXML(summary),
          url: link.trim(),
          canonicalUrl: cleanXML(id),
          publishedAt: toIsoDate(updated.trim()),
          sourceName,
          sourceId: source.id,
          sourceType: source.type,
        });
      }
    }
  }

  return items.filter((i) => i.title.length > 0);
}

// ─── Source Resolution ─────────────────────────────────────────────

function resolveSources(configuredSources, queryPrompt) {
  const resolved = [];
  if (!Array.isArray(configuredSources) || configuredSources.length === 0) return resolved;
  let googleAdded = false;

  for (const src of configuredSources) {
    if (src.enabled === false) continue;
    const type = src.type || src.providerId || 'custom_rss';

    // Query-based sources
    const querySrc = QUERY_SOURCES[type];
    if (querySrc) {
      if (type === 'google_news' && googleAdded) continue;
      if (type === 'google_news') googleAdded = true;
      resolved.push({
        ...querySrc,
        ...src,
        id: src.id || querySrc.id,
        name: src.name || querySrc.name,
        url: querySrc.buildUrl(queryPrompt || 'business news'),
      });
      continue;
    }

    // Reddit
    if (type === 'reddit') {
      const subreddit = String(src.subreddit || '').replace(/^\/?r\//i, '').trim();
      if (!subreddit) continue;
      resolved.push({
        ...src,
        id: src.id || `reddit_${subreddit.toLowerCase()}`,
        name: src.name || `r/${subreddit}`,
        url: `${REDDIT_BASE}${subreddit}.rss`,
      });
      continue;
    }

    // Static known sources
    const staticSrc = STATIC_SOURCES[type];
    if (staticSrc) {
      resolved.push({
        ...staticSrc,
        ...src,
        id: src.id || staticSrc.id,
        name: src.name || staticSrc.name,
        url: staticSrc.url,
      });
      continue;
    }

    // Custom RSS
    const url = src.sourceUrl || src.url;
    if (type === 'custom_rss' && url) {
      resolved.push({
        ...src,
        id: src.id || createHash(url),
        name: src.name || 'Custom RSS',
        url,
      });
    }
  }

  return resolved;
}

// ─── Fetch a Single Source ─────────────────────────────────────────

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(source.url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    return {
      articles: parseRSS(text, source),
      log: {
        type: 'pull', sourceName: source.name, status: 'success',
        message: `Fetched successfully.`,
      },
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      articles: [],
      log: {
        type: 'pull', sourceName: source.name, status: 'failed',
        errorType: 'Fetch Error', message: err.message,
        reason: 'RSS endpoint unreachable or returned invalid data.',
      },
    };
  }
}

// ─── Heuristic Relevance Scoring ───────────────────────────────────

const MIN_RELEVANCE = 70;
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

function scoreRelevance(article, profile) {
  const titleL = (article.title || '').toLowerCase();
  const summaryL = (article.summary || '').toLowerCase();
  const combined = titleL + ' ' + summaryL;

  const concerns = (profile.keyConcerns || profile.concerns || '').toLowerCase();
  const locations = (
    Array.isArray(profile.locations)
      ? profile.locations.join(', ')
      : (profile.locations || '')
  ).toLowerCase();
  const industry = (profile.industry || profile.domain || '').toLowerCase();
  const goals = (profile.goals || profile.primaryGoal || '').toLowerCase();

  let score = 0;
  let reason = '';

  // Location match
  const locMatch = locations.split(',').some((loc) => {
    const t = loc.trim();
    return t.length > 2 && combined.includes(t);
  });

  // Concern match
  const concernMatch = concerns.split(',').some((c) => {
    const t = c.trim();
    return t.length > 3 && combined.includes(t);
  });

  // Industry match
  const industryMatch = industry.length > 2 && combined.includes(industry);

  // Goal match
  const goalMatch = goals.split(',').some((g) => {
    const t = g.trim();
    return t.length > 3 && combined.includes(t);
  });

  // Keyword categories
  const isFuel = /fuel|petrol|diesel|cng|gasoline|power|electricity|energy price/i.test(combined);
  const isTax = /tax|duty|levy|tariff|budget|policy|regulation|ban|compliance/i.test(combined);
  const isLogistics = /smog|weather|strike|traffic|shutdown|lockdown|transport|delivery|logistics|supply chain/i.test(combined);
  const isEconomy = /inflation|interest rate|currency|rupee|dollar|import|export|trade|GDP/i.test(combined);

  if (isFuel) {
    score = locMatch ? 92 : 82;
    reason = 'Fuel/energy price change detected — impacts operational costs.';
  } else if (isLogistics) {
    score = locMatch ? 88 : 80;
    reason = 'Logistics/transit disruption — may affect delivery routes and timing.';
  } else if (isTax) {
    score = locMatch ? 85 : 78;
    reason = 'Regulatory/tax policy change — compliance or cost impact.';
  } else if (isEconomy) {
    score = locMatch ? 83 : 76;
    reason = 'Macro-economic signal — potential impact on margins and pricing.';
  } else if (concernMatch) {
    score = locMatch ? 82 : 76;
    reason = 'Matches configured business concern keywords.';
  } else if (industryMatch && locMatch) {
    score = 78;
    reason = 'Industry + location match against saved profile.';
  } else if (goalMatch && locMatch) {
    score = 75;
    reason = 'Matches strategic goals and operating location.';
  } else if (industryMatch) {
    score = 72;
    reason = 'Industry match against saved profile.';
  }

  return { score, reason };
}

// ─── Main: Client-Side Feed Ingestion ──────────────────────────────

export async function clientFeedIngestion(uid, configuredSources, systemPrompt) {
  const syncLogs = [];

  // Load profile
  let profile = {};
  try {
    profile = (await getProfile(uid)) || {};
  } catch (e) {
    console.warn('clientFeedIngestion: profile load failed', e);
  }

  const queryPrompt =
    profile.newsSystemPrompt ||
    profile.systemPrompt ||
    systemPrompt ||
    'business operations logistics fuel tax policy';

  // Resolve sources
  const sources = resolveSources(configuredSources, queryPrompt);

  if (sources.length === 0) {
    syncLogs.push({
      type: 'pull', sourceName: 'News Sources', status: 'failed',
      errorType: 'No Sources',
      message: 'No enabled news sources configured.',
      reason: 'Configure sources in Profile Settings → News.',
    });
    return { status: 'empty', items: [], syncLogs };
  }

  // Fetch all sources in parallel
  const results = await Promise.all(sources.map(fetchSource));
  let allArticles = [];
  for (const r of results) {
    allArticles.push(...r.articles);
    syncLogs.push(r.log);
  }

  // Filter: only articles from last 2 months
  const cutoff = Date.now() - TWO_MONTHS_MS;
  allArticles = allArticles.filter((a) => {
    const t = Date.parse(a.publishedAt);
    return !Number.isNaN(t) && t >= cutoff;
  });

  // Deduplicate by title
  const seen = new Set();
  allArticles = allArticles.filter((a) => {
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by recency
  allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Take top 40 for scoring
  const candidates = allArticles.slice(0, 40);

  // Score each article
  const scored = [];
  for (const article of candidates) {
    const { score, reason } = scoreRelevance(article, profile);
    if (score >= MIN_RELEVANCE) {
      scored.push({
        id: createHash(article.canonicalUrl || article.url || article.title),
        feedItemId: createHash(article.canonicalUrl || article.url || article.title),
        title: article.title,
        summary: truncate(article.summary || '', 400),
        brief: truncate(reason, 280),
        body: article.summary || '',
        url: article.url,
        sourceUrl: article.url,
        canonicalUrl: article.canonicalUrl,
        sourceName: article.sourceName,
        sourceId: article.sourceId,
        sourceType: article.sourceType || 'rss',
        publishedAt: article.publishedAt,
        relevanceScore: score,
        selectionReason: reason,
        relevanceExplanation: reason,
        relevanceStatus: score >= 80 ? 'high-impact' : 'relevant',
        status: 'unread',
        saved: false,
        type: 'agent_signal',
        isAgentSignal: true,
        createdAt: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Sort by relevance
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const finalItems = scored.slice(0, 15);

  syncLogs.push({
    type: 'pull', sourceName: 'Client Selection',
    status: 'success',
    message: `Selected ${finalItems.length} relevant from ${candidates.length} candidates.`,
    reason: 'Evaluated articles against saved profile using keyword heuristics.',
  });

  return {
    status: finalItems.length > 0 ? 'success' : 'empty',
    items: finalItems,
    syncLogs,
  };
}
