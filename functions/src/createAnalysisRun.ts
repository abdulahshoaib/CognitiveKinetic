import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { runAgentPipeline } from "./agentWorker";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface CreateAnalysisRunRequest {
  content: string;
  sourceItemId?: string;
}

interface ArticleSnapshot {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
  brief: string;
}

/**
 * Builds an article snapshot from Firestore document data.
 * @param {FirebaseFirestore.DocumentData | undefined} data The data.
 * @return {ArticleSnapshot | null} The snapshot.
 */
function buildArticleSnapshot(
  data: FirebaseFirestore.DocumentData | undefined
): ArticleSnapshot | null {
  if (!data) return null;
  return {
    title: String(data.title || "Untitled content"),
    url: String(data.url || data.sourceUrl || ""),
    sourceName: String(data.sourceName || "Content source"),
    publishedAt: data.publishedAt ? String(data.publishedAt) : null,
    brief: String(data.brief || data.summary || data.body || "").slice(0, 500),
  };
}

export const createAnalysisRun = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to call this endpoint."
    );
  }

  const {content, sourceItemId} = request.data as CreateAnalysisRunRequest;
  const uid = request.auth.uid;

  if (!content || typeof content !== "string" || content.length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "Content must be provided and cannot be empty."
    );
  }

  if (content.length > 50000) {
    throw new HttpsError(
      "invalid-argument",
      "Content length must be under 50,000 characters."
    );
  }

  const db = admin.firestore();

  // Rate limiting: max 5 analysis requests per minute per user
  const rateLimitRef = db.doc(`users/${uid}/rateLimit/analysis`);
  const rateLimitSnap = await rateLimitRef.get();
  const now = Date.now();
  const rateLimitData = rateLimitSnap.data() || { count: 0, windowStart: now };
  const windowAge = now - (rateLimitData.windowStart || now);

  if (windowAge < 60000) {
    // Still in current window
    if (rateLimitData.count >= 5) {
      throw new HttpsError(
        "resource-exhausted",
        "Too many analysis requests. Maximum 5 per minute. Please wait before trying again."
      );
    }
  }

  // Fetch Profile
  const profileRef = db.doc(`users/${uid}/profile/main`);
  const profileSnap = await profileRef.get();

  if (!profileSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "User profile not found. Please complete onboarding."
    );
  }

  // Validate profile has required fields
  const profileData = profileSnap.data();
  if (!profileData?.businessName || !profileData?.industry) {
    throw new HttpsError(
      "failed-precondition",
      "User profile incomplete. Business name and industry are required."
    );
  }
  // Profile fetch verification only

  let articleSnapshot: ArticleSnapshot | null = null;
  if (sourceItemId) {
    const sourceItemSnap = await db.doc(
      `users/${uid}/feedItems/${sourceItemId}`
    ).get();
    articleSnapshot = buildArticleSnapshot(
      sourceItemSnap.exists ? sourceItemSnap.data() : undefined
    );
  }

  // Create Durable State
  const runRef = db.collection(`users/${uid}/analysisRuns`).doc();
  const runId = runRef.id;

  await runRef.set({
    status: "queued",
    currentStage: "loading_profile",
    profileSnapshot: profileSnap.data() || null,
    sourceItemId: sourceItemId || null,
    articleSnapshot,
    sourceContent: content,
    signals: [],
    relevance: null,
    insights: [],
    impact: null,
    recommendedActions: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null,
  });

  // Audit Log
  const logRef = db.collection(`users/${uid}/analysisRuns/${runId}/logs`).doc();
  await logRef.set({
    message: "Analysis initialized. Dispatching execution task.",
    stage: "orchestrator",
    level: "info",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Call Execution Pipeline Inline Synchronously (eliminates Cloud Task Queue dependency)
  try {
    await runAgentPipeline(runId, uid);
  } catch (pipelineErr) {
    console.error("Inline pipeline execution failed:", pipelineErr);
  }

  // Update rate limit
  const newWindowStart = windowAge >= 60000 ? now : rateLimitData.windowStart;
  const newCount = windowAge >= 60000 ? 1 : (rateLimitData.count || 0) + 1;
  await rateLimitRef.set({
    count: newCount,
    windowStart: newWindowStart,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return {runId};
});
