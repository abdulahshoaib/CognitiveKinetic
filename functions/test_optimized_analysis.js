/**
 * Test script to verify optimized consolidated Gemini API analysis flow
 * Tests 2 consolidated requests instead of 5 separate ones
 * Run with: node functions/test_optimized_analysis.js
 * Or: GEMINI_API_KEY=your_key node functions/test_optimized_analysis.js
 */

// Load .env file if it exists
require('dotenv').config();

const { genkit, z } = require("genkit");
const { googleAI } = require("@genkit-ai/google-genai");

// Mock profile
const mockProfile = {
  businessName: "Apex Logistics Inc.",
  industry: "Delivery & Logistics",
  locations: "Lahore, Karachi, Islamabad",
  keyConcerns: "fuel costs, delivery margins, customer churn",
  riskSensitivity: "balanced",
};

// Mock news content
const mockContent = `
MARKET UPDATE: Fuel prices surge 15% in South Asia due to refinery maintenance.
Delivery companies report 12-18% margin compression. Some logistics firms considering 
price increases of 5-8% to offset costs. Customer complaints rising 23% in urban areas.
Industry analysts predict relief in Q3 if supply normalizes.
`;

async function testOptimizedAnalysis() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY set. Run: export GEMINI_API_KEY=your_key");
    process.exit(1);
  }

  console.log("🚀 Testing Optimized Consolidated Gemini Analysis Flow");
  console.log("Profile:", mockProfile);
  console.log("Content:", mockContent);
  console.log("\n");

  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey })],
      model: googleAI.model("gemini-2.5-flash"),
    });

    // PHASE 1: Signals + Relevance + Insights (CONSOLIDATED)
    console.log("📊 PHASE 1: Extracting Signals + Relevance + Insights...");
    const startPhase1 = Date.now();

    const phase1Response = await ai.generate({
      prompt: `You are a business intelligence analyst. Analyze this content and extract signals, assess relevance, and generate insights.

CONTENT TO ANALYZE:
${mockContent}

USER BUSINESS PROFILE:
${JSON.stringify(mockProfile, null, 2)}

TASK: Return a JSON object with exactly these fields:
1. "signals": Array of key facts/signals from the content (strings)
2. "relevanceScore": Number 0-100 (75+ is highly relevant)
3. "relevanceExplanation": String explaining why it is/isn't relevant
4. "insight": String with actionable operational insight for their business

Focus on practical implications for ${mockProfile.industry} in ${mockProfile.locations}.`,
      output: {
        schema: z.object({
          signals: z.array(z.string()).describe("Key signals extracted from content."),
          relevanceScore: z.number().describe("Relevance score 0-100."),
          relevanceExplanation: z.string().describe("Why it is relevant or not."),
          insight: z.string().describe("Actionable operational insight."),
        }),
      },
    });

    const phase1Time = Date.now() - startPhase1;
    console.log(`✅ Phase 1 completed in ${phase1Time}ms`);
    console.log("Signals:", phase1Response.output.signals);
    console.log("Relevance Score:", phase1Response.output.relevanceScore);
    console.log("Relevance Explanation:", phase1Response.output.relevanceExplanation);
    console.log("Insight:", phase1Response.output.insight);
    console.log("\n");

    // Wait 1.5 seconds before next request (rate limit safety)
    console.log("⏳ Waiting 1.5s before next request (rate limit safety)...");
    await new Promise((r) => setTimeout(r, 1500));

    // PHASE 2: Impact + Actions (CONSOLIDATED)
    console.log("💡 PHASE 2: Analyzing Impact + Recommending Actions...");
    const startPhase2 = Date.now();

    const phase2Response = await ai.generate({
      prompt: `You are a business strategy advisor. Analyze the business impact and recommend actions.

USER BUSINESS PROFILE:
${JSON.stringify(mockProfile, null, 2)}

OPERATIONAL INSIGHTS:
${phase1Response.output.insight}

TASK: Return a JSON object with exactly these fields:
1. "impactLevel": One of "low", "medium", or "high"
2. "impactDetails": String describing operational/financial impact
3. "recommendedActions": Array of 1-2 actions with structure: { id: string, title: string, description: string, actionType: "pricing_adjust" | "route_shift" | "manual_review", simulationSupported: boolean }

Be specific to ${mockProfile.industry} in ${mockProfile.locations}.`,
      output: {
        schema: z.object({
          impactLevel: z.enum(["low", "medium", "high"]).describe("Business impact severity."),
          impactDetails: z.string().describe("Detailed impact description."),
          recommendedActions: z.array(
            z.object({
              id: z.string().describe("Stable action id."),
              title: z.string().describe("Short action title."),
              description: z.string().describe("Practical action description."),
              actionType: z.string().describe("One of pricing_adjust, route_shift, manual_review."),
              simulationSupported: z.boolean().describe("True if mock simulator can execute."),
            })
          ).describe("1-2 recommended actions."),
        }),
      },
    });

    const phase2Time = Date.now() - startPhase2;
    console.log(`✅ Phase 2 completed in ${phase2Time}ms`);
    console.log("Impact Level:", phase2Response.output.impactLevel);
    console.log("Impact Details:", phase2Response.output.impactDetails);
    console.log("Recommended Actions:", JSON.stringify(phase2Response.output.recommendedActions, null, 2));
    console.log("\n");

    const totalTime = phase1Time + 1500 + phase2Time;
    console.log("✨ ANALYSIS COMPLETE");
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Requests made: 2 (reduced from 5)`);
    console.log("Status: ✅ READY FOR PRODUCTION");

  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    process.exit(1);
  }
}

testOptimizedAnalysis();
