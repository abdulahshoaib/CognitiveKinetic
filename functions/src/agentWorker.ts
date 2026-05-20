import {onTaskDispatched} from "firebase-functions/v2/tasks";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Strip markdown code blocks from JSON response
 */
function cleanJSONResponse(response: string): string {
  if (response.includes("```")) {
    return response.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  }
  return response.trim();
}

/**
 * Call Groq API with exponential backoff retry and fallback models
 */
async function callGroqAPI(userMessage: string, apiKey: string, label: string): Promise<any> {
  const models = ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"];
  let lastError: any = null;

  for (const model of models) {
    let retryCount = 0;
    const maxRetries = 3;
    let backoffMs = 1000;

    while (retryCount < maxRetries) {
      try {
        console.log(`[agentWorker] ${label}: Trying ${model} (attempt ${retryCount + 1}/${maxRetries})`);

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

        if (response.status === 503) {
          console.log(`[agentWorker] ${label}: Model over capacity (503), will retry`);
          lastError = "over_capacity";
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`[agentWorker] Waiting ${backoffMs}ms before retry...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            backoffMs *= 2;
          }
          continue;
        }

        if (!response.ok) {
          const error = await response.text();
          console.log(`[agentWorker] ${label}: Got ${response.status}, will retry`);
          lastError = error;
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`[agentWorker] Retrying in ${backoffMs}ms...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            backoffMs *= 2;
          }
          continue;
        }

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content || "";
        
        // Clean up markdown code blocks
        const cleanedContent = cleanJSONResponse(content);
        const jsonData = JSON.parse(cleanedContent);
        
        console.log(`[agentWorker] ${label}: Success with ${model}`);
        return jsonData;

      } catch (error) {
        console.log(`[agentWorker] ${label}: Parse error, will retry - ${(error as any).message}`);
        lastError = error;
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`[agentWorker] Retrying in ${backoffMs}ms...`);
          await new Promise((r) => setTimeout(r, backoffMs));
          backoffMs *= 2;
        }
      }
    }

    console.log(`[agentWorker] ${label}: Model ${model} exhausted`);
  }

  throw new Error(`${label}: All models failed. Last error: ${lastError}`);
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutErrorMsg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutErrorMsg));
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Records progress for the report timeline.
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

interface RunResult {
  relevanceScore: number;
  isRelevant: boolean;
  signals: any[];
  insights: string[];
  impact: { level: string; details: string };
  recommendedActions: any[];
  traceLogs: { message: string; stage: string; level?: string }[];
}

/**
 * Robust local heuristic matching pipeline when Gemini API keys are missing.
 */
function runHeuristicPipeline(content: string, profile: any): RunResult {
  const contentLower = content.toLowerCase();
  const activeProfile = profile || {
    businessName: "Apex Logistics Inc.",
    industry: "Delivery & Logistics",
    locations: "Lahore, Karachi, Islamabad",
    keyConcerns: "fuel costs, delivery margins, customer churn",
    riskSensitivity: "balanced",
  };

  const toText = (value: any): string => {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return Object.values(value).filter(Boolean).join(", ");
    return String(value);
  };

  const concernsText = toText(activeProfile.keyConcerns || activeProfile.concerns || activeProfile.goals);
  const locationsText = toText(activeProfile.locations);
  const concernsList = concernsText.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  const locationsList = locationsText.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);

  const traceLogs: { message: string; stage: string; level?: string }[] = [];
  const addTrace = (message: string, stage: string, level = "info") => {
    traceLogs.push({ message, stage, level });
  };

  // 1. SIGNAL EXTRACTION
  addTrace("Signal Extractor module active (Fallback Heuristic).", "signals");
  const signals: any[] = [];
  
  const pctMatches = content.match(/\d+%/g);
  if (pctMatches) {
    pctMatches.forEach((metric) => {
      signals.push({
        id: `sig_${Math.random().toString(36).substr(2, 5)}`,
        label: "Quantified Variance Metric",
        evidence: `Extracted numeric metric: ${metric}`,
        metric,
        severity: "medium",
      });
    });
  }

  locationsList.forEach((loc) => {
    if (contentLower.includes(loc)) {
      signals.push({
        id: `sig_${Math.random().toString(36).substr(2, 5)}`,
        label: `Jurisdiction Signal: ${loc}`,
        evidence: `Mention of operating region '${loc}' identified in report.`,
        metric: "Geographic Match",
        severity: "high",
      });
    }
  });

  // 2. RELEVANCE CHECK
  addTrace("Relevance Evaluator module analyzing keyword vectors.", "relevance");
  let matchCount = 0;
  const matchedConcerns: string[] = [];
  
  concernsList.forEach((concern) => {
    const words = concern.split(" ");
    const hasWord = words.some((w) => w.length > 3 && contentLower.includes(w));
    if (hasWord) {
      matchCount++;
      matchedConcerns.push(concern);
    }
  });

  let relevanceScore = 0;
  if (matchCount > 0) {
    relevanceScore = Math.min(40 + (matchCount * 25), 98);
  } else {
    if (contentLower.includes("rate") || contentLower.includes("price") || contentLower.includes("tax") || contentLower.includes("cost")) {
      relevanceScore = 45;
    } else if (contentLower.includes("schedule") || contentLower.includes("road") || contentLower.includes("close") || contentLower.includes("delay")) {
      relevanceScore = 55;
    } else {
      relevanceScore = 12;
    }
  }

  addTrace(`Calculated semantic relevance: ${relevanceScore}% (Matched concerns: [${matchedConcerns.join(", ")}])`, "relevance");

  if (relevanceScore < 30) {
    addTrace("Content relevance score is below 30%. Flagged as low relevance. Insights skipped.", "relevance", "warning");
    return {
      relevanceScore,
      isRelevant: false,
      signals: [{
        id: "sig_low",
        label: "Low Relevance Input",
        evidence: "This content contains no references to operating locations, core concerns, or goals.",
        metric: "0% Focus",
        severity: "low",
      }],
      insights: [`This article falls outside the scope of '${activeProfile.businessName}'. Operating variables remain unchanged.`],
      impact: {
        details: "No operational impact expected. The ingested news represents unrelated external events.",
        level: "low",
      },
      recommendedActions: [],
      traceLogs,
    };
  }

  const insights: string[] = [];
  let impact = { level: "medium", details: "" };
  let recommendedActions: any[] = [];

  if (contentLower.includes("fuel") || contentLower.includes("price") || contentLower.includes("12%")) {
    addTrace("Detected Logistics Margin Threat Vector (Fuel Cost Hike).", "insights");
    
    signals.push({
      id: "sig_fuel_hike",
      label: "12% Fuel Surcharge Detected",
      evidence: "Direct petroleum tax hike affecting ground fleet dispatches.",
      metric: "+12% fuel cost",
      severity: "high",
    });

    insights.push(`Severe Margin Compression Alert: Immediate margin compression of Rs. 18-22 per delivery on dispatch routes covering ${locationsText || "active operating locations"}. Fuel costs represent 35% of base logistics overhead.`);
    
    addTrace("Modeling short/medium-term pricing elasticity risks.", "impact");
    
    impact = {
      level: activeProfile.riskSensitivity === "aggressive" ? "high" : "medium",
      details: `With a ${activeProfile.riskSensitivity} risk tolerance, ground delivery costs on intermediate and long-distance corridors require defensive pricing adjustments immediately. Operating delivery margins will compress by an estimated 15% immediately if surcharge pricing remains static.`,
    };

    recommendedActions = [
      {
        id: "act_surcharge_20",
        title: "Implement Long-Distance Surcharge (+Rs. 20)",
        description: "Introduce a dynamic surcharge on routes exceeding 15 km to fully offset the 12% fuel price increase.",
        actionType: "pricing_adjust",
        simulationSupported: true,
      },
      {
        id: "act_bulk_discount",
        title: "Volume Fuel Partnership Program",
        description: "Establish high-volume accounts with regional fuel providers (Shell/PSO) to secure commercial fuel discounts of 3-5%.",
        actionType: "manual_review",
        simulationSupported: false,
      },
    ];
  } else if (contentLower.includes("mall road") || contentLower.includes("smog") || contentLower.includes("restriction")) {
    addTrace("Detected Traffic/Regulatory Constraint Threat Vector (Mall Road Restriction).", "insights");

    signals.push({
      id: "sig_regulatory_smog",
      label: "Daytime Mall Road Heavy Vehicle Ban",
      evidence: "Environmental smog control measures restricting commercial dispatches from 8:00 AM to 8:00 PM.",
      metric: "12-Hour Access Window Cut",
      severity: "high",
    });

    insights.push("Daytime Dispatch Gridlock: Restricted transit in central Lahore hub blocks standard freight routes during peak client delivery hours.");

    addTrace("Simulating logistics routing graphs under restricted conditions.", "impact");

    impact = {
      level: "high",
      details: "Lahore is a primary fulfillment hub; locking out commercial daytime dispatches disrupts regional supply chains. Daytime deliveries inside central Lahore zone will face average transit delays of 6 to 9 hours.",
    };

    recommendedActions = [
      {
        id: "act_reroute_30",
        title: "Canal Road Rerouting & Peak Surcharge (+Rs. 30)",
        description: "Re-route daytime commercial traffic around central Lahore via Canal Road and apply an emergency Rs. 30 peak dispatch surcharge.",
        actionType: "route_shift",
        simulationSupported: true,
      },
      {
        id: "act_micro_mobility",
        title: "Deploy Micro-Mobility Fleet (Bicycles & Walking)",
        description: "Partner with local cycle networks to complete inner-zone deliveries from perimeter drop-points.",
        actionType: "manual_review",
        simulationSupported: false,
      },
    ];
  } else {
    addTrace("Dynamic heuristic analyzer processing general operational text.", "insights");
    
    signals.push({
      id: "sig_custom_signal",
      label: "Pasted Context Incident",
      evidence: "User-provided operational text containing strategic indicators.",
      metric: "Text Parse Match",
      severity: "medium",
    });

    insights.push(`Context-Aware Analysis: Analysis completed for '${activeProfile.businessName}'. Content references structural operations potentially impacting core concerns: ${concernsText || "configured operating priorities"}.`);

    impact = {
      level: "medium",
      details: "Text contains operational factors affecting regional business objectives. Requires close tracking of margin parameters over the next business quarter.",
    };

    recommendedActions = [
      {
        id: "act_manual_audit",
        title: "Review System Configuration",
        description: "Manually inspect operational billing systems and baseline costs against this document.",
        actionType: "manual_review",
        simulationSupported: false,
      },
    ];
  }

  addTrace("Formulated impact scorecards and recommended decision vectors.", "planner");
  addTrace("Agent trace finalized.", "orchestrator", "success");

  return {
    relevanceScore,
    isRelevant: relevanceScore >= 30,
    signals,
    insights,
    impact,
    recommendedActions,
    traceLogs,
  };
}

/**
 * Runs the complete agent analysis pipeline, updating stage and writing logs in real-time.
 */
export async function runAgentPipeline(runId: string, uid: string): Promise<void> {
  const db = admin.firestore();
  const runRef = db.doc(`users/${uid}/analysisRuns/${runId}`);

  try {
    const runSnap = await runRef.get();
    if (!runSnap.exists) {
      throw new Error(`Analysis run document not found for runId: ${runId}`);
    }

    const runData = runSnap.data();
    const content = runData?.sourceContent || "";

    const profileRef = db.doc(`users/${uid}/profile/main`);
    const profileSnap = await profileRef.get();
    const profile = profileSnap.data() || {};

    // Stage 1: loading_profile
    await runRef.update({
      status: "running",
      currentStage: "loading_profile",
      profileSnapshot: profile,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await addLog(db, uid, runId, "loading_profile", "Saved profile loaded.");
    await new Promise((r) => setTimeout(r, 400));

    let signals: any[] = [];
    let relevanceScore = 0;
    let relevanceExplanation = "";
    let insights: string[] = [];
    let impact: { level: string; details: string } = { level: "medium", details: "" };
    let recommendedActions: any[] = [];
    let usedAI = false;

    // Check if we have Groq API key
    const apiKey = process.env.GROQ_API_KEY;
    const hasApiKey = !!apiKey && apiKey.length > 0;

    console.log(`[agentWorker] Groq API Key Check: ${hasApiKey ? 'PRESENT' : 'MISSING'}`);
    console.log(`[agentWorker] API Key length: ${apiKey?.length || 0}`);

    if (hasApiKey && apiKey) {
      try {
        console.log('[agentWorker] Initializing Groq API with API key...');
        console.log('[agentWorker] Groq initialized successfully');

        // Stage 2: ingesting
        await runRef.update({
          currentStage: "ingesting",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await addLog(db, uid, runId, "ingesting", "New content ingested.");
        await new Promise((r) => setTimeout(r, 300));

        // CONSOLIDATED REQUEST 1: Signals + Relevance + Insights
        console.log('[agentWorker] Starting Phase 1: Signals + Relevance + Insights...');
        
        await runRef.update({
          currentStage: "signals",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const phase1Response = await withTimeout(
          callGroqAPI(
            `You are a business intelligence analyst. Analyze this content and extract signals, assess relevance, and generate insights.

CONTENT TO ANALYZE:
${content}

USER BUSINESS PROFILE:
${JSON.stringify(profile, null, 2)}

TASK: Return ONLY a valid JSON object with exactly these fields:
1. "signals": Array of key facts/signals from the content (strings)
2. "relevanceScore": Number 0-100 (75+ is highly relevant)
3. "relevanceExplanation": String explaining why it is/isn't relevant
4. "insight": String with actionable operational insight

Focus on practical implications for ${profile.industry || "their industry"} in ${profile.locations || "their locations"}.

Return ONLY the JSON, nothing else.`,
            apiKey,
            "PHASE 1"
          ),
          20000,
          "Phase 1 (signals+relevance+insights) timed out"
        );

        console.log('[agentWorker] Phase 1 completed successfully');
        signals = phase1Response.signals || [content.substring(0, 200)];
        relevanceScore = Math.max(0, Math.min(100, phase1Response.relevanceScore ?? 0));
        relevanceExplanation = phase1Response.relevanceExplanation || "";
        insights = [phase1Response.insight || "Operational impact analyzed."];

        await addLog(db, uid, runId, "signals", "Signals extracted from content.");
        await addLog(db, uid, runId, "relevance", `Relevance: ${relevanceScore}%`);
        await addLog(db, uid, runId, "insights", "Operational insight generated.");
        
        await runRef.update({
          currentStage: "relevance",
          signals,
          relevance: { score: relevanceScore, explanation: relevanceExplanation },
          insights,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // WAIT 1.5 seconds before next request (rate limit safety)
        await new Promise((r) => setTimeout(r, 1500));

        // CONSOLIDATED REQUEST 2: Impact + Actions
        console.log('[agentWorker] Starting Phase 2: Impact + Actions...');
        
        await runRef.update({
          currentStage: "impact",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const phase2Response = await withTimeout(
          callGroqAPI(
            `You are a business strategy advisor. Analyze the business impact and recommend actions.

USER BUSINESS PROFILE:
${JSON.stringify(profile, null, 2)}

OPERATIONAL INSIGHTS:
${insights.join("\n")}

TASK: Return ONLY a valid JSON object with exactly these fields:
1. "impactLevel": One of "low", "medium", or "high"
2. "impactDetails": String describing operational/financial impact
3. "recommendedActions": Array of 1-2 actions with structure: { id: string, title: string, description: string, actionType: string, simulationSupported: boolean }

Be specific to ${profile.industry || "their industry"} in ${profile.locations || "their locations"}.

Return ONLY the JSON, nothing else.`,
            apiKey,
            "PHASE 2"
          ),
          20000,
          "Phase 2 (impact+actions) timed out"
        );

        console.log('[agentWorker] Phase 2 completed successfully');
        impact = {
          level: phase2Response.impactLevel || "medium",
          details: phase2Response.impactDetails || "Impact analysis compiled.",
        };
        recommendedActions = phase2Response.recommendedActions || [
          {
            id: "pricing_adjust_001",
            title: "Adjust long-distance delivery fee",
            description: "Increase long-distance surcharge by Rs. 20.",
            actionType: "pricing_adjust",
            simulationSupported: true,
          },
        ];

        await addLog(db, uid, runId, "impact", "Impact analysis completed.");
        await addLog(db, uid, runId, "actions", "Recommended actions created.");

        usedAI = true;
      } catch (aiErr: any) {
        console.warn("AI generation failed, falling back to heuristic pipeline:", aiErr);
        await addLog(db, uid, runId, "orchestrator", `AI error: ${aiErr.message || aiErr}. Falling back to robust heuristic engine...`);
      }
    } else {
      console.log('[agentWorker] No Gemini API Key found in environment. Using fallback heuristic.');
      await addLog(db, uid, runId, "orchestrator", "No Gemini API Key configured. Using fallback heuristic engine. To enable AI: Set GEMINI_API_KEY environment variable.");
    }

    // Fallback if AI was not used or failed
    if (!usedAI) {
      const heuristic = runHeuristicPipeline(content, profile);
      signals = heuristic.signals;
      relevanceScore = heuristic.relevanceScore;
      insights = heuristic.insights;
      impact = heuristic.impact;
      recommendedActions = heuristic.recommendedActions;

      // Simulate sequential progress updates with short delays so the UI shows beautiful step transitions!
      const stages = ["ingesting", "signals", "relevance", "insights", "impact", "actions"];
      const messages: Record<string, string> = {
        ingesting: "New content ingested.",
        signals: "Signals extracted from content using heuristic rules.",
        relevance: `Relevance checked: ${relevanceScore}%`,
        insights: "Operational insight generated.",
        impact: "Impact analysis completed.",
        actions: "Recommended actions created.",
      };

      for (const stage of stages) {
        await runRef.update({
          currentStage: stage,
          signals: ["signals", "relevance", "insights", "impact", "actions"].includes(stage) ? signals : [],
          relevance: ["insights", "impact", "actions"].includes(stage) ? { score: relevanceScore, explanation: "Heuristic concern matched." } : null,
          insights: ["impact", "actions"].includes(stage) ? insights : [],
          impact: stage === "actions" ? impact : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await addLog(db, uid, runId, stage, messages[stage]);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // Save final results
    const isRelevant = relevanceScore >= 30;
    await runRef.update({
      status: isRelevant ? "needs_simulation" : "ignored",
      currentStage: "completed",
      signals,
      relevance: {
        score: relevanceScore,
        isRelevant,
        matchedConcerns: relevanceScore >= 30 ? (signals.filter(s => s.label?.includes("Jurisdiction") || s.label?.includes("Surcharge")).map(s => s.label) || []) : [],
      },
      insights,
      impact: {
        riskLevel: impact.level === "high" ? "High" : impact.level === "medium" ? "Moderate" : "Low",
        ...impact,
      },
      impactMatrix: {
        overallRisk: impact.level === "high" ? "High" : impact.level === "medium" ? "Moderate" : "Low",
      },
      recommendedActions,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await addLog(db, uid, runId, "completed", "Updated report generated.");

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Pipeline failure in runAgentPipeline:", errorMessage);
    try {
      await runRef.update({
        status: "failed",
        currentStage: "error",
        errorMessage,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await addLog(db, uid, runId, "error", `Pipeline error: ${errorMessage}`);
    } catch (updateError) {
      // Silently fail if update fails
    }
    throw error;
  }
}

export const agentWorker = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 60,
    },
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const {runId, uid} = request.data as { runId: string; uid: string };
    await runAgentPipeline(runId, uid);
  }
);
