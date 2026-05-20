/**
 * Complete Step-by-Step Analysis Pipeline Test
 * Tests Phase 1 and Phase 2 with actual Gemini API calls
 * Uses gemini-1.5-flash with exponential backoff retry logic
 * Respects rate limits: waits 60s every 4-5 requests
 */

require('dotenv').config();

const { genkit, z } = require("genkit");
const { googleAI } = require("@genkit-ai/google-genai");

const mockProfile = {
  businessName: "Apex Logistics Inc.",
  industry: "Delivery & Logistics",
  locations: "Lahore, Karachi, Islamabad",
  keyConcerns: "fuel costs, delivery margins, customer churn",
  riskSensitivity: "balanced",
};

const mockContent = `
MARKET UPDATE: Fuel prices surge 15% in South Asia due to refinery maintenance.
Delivery companies report 12-18% margin compression. Some logistics firms considering 
price increases of 5-8% to offset costs. Customer complaints rising 23% in urban areas.
Industry analysts predict relief in Q3 if supply normalizes.
`;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not set");
  process.exit(1);
}

const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: googleAI.model("gemini-2.0-flash-001"),
});

let requestCount = 0;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function callWithRetry(generateFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateFn();
    } catch (err) {
      const isRetryable = err.status === 'UNAVAILABLE' || err.status === 'RESOURCE_EXHAUSTED';
      
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      
      const waitTime = Math.pow(2, attempt) * 1000;
      console.log(`⚠️  Attempt ${attempt} failed, retrying in ${waitTime / 1000}s...`);
      await sleep(waitTime);
    }
  }
}

async function waitForRateLimit() {
  requestCount++;
  console.log(`\n📊 API Request #${requestCount}`);
  
  if (requestCount % 4 === 0 && requestCount > 0) {
    console.log('⏳ Rate limit safety: Waiting 60 seconds...');
    for (let i = 0; i < 60; i++) {
      process.stdout.write(`\r⏳ ${60 - i}s remaining...`);
      await sleep(1000);
    }
    console.log('\n✅ Resuming...');
  }
}

async function testPhase1() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PHASE 1: Signals + Relevance + Insights');
  console.log('='.repeat(80));
  
  await waitForRateLimit();
  
  console.log('\n📝 Input:');
  console.log(`  - Profile: ${mockProfile.businessName}`);
  console.log(`  - Industry: ${mockProfile.industry}`);
  console.log(`  - Content: "${mockContent.trim().split('\n')[0].substring(0, 60)}..."`);
  console.log('\n⏱️  Calling Gemini API...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await callWithRetry(() => 
      ai.generate({
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
      })
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ SUCCESS (${duration}ms)\n`);
    console.log('📋 Extracted Data:');
    console.log(`  Signals (${response.output.signals.length}):`);
    response.output.signals.forEach((s, i) => {
      console.log(`    ${i + 1}. ${s.substring(0, 75)}`);
    });
    console.log(`\n  Relevance Score: ${response.output.relevanceScore}/100`);
    console.log(`  Explanation: ${response.output.relevanceExplanation.substring(0, 90)}...`);
    console.log(`\n  Insight: ${response.output.insight.substring(0, 90)}...`);
    
    return {
      success: true,
      signals: response.output.signals,
      relevanceScore: response.output.relevanceScore,
      relevanceExplanation: response.output.relevanceExplanation,
      insight: response.output.insight,
    };
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function testPhase2(phase1Result) {
  if (!phase1Result.success) {
    console.log('\n⚠️  Skipping Phase 2: Phase 1 failed');
    return { success: false };
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 PHASE 2: Impact + Actions');
  console.log('='.repeat(80));
  
  await waitForRateLimit();
  
  console.log('\n📝 Input:');
  console.log(`  - Profile: ${mockProfile.businessName}`);
  console.log(`  - Insight: "${phase1Result.insight.substring(0, 60)}..."`);
  console.log('\n⏱️  Calling Gemini API...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await callWithRetry(() =>
      ai.generate({
        prompt: `You are a business strategy advisor. Analyze the business impact and recommend actions.

USER BUSINESS PROFILE:
${JSON.stringify(mockProfile, null, 2)}

OPERATIONAL INSIGHTS:
${phase1Result.insight}

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
      })
    );
    
    const duration = Date.now() - startTime;
    console.log(`✅ SUCCESS (${duration}ms)\n`);
    console.log('📋 Extracted Data:');
    console.log(`  Impact Level: ${response.output.impactLevel}`);
    console.log(`  Details: ${response.output.impactDetails.substring(0, 90)}...`);
    console.log(`\n  Recommended Actions (${response.output.recommendedActions.length}):`);
    response.output.recommendedActions.forEach((a, i) => {
      console.log(`    ${i + 1}. ${a.title}`);
      console.log(`       Type: ${a.actionType}`);
      console.log(`       Simulable: ${a.simulationSupported}`);
    });
    
    return {
      success: true,
      impactLevel: response.output.impactLevel,
      impactDetails: response.output.impactDetails,
      recommendedActions: response.output.recommendedActions,
    };
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPLETE ANALYSIS PIPELINE TEST');
  console.log('='.repeat(80));
  console.log(`Model: gemini-2.0-flash-001 (with exponential backoff retry)`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(-10)}`);
  console.log(`Profile: ${mockProfile.businessName} (${mockProfile.industry})`);
  console.log('='.repeat(80));
  
  const phase1Result = await testPhase1();
  const phase2Result = await testPhase2(phase1Result);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Phase 1 (Signals+Relevance+Insights): ${phase1Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Phase 2 (Impact+Actions):             ${phase2Result.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Total API Requests Sent:              ${requestCount}`);
  console.log(`\nStatus: ${phase1Result.success && phase2Result.success ? '🎉 READY FOR PRODUCTION' : '⚠️  NEEDS FIXES'}`);
  console.log('='.repeat(80) + '\n');
  
  process.exit(phase1Result.success && phase2Result.success ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
