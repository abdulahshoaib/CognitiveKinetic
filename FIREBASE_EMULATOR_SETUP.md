# 🔧 Firebase Emulator API Key Setup - REQUIRED FOR APP

## Problem
When you run the app with Firebase Emulator, the **Genkit Phase 1 times out** because the Cloud Function doesn't have access to the `GEMINI_API_KEY` environment variable.

**Why?** 
- ✅ Direct Node.js scripts (tests) can load `.env` files directly
- ❌ Firebase Cloud Functions emulator runs in an isolated environment without `.env` auto-loading

## Solution: Pass API Key to Emulator

### Quick Fix (One-Time)
```bash
cd /home/bissam-iftikhar/Desktop/Hackathon/CognitiveKinetic

# Run this command ONCE to set the env var
export GEMINI_API_KEY="AIzaSyB9TTsxzjDpqWp1BkY0shysPkXHsN8GYOc"

# Then start the emulator
firebase emulators:start
```

### Permanent Fix (Recommended)
Use the startup script:

```bash
cd /home/bissam-iftikhar/Desktop/Hackathon/CognitiveKinetic
chmod +x start-emulator.sh
./start-emulator.sh
```

---

## Complete Setup Workflow

### Step 1: Terminal A - Start Firebase Emulator with API Key
```bash
cd /home/bissam-iftikhar/Desktop/Hackathon/CognitiveKinetic

# Export API key before starting emulator
export GEMINI_API_KEY="AIzaSyB9TTsxzjDpqWp1BkY0shysPkXHsN8GYOc"

# Start emulator with logging
firebase emulators:start --export-on-exit

# Output should show:
# ✔ functions: emulator running on http://localhost:5001
# ✔ firestore: emulator running on http://localhost:8080
```

### Step 2: Terminal B - Start Expo App
```bash
cd /home/bissam-iftikhar/Desktop/Hackathon/CognitiveKinetic

# In a NEW terminal window
npm start

# Press 'w' for web
# or 'a' for Android
# or 'i' for iOS
```

---

## What Happens Now

When you analyze content in the app:

1. ✅ **[loading_profile]** - User profile loads
2. ✅ **[ingesting]** - Content ingested  
3. ✅ **[signals]** - Phase 1 calls Gemini (NOW WITH API KEY!)
   - Extracts signals
   - Scores relevance
   - Generates insights
4. ✅ **[relevance]** - Results saved
5. ✅ **[impact]** - Phase 2 calls Gemini
   - Analyzes impact
   - Recommends actions
6. ✅ **[actions]** - Final results ready
7. ✅ **Completed** - Analysis finished

**Expected time: 20-30 seconds total**

---

## If It Still Times Out

### Check Emulator Logs
```bash
# Look for this message in emulator output:
# [agentWorker] API Key Check: PRESENT
# [agentWorker] Initializing Genkit with API key...
# [agentWorker] Genkit initialized successfully
# [agentWorker] Starting Phase 1: Signals + Relevance + Insights...
```

### If You See "API Key Check: MISSING"
**Problem:** API key wasn't passed to emulator

**Solution:** 
```bash
# Kill the emulator
Ctrl+C

# Verify env var is set in SAME terminal
echo $GEMINI_API_KEY

# Should output: AIzaSyB9TTsxzjDpqWp1BkY0shysPkXHsN8GYOc

# If empty, set it again
export GEMINI_API_KEY="AIzaSyB9TTsxzjDpqWp1BkY0shysPkXHsN8GYOc"

# Restart emulator
firebase emulators:start
```

### If Gemini Still Times Out
```bash
# Check internet connection to Google API
curl -I https://generativelanguage.googleapis.com

# Should return HTTP 200
```

---

## Code Changes Made

| File | Change | Why |
|------|--------|-----|
| `functions/src/agentWorker.ts` | Added console logging for API key check | Debugging |
| `functions/src/agentWorker.ts` | Increased Phase 1 timeout: 10s → 20s | Slower networks |
| `functions/src/agentWorker.ts` | Increased Phase 2 timeout: 10s → 20s | Slower networks |
| `functions/src/agentWorker.ts` | Better error messages | Troubleshooting |
| `start-emulator.sh` | Auto-loads API key from functions/.env | Convenience |

---

## Environment Variables Used

```
GEMINI_API_KEY = AIzaSyB9TTsxzjDpqWp1BkY0shysPkXHsN8GYOc

This is loaded by:
✅ functions/.env (for test scripts)
✅ functions/.env.example (template)
✅ start-emulator.sh (loads from .env)
✅ Shell export command (for manual emulator start)

❌ NOT auto-loaded by Firebase Emulator
```

---

## Security Notes

✅ `.env` is in `.gitignore` - won't be pushed to GitHub
✅ API key is stored securely locally
✅ When deploying to production, use Firebase Secret Manager or Google Cloud Secret Manager

---

## Production Deployment

For Firebase production deployment:

```bash
# Set secret in Firebase
firebase functions:secrets:set GEMINI_API_KEY

# Or use Google Cloud Secret Manager
gcloud secrets create gemini-api-key --data-file=-
```

Then reference it in `agentWorker.ts`:
```typescript
import { defineSecret } from "firebase-functions/params";
const geminikKey = defineSecret("GEMINI_API_KEY");
```

---

## Quick Troubleshooting Checklist

- [ ] API key exported: `echo $GEMINI_API_KEY`
- [ ] Emulator running: `firebase emulators:start`
- [ ] Expo app running: `npm start`
- [ ] Both in separate terminals? (not same terminal)
- [ ] Emulator logs show "API Key Check: PRESENT"?
- [ ] Gemini working locally: `cd functions && node test_optimized_analysis.js`

✅ All checked? You're ready to go!
