import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

interface BusinessProfile {
  businessName?: string;
  industry?: string;
  locations?: string | string[];
  keyConcerns?: string | string[];
  targetAudience?: string;
  primaryGoal?: string;
  goals?: string;
  riskSensitivity?: string;
}

/**
 * Cloud Function: analyzeBusinessContext
 * Generates an LLM-powered summary of a business profile.
 * Called when user saves their profile to provide AI-generated insights.
 */
export const analyzeBusinessContext = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to call this endpoint."
    );
  }

  const { profile } = request.data as { profile: BusinessProfile };
  const uid = request.auth.uid;

  if (!profile || typeof profile !== "object") {
    throw new HttpsError(
      "invalid-argument",
      "Profile object is required."
    );
  }

  // Build a comprehensive prompt from the profile
  const businessName = profile.businessName || "Your business";
  const industry = profile.industry || "Unspecified industry";
  const locations = Array.isArray(profile.locations)
    ? profile.locations.join(", ")
    : (profile.locations || "Unspecified locations");
  const concerns = Array.isArray(profile.keyConcerns)
    ? profile.keyConcerns.join(", ")
    : (profile.keyConcerns || "Not specified");
  const audience = profile.targetAudience || "Not specified";
  const goal = profile.goals || profile.primaryGoal || "Not specified";
  const risk = profile.riskSensitivity || "Medium";

  const profileText = [
    `Business Name: ${businessName}`,
    `Industry: ${industry}`,
    `Operating Locations: ${locations}`,
    `Key Concerns/Risks: ${concerns}`,
    `Target Audience: ${audience}`,
    `Primary Goal/Strategy: ${goal}`,
    `Risk Sensitivity: ${risk}`,
  ].join("\n");

  const prompt = [
    "You are a business strategy and operations intelligence analyst.",
    "Analyze the following business profile and provide a concise executive summary.",
    "Focus on:",
    "1. Business Overview: What type of operation is this?",
    "2. Key Vulnerabilities: What are the main risks based on the profile?",
    "3. Operational Impact: How could market news affect this business?",
    "4. Recommended Focus: What types of external signals matter most?",
    "",
    "BUSINESS PROFILE:",
    profileText,
    "",
    "Provide analysis in JSON format with clear, actionable insights.",
    "Keep each section to 1-2 sentences maximum for clarity.",
  ].join("\n");

  try {
    const response = await ai.generate({
      prompt,
      output: {
        schema: z.object({
          businessOverview: z
            .string()
            .describe("2-3 sentence description of the business type and operations."),
          keyVulnerabilities: z
            .array(z.string())
            .describe("Array of 3-5 key vulnerabilities or risk areas."),
          operationalImpactAreas: z
            .array(z.string())
            .describe("Array of 4-6 operational areas most affected by external news (e.g., supply chain, pricing, compliance)."),
          recommendedSignals: z
            .string()
            .describe("Summary of what types of market signals and news to prioritize."),
          decisionVelocity: z
            .enum(["high", "medium", "low"])
            .describe("How quickly the business needs to react to market changes based on risk sensitivity."),
        }),
      },
    });

    const analysis = response.output;

    // Store the analysis in Firestore for reference
    const db = admin.firestore();
    const contextRef = db.doc(`users/${uid}/profile/businessContext`);
    await contextRef.set(
      {
        ...analysis,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        profileSnapshot: {
          businessName,
          industry,
          locations,
        },
      },
      { merge: true }
    );

    return {
      success: true,
      analysis,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Business context analysis failed:", err);
    throw new HttpsError(
      "internal",
      "Failed to analyze business context. Please try again."
    );
  }
});
