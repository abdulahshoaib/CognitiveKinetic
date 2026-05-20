const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

// Set key explicitly
process.env.GEMINI_API_KEY = 'AIzaSyABCEp8XSRiIrNJCCW7hFZ8pLyrHx43mRM';

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
