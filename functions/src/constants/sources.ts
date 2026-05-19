import type {FeedSource} from "./types";

export const QUERY_FEED_SOURCES: Record<string, FeedSource> = {
  google_news: {
    id: "google_news",
    name: "Google News",
    type: "google_news",
    url: "https://news.google.com/rss/search?q={{query}}&hl=en-PK&gl=PK&ceid=PK:en",
    language: "en",
    country: "PK",
  },
  bing_news: {
    id: "bing_news",
    name: "Bing News",
    type: "bing_news",
    url: "https://www.bing.com/news/search?q={{query}}&format=rss",
    language: "en",
    country: "PK",
  },
};

export const INTERNATIONAL_FEED_SOURCES: Record<string, FeedSource> = {
  hackernews: {
    id: "hackernews",
    name: "Hacker News",
    type: "hackernews",
    url: "https://hnrss.org/frontpage",
    language: "en",
    country: "US",
  },
};

export const REDDIT_FEED_SOURCE: FeedSource = {
  id: "reddit",
  name: "Reddit",
  type: "reddit",
  url: "https://www.reddit.com/r/{{subreddit}}.rss",
  language: "en",
  country: "US",
};

export const PAKISTAN_FEED_SOURCES: Record<string, FeedSource> = {
  dawn: {
    id: "dawn",
    name: "Dawn News",
    type: "dawn",
    url: "https://www.dawn.com/feeds/home",
    language: "en",
    country: "PK",
  },
  geo: {
    id: "geo",
    name: "Geo News",
    type: "geo",
    url: "https://www.geo.tv/rss/1/1",
    language: "en",
    country: "PK",
  },
  express_tribune: {
    id: "express_tribune",
    name: "Express Tribune",
    type: "express_tribune",
    url: "https://tribune.com.pk/feed/home",
    language: "en",
    country: "PK",
  },
  ary: {
    id: "ary",
    name: "ARY News",
    type: "ary",
    url: "https://arynews.tv/feed/",
    language: "en",
    country: "PK",
  },
  business_recorder: {
    id: "business_recorder",
    name: "Business Recorder",
    type: "business_recorder",
    url: "https://www.brecorder.com/feeds/latest-news",
    language: "en",
    country: "PK",
  },
};

export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  {
    id: "google_news_profile",
    name: "Google News",
    type: "google_news",
    language: "en",
    country: "PK",
  },
];
