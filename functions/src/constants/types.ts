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
  id: string;
  feedItemId: string;
  title: string;
  summary: string;
  brief: string;
  body: string;
  sourceName: string;
  sourceId?: string;
  sourceType?: string;
  url: string;
  sourceUrl: string;
  canonicalUrl: string;
  publishedAt: string;
  timestamp: string;
  relevanceScore: number;
  selectionReason: string;
  relevanceExplanation: string;
  relevanceStatus: "high-impact" | "relevant";
  reason: string;
  status: "unread" | "analyzing" | "analyzed" | "archived";
  saved: boolean;
  type: "agent_signal";
  isAgentSignal: boolean;
  detectedTopics: string[];
  createdAt: string;
  fetchedAt: string;
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
