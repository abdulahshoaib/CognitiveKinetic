const { genkit, z } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY environment variable not set.');
  console.error('Set it via: export GEMINI_API_KEY=your_key');
  process.exit(1);
}

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-flash-latest'),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const profile = {
  businessName: 'Apex Logistics Inc.',
  industry: 'Delivery & Logistics',
  locations: 'Lahore, Karachi, Islamabad',
  concerns: 'fuel costs, delivery margins, customer churn',
  riskSensitivity: 'balanced',
};

const content = 'Fuel prices increased by 12% effective immediately across the country, causing logistics operators to adjust base rates.';

async function runSimulation() {
  console.log('=== STARTING ANALYSIS SIMULATION ===');
  console.log('Loaded Profile:', JSON.stringify(profile, null, 2));
  console.log('Ingested Content:', content);
  console.log('\n----------------------------------------\n');

  try {
    // Step 1: Signal Extraction
    console.log('[Step 1/5] Signal Extraction...');
    const extractResponse = await ai.generate({
      prompt: `Extract key facts and signals from this content:\n${content}`,
    });
    const signals = [extractResponse.text];
    console.log('Signals Extracted successfully!');
    console.log('Response content:', signals[0]);
    console.log('\n----------------------------------------\n');

    // Step 2: Relevance Check
    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 2/5] Relevance Check...');
    const relevanceResponse = await ai.generate({
      prompt: `Given this user profile:\n${JSON.stringify(profile)}\n\n` +
        `And these signals:\n${signals.join('\n')}\n\n` +
        `Is this relevant to the business? Analyze the signals against the profile. ` +
        `Return a JSON object with 'score' (0 to 100) and 'explanation'. ` +
        `A score of 75+ means it is highly relevant and actionable.`,
      output: {
        schema: z.object({
          score: z.number().describe('Relevance score between 0 and 100.'),
          explanation: z.string().describe('Explanation for why it is relevant or not.'),
        }),
      },
    });

    const relevanceScore = relevanceResponse.output?.score ?? 0;
    const relevanceExplanation = relevanceResponse.output?.explanation ?? relevanceResponse.text;
    console.log('Relevance Checked successfully!');
    console.log('Score:', relevanceScore);
    console.log('Explanation:', relevanceExplanation);
    console.log('\n----------------------------------------\n');

    if (relevanceScore < 30) {
      console.log('Relevance score too low. Halting.');
      return;
    }

    // Step 3: Insight Generation
    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 3/5] Insight Generation...');
    const insightResponse = await ai.generate({
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And these signals extracted from the event:\n${signals.join('\n')}\n\n` +
        `And this relevance analysis:\n${relevanceExplanation}\n\n` +
        `Generate a highly specific, actionable operational insight that the business should consider. ` +
        `Focus on practical implications and operational impact for their specific industry and location.`,
    });
    const insights = [insightResponse.text];
    console.log('Insight Generated successfully!');
    console.log('Insight content:', insights[0]);
    console.log('\n----------------------------------------\n');

    // Step 4: Impact Analysis
    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 4/5] Impact Analysis...');
    const impactResponse = await ai.generate({
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And these operational insights:\n${insights.join('\n')}\n\n` +
        `Analyze the business impact of these insights on our operations, costs, margins, and customers. ` +
        `Provide a detailed impact breakdown, then categorize the severity level as low, medium, or high.`,
      output: {
        schema: z.object({
          level: z.enum(['low', 'medium', 'high']).describe('The business impact severity level.'),
          details: z.string().describe('Detailed description of the operational impact.'),
        }),
      },
    });

    const impact = {
      level: impactResponse.output?.level || 'medium',
      details: impactResponse.output?.details || 'Impact analysis compiled.',
    };
    console.log('Impact Analyzed successfully!');
    console.log('Severity Level:', impact.level);
    console.log('Impact Details:', impact.details);
    console.log('\n----------------------------------------\n');

    // Step 5: Recommended Actions
    console.log('Sleeping 3 seconds to avoid rate limit...');
    await sleep(3000);
    console.log('[Step 5/5] Formulating Recommended Actions...');
    const actionsResponse = await ai.generate({
      prompt: `Given this user business profile:\n${JSON.stringify(profile)}\n\n` +
        `And the analyzed operational impact:\n${impact.details}\n\n` +
        `Recommend 1-2 concrete actions that the business can immediately execute. Return JSON matching schema: ` +
        `[{ id: string, title: string, description: string, ` +
        `actionType: "pricing_adjust" | ` +
        `"route_shift" | "manual_review", ` +
        `simulationSupported: boolean }]`,
      output: {
        schema: z.array(
          z.object({
            id: z.string().describe('Stable action id.'),
            title: z.string().describe('Short action title.'),
            description: z.string().describe('Practical action description.'),
            actionType: z.string().describe(
              'One of pricing_adjust, route_shift, or manual_review.'
            ),
            simulationSupported: z.boolean().describe(
              'True when the mock simulator can execute this action.'
            ),
          })
        ),
      },
    });

    const recommendedActions = actionsResponse.output || [];
    console.log('Actions Recommended successfully!');
    console.log('Actions:', JSON.stringify(recommendedActions, null, 2));
    console.log('\n=== SIMULATION COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('=== SIMULATION FAILED ===');
    console.error(error);
  }
}

runSimulation();
