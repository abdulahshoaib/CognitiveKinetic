#!/bin/bash
# Start Firebase Emulator with Gemini API key
# Usage: ./start-emulator.sh

cd "$(dirname "$0")"

# Load API key from .env if it exists
if [ -f "functions/.env" ]; then
  export $(cat functions/.env | grep GEMINI_API_KEY | xargs)
  echo "✅ Loaded GEMINI_API_KEY from functions/.env"
else
  echo "❌ functions/.env not found!"
  exit 1
fi

# Verify API key is set
if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ GEMINI_API_KEY not set"
  exit 1
fi

echo "🚀 Starting Firebase Emulator with API key..."
echo "API Key length: ${#GEMINI_API_KEY}"

# Start the emulator
firebase emulators:start --import=./firebase-seed --export-on-exit
