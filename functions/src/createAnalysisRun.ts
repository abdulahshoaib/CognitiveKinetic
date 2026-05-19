import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {getFunctions} from "firebase-admin/functions";

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

  // Fetch Profile
  const profileRef = db.doc(`users/${uid}/profile/main`);
  const profileSnap = await profileRef.get();

  if (!profileSnap.exists) {
    throw new HttpsError(
      "failed-precondition",
      "User profile not found. Please complete onboarding."
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

  // Enqueue Execution Task
  const queue = getFunctions().taskQueue("agentWorker");
  await queue.enqueue({runId, uid});

  return {runId};
});
