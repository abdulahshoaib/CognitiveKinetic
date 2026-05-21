// Load .env file if it exists
require('dotenv').config();

const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

// API key should come from environment variable
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not set. Run: export GEMINI_API_KEY=your_key');
  process.exit(1);
}

console.log('Initializing Genkit...');
const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-flash-latest'),
});

console.log('Sending test request to Gemini...');
ai.generate({
  prompt: 'Extract key facts and signals from this content:\nFuel prices increased by 12% effective immediately across the country, causing logistics operators to adjust base rates.',
})
.then(response => {
  console.log('Success! Response:', response.text);
})
.catch(err => {
  console.error('Error occurred:', err);
});
