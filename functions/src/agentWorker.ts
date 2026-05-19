import {onTaskDispatched} from "firebase-functions/v2/tasks";
import * as admin from "firebase-admin";
import {genkit, z} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

/**
 * Records progress for the report timeline.
 * @param {FirebaseFirestore.Firestore} db Firestore instance.
 * @param {string} uid User id.
 * @param {string} runId Analysis run id.
 * @param {string} stage Pipeline stage.
 * @param {string} message Log message.
 * @return {Promise<void>} Write completion.
 */
async function addLog(
  db: FirebaseFirestore.Firestore,
  uid: string,
  runId: string,
  stage: string,
  message: string
): Promise<void> {
  await db.collection(`users/${uid}/analysisRuns/${runId}/logs`).add({
    message,
    stage,
    level: "info",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const agentWorker = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 60,
    },
  },
  async (request) => {
    const {runId, uid} = request.data as { runId: string; uid: string };
    const db = admin.firestore();

    const runRef = db.doc(`users/${uid}/analysisRuns/${runId}`);
    const runSnap = await runRef.get();

    if (!runSnap.exists) {
      console.error(`Analysis run ${runId} not found`);
      return;
    }

    const runData = runSnap.data();
    const content = runData?.sourceContent || "";

    const profileRef = db.doc(`users/${uid}/profile/main`);
    const profileSnap = await profileRef.get();
    const profile = profileSnap.data() || {};

    await runRef.update({
      status: "running",
      currentStage: "loading_profile",
      profileSnapshot: profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await addLog(db, uid, runId, "loading_profile", "Saved profile loaded.");

    // 1. Extract Signals
    await runRef.update({
      currentStage: "ingesting",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await addLog(db, uid, runId, "ingesting", "New content ingested.");
    const extractResponse = await ai.generate({
      prompt: `Extract key facts and signals from this content:\n${content}`,
    });
    const signals = [extractResponse.text];
    await addLog(
      db,
      uid,
      runId,
      "signals",
      "Signals extracted from content."
    );

    // 2. Check Relevance
    await runRef.update({
      currentStage: "relevance",
      signals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const relevanceResponse = await ai.generate({
      prompt: `Given this user profile:\n${JSON.stringify(profile)}\n\n` +
        `And these signals:\n${signals.join("\n")}\n\n` +
        "Is this relevant? Reply YES or NO, then explain.",
    });
    const relevance = relevanceResponse.text;
    await addLog(
      db,
      uid,
      runId,
      "relevance",
      "Relevance checked against saved profile."
    );

    // 3. Generate Insights
    await runRef.update({
      currentStage: "insights",
      relevance: {score: 80, explanation: relevance},
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const insightResponse = await ai.generate({
      prompt: "Generate an operational insight " +
        `based on the relevance explanation:\n${relevance}`,
    });
    const insights = [insightResponse.text];
    await addLog(
      db,
      uid,
      runId,
      "insights",
      "Operational insight generated."
    );

    // 4. Analyze Impact
    await runRef.update({
      currentStage: "impact",
      insights,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const impactResponse = await ai.generate({
      prompt: "Analyze the business impact of these insights:\n" +
        `${insights.join("\n")}`,
    });
    const impact = {level: "high", details: impactResponse.text};
    await addLog(
      db,
      uid,
      runId,
      "impact",
      "Impact analysis completed."
    );

    // 5. Recommend Actions
    await runRef.update({
      currentStage: "actions",
      impact,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const actionsResponse = await ai.generate({
      prompt: `Given the impact:\n${impact.details}\n\n` +
        "Recommend 1-2 concrete actions. Return JSON matching schema: " +
        "[{ id: string, title: string, description: string, " +
        "actionType: \"pricing_adjust\" | " +
        "\"route_shift\" | \"manual_review\", " +
        "simulationSupported: boolean }]",
      output: {
        schema: z.array(
          z.object({
            id: z.string().describe("Stable action id."),
            title: z.string().describe("Short action title."),
            description: z.string().describe("Practical action description."),
            actionType: z.string().describe(
              "One of pricing_adjust, route_shift, or manual_review."
            ),
            simulationSupported: z.boolean().describe(
              "True when the mock simulator can execute this action."
            ),
          })
        ),
      },
    });

    const recommendedActions = actionsResponse.output?.length ?
      actionsResponse.output :
      [{
        id: "pricing_adjust_001",
        title: "Adjust long-distance delivery fee",
        description: "Increase long-distance surcharge by Rs. 20.",
        actionType: "pricing_adjust",
        simulationSupported: true,
      }];
    await addLog(
      db,
      uid,
      runId,
      "actions",
      "Recommended actions created."
    );

    // Finalize
    await runRef.update({
      currentStage: "completed",
      status: "completed",
      recommendedActions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await addLog(db, uid, runId, "completed", "Updated report generated.");
  }
);
