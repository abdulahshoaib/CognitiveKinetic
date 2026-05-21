import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

let aiInstance: ReturnType<typeof genkit> | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    aiInstance = genkit({
      plugins: [googleAI(apiKey ? { apiKey } : undefined)],
      model: googleAI.model("gemini-2.5-flash"),
    });
  }
  return aiInstance;
}

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

interface BusinessContextAnalysis {
  businessOverview: string;
  keyVulnerabilities: string[];
  operationalImpactAreas: string[];
  recommendedSignals: string;
  decisionVelocity: "high" | "medium" | "low";
}

function normalizeBusinessContextAnalysis(
  value: Partial<BusinessContextAnalysis> | undefined,
  fallback: BusinessContextAnalysis
): BusinessContextAnalysis {
  const velocity = String(value?.decisionVelocity || fallback.decisionVelocity)
    .toLowerCase();

  return {
    businessOverview: String(value?.businessOverview || fallback.businessOverview),
    keyVulnerabilities: Array.isArray(value?.keyVulnerabilities) && value.keyVulnerabilities.length > 0 ?
      value.keyVulnerabilities.map(String) :
      fallback.keyVulnerabilities,
    operationalImpactAreas: Array.isArray(value?.operationalImpactAreas) && value.operationalImpactAreas.length > 0 ?
      value.operationalImpactAreas.map(String) :
      fallback.operationalImpactAreas,
    recommendedSignals: String(value?.recommendedSignals || fallback.recommendedSignals),
    decisionVelocity: velocity === "high" || velocity === "low" ? velocity : "medium",
  };
}

/**
 * Cloud Function: analyzeBusinessContext
 * Generates an LLM-powered summary of a business profile.
 * Called when user saves their profile to provide AI-generated insights.
 */
export const analyzeBusinessContext = onCall({ secrets: ["GEMINI_API_KEY"] }, async (request) => {
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const hasApiKey = !!apiKey;

  const defaultAnalysis: BusinessContextAnalysis = {
    businessOverview: `${businessName} operates in ${industry} across ${locations}.`,
    keyVulnerabilities: [
      "Input cost changes that affect operating margins.",
      "Regional policy or compliance changes.",
      "Customer demand shifts and competitive pressure.",
    ],
    operationalImpactAreas: [
      "Cost Management",
      "Pricing Strategy",
      "Operations Planning",
      "Customer Retention",
    ],
    recommendedSignals: "Monitor market, policy, pricing, supply, and regional operations updates.",
    decisionVelocity: "medium",
  };

  let analysis: BusinessContextAnalysis = defaultAnalysis;

  try {
    if (hasApiKey && apiKey) {
      const ai = getAI();
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

      analysis = normalizeBusinessContextAnalysis(response.output || undefined, defaultAnalysis);
    } else {
      console.warn("No Gemini API key found for business context analysis. Using high-fidelity heuristic fallback.");
      const isDeliveryOrLogistics =
        industry.toLowerCase().includes("delivery") ||
        industry.toLowerCase().includes("logistics") ||
        industry.toLowerCase().includes("transport") ||
        industry.toLowerCase().includes("supply chain");

      if (isDeliveryOrLogistics) {
        analysis = normalizeBusinessContextAnalysis({
          businessOverview: `${businessName} is a logistical operations business specialized in delivery and transportation services across ${locations}.`,
          keyVulnerabilities: [
            "Volatility in fuel prices impacting transportation overheads.",
            `Logistical transit delays caused by traffic and regional constraints in ${locations}.`,
            "Intense competition causing delivery margin compression.",
          ],
          operationalImpactAreas: [
            "Logistics & Delivery Costs",
            "Operational Margin Management",
            "Fleet Distribution & Efficiency",
            "Customer Churn & Service Levels",
          ],
          recommendedSignals: "Monitors fuel prices, local transit regulations, smog or weather bans, and regional traffic updates.",
          decisionVelocity: "high" as const,
        }, defaultAnalysis);
      } else {
        analysis = normalizeBusinessContextAnalysis({
          businessOverview: `${businessName} is a customer-focused enterprise operating in the ${industry} sector within ${locations}.`,
          keyVulnerabilities: [
            "Input cost inflation and rising operational overheads.",
            `Regional regulatory compliance and operational requirements in ${locations}.`,
            "Shifts in customer demand patterns and competitor pricing strategy.",
          ],
          operationalImpactAreas: [
            "Input & Material Costs",
            "Local Regulatory Compliance",
            "Strategic Pricing Models",
            "Customer Engagement & Experience",
          ],
          recommendedSignals: "Monitors industry policy changes, inflation indexes, competitor moves, and regional consumer sentiment.",
          decisionVelocity: "medium" as const,
        }, defaultAnalysis);
      }
    }

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
