import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import {
  buildFeedRefreshError,
  buildManualFeedItem,
  getSnapshotDocs,
  normalizeFeedRefreshResponse,
  timestampToIso,
} from '../utils/analysisContextUtils';

const NEWS_FEED_SETTINGS_PATH = 'newsFeed';
const ACTION_API_SETTINGS_PATH = 'actionApis';

const normalizeTimestampFields = (item) => ({
  ...item,
  createdAt: timestampToIso(item.createdAt) || item.createdAt || null,
  updatedAt: timestampToIso(item.updatedAt) || item.updatedAt || null,
  archivedAt: timestampToIso(item.archivedAt) || item.archivedAt || null,
});

const sortFeedItems = (items) => (
  items
    .filter((item) => item.status !== 'dismissed')
    .map(normalizeTimestampFields)
    .sort((a, b) => {
      // Primary sort: relevance score (highest first)
      const scoreDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (scoreDiff !== 0) return scoreDiff;

      // Secondary sort: published date (newest first)
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      const dateDiff = dateB - dateA;
      if (dateDiff !== 0) return dateDiff;

      // Tertiary sort: ID for deterministic ordering when scores and dates are equal
      return (a.id || '').localeCompare(b.id || '');
    })
);

export const listenUserFeedItems = (uid, onItems, onError) => {
  const feedColRef = collection(db, 'users', uid, 'feedItems');
  return onSnapshot(feedColRef, (snap) => {
    onItems(sortFeedItems(getSnapshotDocs(snap)));
  }, onError);
};

export const createManualFeedItem = async (uid, title, body) => {
  const feedColRef = collection(db, 'users', uid, 'feedItems');
  const itemRef = doc(feedColRef);
  const newItem = buildManualFeedItem(title, body);
  await setDoc(itemRef, newItem);
  return { id: itemRef.id, ...newItem };
};

export const addUserFeedItems = async (uid, items) => {
  const feedColRef = collection(db, 'users', uid, 'feedItems');
  for (const item of items) {
    const itemRef = doc(feedColRef);
    const { id, ...itemData } = item;
    await setDoc(itemRef, {
      ...itemData,
      createdAt: new Date().toISOString(),
    });
  }
};

export const refreshUserFeed = async (uid, configuredSources, systemPrompt) => {
  // Try Cloud Function first
  try {
    const getContentFeedCallable = httpsCallable(functions, 'getContentFeed');
    const res = await getContentFeedCallable({});
    return normalizeFeedRefreshResponse(res.data);
  } catch (cfError) {
    console.warn('Cloud Function getContentFeed unavailable, using client-side fallback:', cfError.message);
  }

  // Fallback: client-side RSS ingestion
  try {
    const { clientFeedIngestion } = await import('./clientFeedIngestion');
    return await clientFeedIngestion(uid, configuredSources, systemPrompt);
  } catch (fallbackError) {
    console.error('Client-side feed ingestion failed:', fallbackError);
    return buildFeedRefreshError(fallbackError);
  }
};

export const updateFeedItemSaved = async (uid, feedItemId, saved = true) => {
  const userFeedDocRef = doc(db, 'users', uid, 'feedItems', feedItemId);
  await setDoc(userFeedDocRef, {
    saved,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const updateFeedItemStatus = async (uid, feedItemId, status) => {
  const userFeedDocRef = doc(db, 'users', uid, 'feedItems', feedItemId);
  await setDoc(userFeedDocRef, {
    status,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

export const dismissUserFeedItem = async (uid, feedItemId) => {
  const userFeedDocRef = doc(db, 'users', uid, 'feedItems', feedItemId);
  await deleteDoc(userFeedDocRef);
};

export const getArchivedFeedItems = async (uid) => {
  const archivedColRef = collection(db, 'users', uid, 'archivedFeedItems');
  const snap = await getDocs(archivedColRef);
  return sortFeedItems(getSnapshotDocs(snap));
};

export const listenNewsFeedSettings = (uid, onSettings, onError) => {
  const settingsRef = doc(db, 'users', uid, 'settings', NEWS_FEED_SETTINGS_PATH);
  return onSnapshot(settingsRef, (snap) => {
    onSettings(snap.exists() ? snap.data() : null);
  }, onError);
};

export const saveNewsFeedSettings = async (uid, { systemPrompt, sources }) => {
  const settingsRef = doc(db, 'users', uid, 'settings', NEWS_FEED_SETTINGS_PATH);
  await setDoc(settingsRef, {
    systemPrompt,
    sources,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const listenActionApiSettings = (uid, onSettings, onError) => {
  const settingsRef = doc(db, 'users', uid, 'settings', ACTION_API_SETTINGS_PATH);
  return onSnapshot(settingsRef, (snap) => {
    onSettings(snap.exists() ? snap.data() : null);
  }, onError);
};

export const saveActionApiSettings = async (uid, { apis }) => {
  const settingsRef = doc(db, 'users', uid, 'settings', ACTION_API_SETTINGS_PATH);
  await setDoc(settingsRef, {
    apis,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
