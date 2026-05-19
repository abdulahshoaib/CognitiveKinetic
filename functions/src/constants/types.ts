export interface FeedSource {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  sourceUrl?: string;
  providerId?: string;
  subreddit?: string;
  apiKey?: string;
  enabled?: boolean;
  language?: string;
  country?: string;
}

export interface FeedArticleDraft {
  title: string;
  summary: string;
  url: string;
  canonicalUrl: string;
  sourceName: string;
  sourceId?: string;
  sourceType?: string;
  publishedAt: string;
  language: string;
  country: string;
}

export interface FeedItem extends FeedArticleDraft {
  brief: string;
  sourceUrl: string;
  fetchedAt: string;
  contentHash: string;
}

export interface UserProfile {
  domain?: string;
  businessName?: string;
  organizationName?: string;
  industry?: string;
  concerns?: string | string[];
  goals?: string | string[];
  locations?: string | string[];
  riskSensitivity?: string;
}

export interface NewsFeedSettings {
  systemPrompt?: string;
  sources?: FeedSource[];
}

export interface SyncLog {
  type: "pull";
  sourceName: string;
  status: "success" | "failed";
  message: string;
  reason: string;
  errorType?: string;
}

export interface ProcessedFeedItem {
  feedItemId: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  relevanceScore: number;
  selectionReason: string;
  brief: string;
}

export interface AgentFeedSelection extends ProcessedFeedItem {
  url: string;
  canonicalUrl: string;
  sourceId?: string;
  sourceType?: string;
}

export interface IngestionResult {
  status: "success" | "empty";
  items: ProcessedFeedItem[];
  syncLogs: SyncLog[];
}
