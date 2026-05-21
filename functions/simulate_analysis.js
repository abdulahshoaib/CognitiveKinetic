const { genkit, z } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable not set.');
  console.error('Set it via: export GEMINI_API_KEY=your_key');
  process.exit(1);
}

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-flash-latest'),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = {
  businessName: 'Apex Logistics Inc.',
  industry: 'Delivery & Logistics',
  locations: 'Lahore, Karachi, Islamabad',
  keyConcerns: 'fuel costs, delivery margins, customer churn',
  riskSensitivity: 'high',
};

const content = 'Fuel prices increased by 12% effective immediately across the country, causing logistics operators to adjust base rates.';

const signalSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  evidence: z.string(),
  metric: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

const insightSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  evidence: z.string().optional(),
  affectedArea: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

const actionSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  rationale: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  confidence: z.string().optional(),
  actionType: z.enum(['pricing_adjust', 'route_shift', 'manual_review']),
  targetSystem: z.string().optional(),
  simulationSupported: z.boolean(),
  simulationStatus: z.enum(['pending', 'running', 'passed', 'failed']).optional(),
});

const normalizeRiskLevel = (level) => {
  const value = String(level || 'medium').toLowerCase();
  if (value === 'critical') return 'Critical';
  if (value === 'high') return 'High';
  if (value === 'low') return 'Low';
  if (value === 'none') return 'None';
  return 'Medium';
};

const normalizeUrgency = (urgency) => {
  const value = String(urgency || 'medium').toLowerCase();
  if (value === 'critical' || value === 'high') return 'High';
  if (value === 'low') return 'Low';
  return 'Medium';
};

async function runSimulation() {
  console.log('=== STARTING ANALYSIS SIMULATION ===');
  console.log('Loaded Profile:', JSON.stringify(profile, null, 2));
  console.log('Ingested Content:', content);
  console.log('\n----------------------------------------\n');

  const runId = `simulated_run_${Date.now()}`;
  const executionLogs = [
    { message: 'Saved profile loaded.', stage: 'loading_profile', level: 'info' },
    { message: 'New content ingested.', stage: 'ingesting', level: 'info' },
  ];

  try {
    console.log('[Step 1/5] Signal Extraction...');
    const extractResponse = await ai.generate({
      prompt:
        `Extract structured facts and business signals from this content:\n${content}\n\n` +
        `Return signals that can be rendered directly in the mobile ImpactReportScreen.`,
      output: {
        schema: z.array(signalSchema),
      },
    });
    const signals = (extractResponse.output || []).map((signal, index) => ({
      id: signal.id || `sig_${index}`,
      label: signal.label,
      evidence: signal.evidence,
      metric: signal.metric || '',
      severity: signal.severity || 'medium',
    }));
    executionLogs.push({ message: 'Signals extracted from content.', stage: 'signals', level: 'info' });
    console.log('Signals:', JSON.stringify(signals, null, 2));
    console.log('\n----------------------------------------\n');

    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 2/5] Relevance Check...');
    const relevanceResponse = await ai.generate({
      prompt:
        `Given this saved user profile:\n${JSON.stringify(profile, null, 2)}\n\n` +
        `And these extracted signals:\n${JSON.stringify(signals, null, 2)}\n\n` +
        `Check relevance to the profile. A score of 75+ means highly relevant and actionable.`,
      output: {
        schema: z.object({
          score: z.number(),
          explanation: z.string(),
        }),
      },
    });

    const relevanceScore = relevanceResponse.output?.score ?? 0;
    const relevanceExplanation = relevanceResponse.output?.explanation || 'Relevance checked against saved profile.';
    executionLogs.push({ message: `Relevance checked: ${relevanceScore}%`, stage: 'relevance', level: 'info' });
    console.log('Relevance:', JSON.stringify({ score: relevanceScore, explanation: relevanceExplanation }, null, 2));
    console.log('\n----------------------------------------\n');

    if (relevanceScore < 30) {
      const lowRelevanceResult = {
        id: runId,
        status: 'ignored',
        currentStage: 'completed',
        sourceContent: content,
        sourceTitle: 'Fuel Price Update',
        sourceName: 'Simulated Content',
        sourceBody: content,
        sourceTimestamp: new Date().toISOString(),
        relevanceScore,
        isRelevant: false,
        relevance: {
          score: relevanceScore,
          isRelevant: false,
          explanation: relevanceExplanation,
        },
        signals,
        insights: [{
          id: 'ins_low_relevance',
          title: 'Low Relevance Input',
          description: relevanceExplanation,
          evidence: 'Saved profile comparison did not meet the action threshold.',
          affectedArea: 'None',
          priority: 'low',
        }],
        impact: {
          riskLevel: 'None',
          details: relevanceExplanation,
          shortTerm: 'No operational impact expected.',
          mediumTerm: 'No follow-up required unless the profile changes.',
          explanation: relevanceExplanation,
        },
        impactMatrix: { overallRisk: 'None' },
        recommendedActions: [],
        executionLogs,
        analyzedAt: new Date().toISOString(),
      };
      console.log('Analysis Result:', JSON.stringify(lowRelevanceResult, null, 2));
      return lowRelevanceResult;
    }

    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 3/5] Insight Generation...');
    const insightResponse = await ai.generate({
      prompt:
        `Given this saved business profile:\n${JSON.stringify(profile, null, 2)}\n\n` +
        `Signals:\n${JSON.stringify(signals, null, 2)}\n\n` +
        `Relevance analysis:\n${relevanceExplanation}\n\n` +
        `Generate structured operational insights for the ImpactReportScreen.`,
      output: {
        schema: z.array(insightSchema),
      },
    });
    const insights = (insightResponse.output || []).map((insight, index) => ({
      id: insight.id || `ins_${index}`,
      title: insight.title,
      description: insight.description,
      evidence: insight.evidence || 'Generated from extracted signals and saved profile.',
      affectedArea: insight.affectedArea || 'Operations',
      priority: insight.priority || 'medium',
    }));
    executionLogs.push({ message: 'Operational insight generated.', stage: 'insights', level: 'info' });
    console.log('Insights:', JSON.stringify(insights, null, 2));
    console.log('\n----------------------------------------\n');

    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 4/5] Impact Analysis...');
    const impactResponse = await ai.generate({
      prompt:
        `Given this saved business profile:\n${JSON.stringify(profile, null, 2)}\n\n` +
        `Insights:\n${JSON.stringify(insights, null, 2)}\n\n` +
        `Analyze business impact. Return fields used by ImpactSummaryCard: riskLevel, shortTerm, mediumTerm, explanation.`,
      output: {
        schema: z.object({
          riskLevel: z.enum(['None', 'Low', 'Medium', 'High', 'Critical']),
          shortTerm: z.string(),
          mediumTerm: z.string(),
          explanation: z.string(),
        }),
      },
    });

    const impact = {
      riskLevel: normalizeRiskLevel(impactResponse.output?.riskLevel),
      shortTerm: impactResponse.output?.shortTerm || 'Delivery margins may compress if pricing remains unchanged.',
      mediumTerm: impactResponse.output?.mediumTerm || 'Customer churn risk may rise if costs are passed through without clear communication.',
      explanation: impactResponse.output?.explanation || relevanceExplanation,
    };
    impact.details = impact.explanation;
    executionLogs.push({ message: 'Impact analysis completed.', stage: 'impact', level: 'info' });
    console.log('Impact:', JSON.stringify(impact, null, 2));
    console.log('\n----------------------------------------\n');

    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 5/5] Formulating Recommended Actions...');
    const actionsResponse = await ai.generate({
      prompt:
        `Given this saved business profile:\n${JSON.stringify(profile, null, 2)}\n\n` +
        `Impact:\n${JSON.stringify(impact, null, 2)}\n\n` +
        `Recommend 1-2 concrete actions. At least one must support simulation. ` +
        `Use actionType "pricing_adjust" for delivery fee/surcharge changes.`,
      output: {
        schema: z.array(actionSchema),
      },
    });

    const recommendedActions = (actionsResponse.output || []).map((action, index) => ({
      ...action,
      id: action.id || `act_${index}`,
      rationale: action.rationale || action.description,
      urgency: normalizeUrgency(action.urgency),
      confidence: action.confidence || 'moderate (75%)',
      targetSystem: action.targetSystem || 'Operations Board',
      simulationStatus: action.simulationStatus || 'pending',
    }));
    executionLogs.push({ message: 'Recommended actions created.', stage: 'actions', level: 'info' });
    executionLogs.push({ message: 'Updated report generated.', stage: 'completed', level: 'success' });

    const analysisResult = {
      id: runId,
      status: 'needs_simulation',
      currentStage: 'completed',
      sourceContent: content,
      sourceTitle: 'Fuel Price Update',
      sourceName: 'Simulated Content',
      sourceBody: content,
      sourceTimestamp: new Date().toISOString(),
      relevanceScore,
      isRelevant: true,
      relevance: {
        score: relevanceScore,
        isRelevant: true,
        explanation: relevanceExplanation,
      },
      signals,
      insights,
      impact,
      impactMatrix: {
        overallRisk: impact.riskLevel,
      },
      recommendedActions,
      executionLogs,
      analyzedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));
    console.log('\n=== SIMULATION COMPLETED SUCCESSFULLY ===');
    return analysisResult;
  } catch (error) {
    console.error('=== SIMULATION FAILED ===');
    console.error(error);
    throw error;
  }
}

runSimulation();
