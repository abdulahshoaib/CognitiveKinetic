#!/usr/bin/env node

require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DEMO_CONTENT = `MARKET UPDATE: Fuel prices surge 15% in South Asia due to refinery maintenance.
Lahore and Karachi markets see 18% margin compression. Islamabad reports 12% cost increase.
Customer complaints up 25% in past 2 weeks. Competitive pricing pressure intensifying.`;

const DEMO_PROFILE = {
  businessName: "Apex Logistics Inc.",
  industry: "Delivery & Logistics",
  locations: "Lahore, Karachi, Islamabad",
  keyConcerns: "fuel costs, delivery margins, customer churn",
  riskSensitivity: "balanced",
};

/**
 * Call Groq API with exponential backoff retry
 */
async function callGroqAPI(userMessage, apiKey, label, modelOverride = null) {
  const models = [
    modelOverride || "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768"
  ];

  console.log(`\n📝 ${label} Request:`);
  console.log(`   Models to try: ${models.join(", ")}`);
  console.log(`   Message length: ${userMessage.length} chars`);
  
  let lastError = null;

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const model = models[modelIdx];
    let retryCount = 0;
    const maxRetries = 3;
    let backoffMs = 1000;

    while (retryCount < maxRetries) {
      try {
        console.log(`\n   [Attempt ${retryCount + 1}/${maxRetries}] Model: ${model}`);
        const startTime = Date.now();

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: userMessage,
              }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        const duration = Date.now() - startTime;
        console.log(`   Status: ${response.status} (${duration}ms)`);

        if (response.status === 503) {
          // Over capacity - try backoff
          console.log(`   ⚠️  Model over capacity (503)`);
          lastError = "over_capacity";
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`   💤 Waiting ${backoffMs}ms before retry...`);
            await new Promise(r => setTimeout(r, backoffMs));
            backoffMs *= 2; // Exponential backoff
          }
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ ERROR: ${response.status}`);
          console.error(`   Details: ${errorText.substring(0, 200)}`);
          lastError = errorText;
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`   ⏳ Retrying in ${backoffMs}ms...`);
            await new Promise(r => setTimeout(r, backoffMs));
            backoffMs *= 2;
          }
          continue;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        console.log(`   ✅ Success! Response: ${content.length} chars`);
        return content;

      } catch (error) {
        console.error(`   ❌ EXCEPTION: ${error.message}`);
        lastError = error.message;
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`   ⏳ Retrying in ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
          backoffMs *= 2;
        }
      }
    }

    console.log(`   ❌ Model ${model} exhausted (${maxRetries} retries failed)`);
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}

/**
 * Main test
 */
async function testPipeline() {
  console.log("================================================================================");
  console.log("🎯 GROQ + LLAMA 3.3 PIPELINE TEST");
  console.log("================================================================================");
  
  if (!GROQ_API_KEY) {
    console.error("❌ GROQ_API_KEY not found in environment");
    process.exit(1);
  }

  console.log(`✅ API Key present (length: ${GROQ_API_KEY.length})`);
  console.log(`📊 Demo Profile: ${DEMO_PROFILE.businessName} (${DEMO_PROFILE.industry})`);
  console.log(`📄 Demo Content (${DEMO_CONTENT.length} chars)`);

  let phase1Result = null;
  let phase2Result = null;
  const pipelineStartTime = Date.now();

  try {
    // ========== PHASE 1 ==========
    console.log("\n\n================================================================================");
    console.log("🚀 PHASE 1: Signals + Relevance + Insights");
    console.log("================================================================================");

    const phase1Message = `You are a business intelligence analyst. Analyze this content and extract signals, assess relevance, and generate insights.

CONTENT TO ANALYZE:
${DEMO_CONTENT}

USER BUSINESS PROFILE:
${JSON.stringify(DEMO_PROFILE, null, 2)}

TASK: Return ONLY a valid JSON object with exactly these fields:
1. "signals": Array of key facts/signals from the content (strings)
2. "relevanceScore": Number 0-100 (75+ is highly relevant)
3. "relevanceExplanation": String explaining why it is/isn't relevant
4. "insight": String with actionable operational insight

Focus on practical implications for ${DEMO_PROFILE.industry || "their industry"} in ${DEMO_PROFILE.locations || "their locations"}.

Return ONLY the JSON, nothing else.`;

    const phase1Response = await callGroqAPI(phase1Message, GROQ_API_KEY, "PHASE 1");

    try {
      // Strip markdown code blocks if present
      let cleanedResponse = phase1Response;
      if (cleanedResponse.includes("```")) {
        cleanedResponse = cleanedResponse.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      
      phase1Result = JSON.parse(cleanedResponse);
      console.log("\n✅ Phase 1 JSON parsed successfully");
      console.log(`   Signals: ${phase1Result.signals?.length || 0} items`);
      console.log(`   Relevance: ${phase1Result.relevanceScore || 0}%`);
      console.log(`   Insight length: ${phase1Result.insight?.length || 0} chars`);
    } catch (parseError) {
      console.error(`\n❌ Failed to parse Phase 1 JSON`);
      console.error(`   Raw response (first 800 chars): ${phase1Response.substring(0, 800)}`);
      throw parseError;
    }

    // Wait 1.5s before next request (rate limiting)
    console.log("\n⏳ Waiting 1.5s for rate limit safety...");
    await new Promise(r => setTimeout(r, 1500));

    // ========== PHASE 2 ==========
    console.log("\n\n================================================================================");
    console.log("🚀 PHASE 2: Impact + Actions");
    console.log("================================================================================");

    const phase2Message = `You are a business strategy advisor. Analyze the business impact and recommend actions.

USER BUSINESS PROFILE:
${JSON.stringify(DEMO_PROFILE, null, 2)}

OPERATIONAL INSIGHTS:
${phase1Result.insight || "No insight available"}

TASK: Return ONLY a valid JSON object with exactly these fields:
1. "impactLevel": One of "low", "medium", or "high"
2. "impactDetails": String describing operational/financial impact
3. "recommendedActions": Array of 1-2 actions with structure: { id: string, title: string, description: string, actionType: string, simulationSupported: boolean }

Be specific to ${DEMO_PROFILE.industry || "their industry"} in ${DEMO_PROFILE.locations || "their locations"}.

Return ONLY the JSON, nothing else.`;

    const phase2Response = await callGroqAPI(phase2Message, GROQ_API_KEY, "PHASE 2");

    try {
      // Strip markdown code blocks if present
      let cleanedResponse = phase2Response;
      if (cleanedResponse.includes("```")) {
        cleanedResponse = cleanedResponse.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      
      phase2Result = JSON.parse(cleanedResponse);
      console.log("\n✅ Phase 2 JSON parsed successfully");
      console.log(`   Impact Level: ${phase2Result.impactLevel}`);
      console.log(`   Impact Details length: ${phase2Result.impactDetails?.length || 0} chars`);
      console.log(`   Recommended Actions: ${phase2Result.recommendedActions?.length || 0} items`);
    } catch (parseError) {
      console.error(`\n❌ Failed to parse Phase 2 JSON`);
      console.error(`   Raw response (first 800 chars): ${phase2Response.substring(0, 800)}`);
      throw parseError;
    }

    // ========== SUMMARY ==========
    const totalTime = Date.now() - pipelineStartTime;
    console.log("\n\n================================================================================");
    console.log("✨ PIPELINE COMPLETE");
    console.log("================================================================================");
    console.log(`✅ Total time: ${totalTime}ms (~${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`✅ API calls made: 2`);
    console.log(`✅ Status: READY FOR PRODUCTION`);
    console.log("\n📊 Final Results:");
    console.log(`   - Signals extracted: ${phase1Result.signals?.length || 0}`);
    console.log(`   - Relevance score: ${phase1Result.relevanceScore || 0}%`);
    console.log(`   - Impact level: ${phase2Result.impactLevel}`);
    console.log(`   - Actions recommended: ${phase2Result.recommendedActions?.length || 0}`);
    console.log("================================================================================");

  } catch (error) {
    const totalTime = Date.now() - pipelineStartTime;
    console.log("\n\n================================================================================");
    console.log("❌ PIPELINE FAILED");
    console.log("================================================================================");
    console.log(`⏱️  Time before failure: ${totalTime}ms`);
    console.log(`📋 Error: ${error.message}`);
    console.log("================================================================================");
    process.exit(1);
  }
}

// Run test
testPipeline().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
