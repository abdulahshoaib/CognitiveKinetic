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

    try {
      const runRef = db.doc(`users/${uid}/analysisRuns/${runId}`);
      const runSnap = await runRef.get();

      if (!runSnap.exists) {
        await db.doc(`users/${uid}/analysisRuns/${runId}`).update({
          status: 'failed',
          currentStage: 'error',
          errorMessage: 'Analysis run document not found',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
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
    
    // Update to signals stage
    await runRef.update({
      currentStage: "signals",
      signals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
        "Is this relevant to the business? Analyze the signals against the profile. " +
        "Return a JSON object with 'score' (0 to 100) and 'explanation'. " +
        "A score of 75+ means it is highly relevant and actionable.",
      output: {
        schema: z.object({
          score: z.number().describe("Relevance score between 0 and 100."),
          explanation: z.string().describe("Explanation for why it is relevant or not."),
        })
      }
    });
    
    let relevanceScore = relevanceResponse.output?.score;
    let relevanceExplanation = relevanceResponse.output?.explanation;

    // Fallback parsing in case the LLM output is not perfectly structured by Genkit
    if (relevanceScore === undefined || relevanceScore === null) {
      try {
        const text = relevanceResponse.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          relevanceScore = parsed.score ?? parsed.relevanceScore ?? 0;
          relevanceExplanation = parsed.explanation ?? parsed.reason ?? parsed.selectionReason;
        }
      } catch (err) {
        console.error("Fallback relevance parsing failed:", err);
      }
    }

    if (relevanceScore === undefined || relevanceScore === null) {
      relevanceScore = 0;
    }
    if (!relevanceExplanation) {
      relevanceExplanation = relevanceResponse.text || "No explanation provided.";
    }
    
    // Ensure score is within 0-100 bounds
    relevanceScore = Math.max(0, Math.min(100, relevanceScore));
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
      relevance: {score: relevanceScore, explanation: relevanceExplanation},
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const insightResponse = await ai.generate({
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And these signals extracted from the event:\n${signals.join("\n")}\n\n` +
        `And this relevance analysis:\n${relevanceExplanation}\n\n` +
        "Generate a highly specific, actionable operational insight that the business should consider. " +
        "Focus on practical implications and operational impact for their specific industry and location.",
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
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And these operational insights:\n${insights.join("\n")}\n\n` +
        "Analyze the business impact of these insights on our operations, costs, margins, and customers. " +
        "Provide a detailed impact breakdown, then categorize the severity level as low, medium, or high.",
      output: {
        schema: z.object({
          level: z.enum(["low", "medium", "high"]).describe("The business impact severity level."),
          details: z.string().describe("Detailed description of the operational impact."),
        })
      }
    });
    const impact = {
      level: impactResponse.output?.level || "medium",
      details: impactResponse.output?.details || "Impact analysis compiled."
    };
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
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And the analyzed operational impact:\n${impact.details}\n\n` +
        "Recommend 1-2 concrete actions that the business can immediately execute. Return JSON matching schema: " +
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      try {
        await db.doc(`users/${uid}/analysisRuns/${runId}`).update({
          status: 'failed',
          currentStage: 'error',
          errorMessage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await addLog(db, uid, runId, 'error', `Pipeline error: ${errorMessage}`);
      } catch (updateError) {
        // Silently fail if update fails
      }
      throw error;
    }
  }
);
