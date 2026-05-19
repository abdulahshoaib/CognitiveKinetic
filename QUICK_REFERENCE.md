# Quick Reference Card

## ⚡ The App is Running RIGHT NOW!

**Terminal Command**: 
```bash
npm start
```

**Server Location**: `exp://192.168.18.25:8081`

---

## 🔥 Most Important Things to Know

### **How to View the App**
Press **`w`** in the terminal → Opens in browser at `localhost:19000`

### **Hot Reload**
Save a file → App automatically updates (magic!)

### **Debug**
Press **`j`** in terminal → Opens debugger in browser

### **Stop the Server**
Press **`Ctrl+C`** in terminal

---

## 📱 Terminal Shortcuts (While App is Running)

```
w  → Open in web browser (EASIEST)
a  → Open Android emulator
i  → Open iOS simulator (macOS only)
s  → Switch to development build
j  → Open debugger
r  → Reload app
m  → Toggle menu
?  → Show all commands
q  → Quit
```

---

## 🎯 Project Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                      USER (YOU)                              │
└────────────┬────────────────────────────────────────────────┘
             │ Opens app in browser (press 'w')
             ↓
┌─────────────────────────────────────────────────────────────┐
│              EXPO DEV SERVER (Metro Bundler)                 │
│         Running on: exp://192.168.18.25:8081                │
│  • Hot reloads when you change code                         │
│  • Watches your src/ folder for changes                     │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│           REACT NATIVE APP (What You See)                   │
│                                                              │
│  ├── Auth Screens (Login/Signup)                            │
│  ├── Main App Screens (Dashboard, Analysis, etc)            │
│  ├── Navigation (Bottom Tabs)                               │
│  └── Components (Buttons, Cards, etc)                       │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓ (When user analyzes content)
┌─────────────────────────────────────────────────────────────┐
│         FIREBASE CLOUD FUNCTIONS (Backend)                  │
│          (Currently: Not fully deployed yet)                │
│                                                              │
│  ├── agentWorker.ts → Genkit + Gemini AI                   │
│  ├── createAnalysisRun.ts → Start analysis                 │
│  ├── simulateAction.ts → Run what-if simulation            │
│  └── ingestNewsTick.ts → Auto-fetch news                   │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────────┐
│             FIRESTORE DATABASE                              │
│          (Stores all user data)                             │
│                                                              │
│  ├── userProfiles/{userId}                                 │
│  ├── analysisRuns/{userId}/{runId}                         │
│  └── simulationResults/{userId}/{resultId}                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Key Folders You'll Edit

```
src/
├── screens/          ← User-facing pages (EDIT THESE FIRST)
├── components/       ← Reusable UI elements
├── services/         ← API calls to Firebase
├── context/          ← Global state management
├── hooks/            ← Custom React logic
├── navigation/       ← Screen routing
└── utils/            ← Helper functions

functions/
└── src/              ← Backend AI processing
    ├── agentWorker.ts
    ├── createAnalysisRun.ts
    ├── simulateAction.ts
    └── ingestNewsTick.ts
```

---

## 🔐 Authentication Flow (Current)

```
User opens app
    ↓
Is user logged in? (Check Firebase)
    ├─ YES → Show MainNavigator (Dashboard, etc)
    └─ NO → Show AuthNavigator (Login/Signup)

First time user:
    Login/Signup → OnboardingScreen (save profile) → Dashboard

Returning user:
    Login → Dashboard → View previous analyses
```

---

## 🔄 Analysis Flow (Current State)

```
User taps "Analyze New Content"
    ↓
NewContentScreen: Paste article/news
    ↓
User taps "Analyze"
    ├─ Frontend → Firebase Cloud Function
    │   └─ Backend: agentWorker.ts
    │       ├─ Relevance check (Genkit + Gemini)
    │       ├─ Signal extraction
    │       ├─ Insight generation
    │       ├─ Impact modeling
    │       └─ Action recommendations
    │       ↓
    │       Stores result in Firestore
    ↓
Frontend: Polls Firestore for status
    ↓
When complete: ImpactReportScreen (show results)
    ↓
User selects action: ActionsScreen
    ↓
User taps "Simulate": simulateAction.ts
    ├─ Applies action to mock DB
    ├─ Calculates before/after state
    └─ Stores result in Firestore
    ↓
SimulationResultScreen: Show before/after comparison
```

---

## 💻 Common Commands

### **Start the app**
```bash
cd /home/bissam-iftikhar/Desktop/Hackathon/CognitiveKinetic
npm start
```

### **Install new dependencies**
```bash
npm install <package-name>
# Then save it
npm install --save <package-name>
```

### **Check Node version**
```bash
node --version  # Should be v20+
```

### **Clear cache (if app acts weird)**
```bash
expo start --clear
```

### **Deploy backend functions**
```bash
cd functions
firebase deploy --only functions
```

---

## 🛠️ Most Edited Files (Start Here)

### If you want to change the login screen:
→ Edit: `src/screens/auth/LoginScreen.js`

### If you want to change the dashboard:
→ Edit: `src/screens/DashboardScreen.js`

### If you want to add a new screen:
→ Create: `src/screens/MyNewScreen.js`
→ Import in: `src/navigation/MainNavigator.js`
→ Add to Tab.Navigator

### If you want to change colors:
→ Edit: `src/constants/colors.js`

### If you want to change backend logic:
→ Edit: `functions/src/agentWorker.ts`
→ Redeploy: `firebase deploy --only functions`

---

## ❓ Common Questions

### Q: "Where do I see my changes?"
**A**: Save file → App auto-reloads (press 'r' if manual reload needed)

### Q: "How do I test the backend?"
**A**: Currently it's mocked. To test:
1. Set up Firebase project
2. Deploy `functions/` folder
3. Update Firebase config in `src/constants/domains.js`

### Q: "Can I use my phone to test?"
**A**: Yes! Scan QR code in terminal with Expo Go app

### Q: "How do I add Firebase authentication?"
**A**: It's already there! See `src/context/AuthContext.js`

### Q: "How do I save data to database?"
**A**: Use `firebase.js` service + Firestore:
```javascript
const docRef = doc(db, 'myCollection', 'myDoc');
await setDoc(docRef, { data: 'here' });
```

### Q: "What's the difference between frontend and backend?"
**A**: 
- **Frontend** (`src/`) - What user sees, runs on phone/browser
- **Backend** (`functions/`) - AI processing, runs on Google servers

---

## 🐛 Troubleshooting

### Error: "configs.toReversed is not a function"
→ Node.js is too old (need v20+)
→ Solution: `conda install -y nodejs=20`

### Error: "Cannot find module 'expo'"
→ Dependencies not installed
→ Solution: `npm install`

### App keeps crashing on startup
→ Cache issue
→ Solution: `expo start --clear`

### Can't connect to Firebase
→ Firebase not set up yet
→ This is expected! Backend is mocked for now

### Changes aren't showing up
→ Try hot reload: Press `r` in terminal
→ Or restart: Ctrl+C then `npm start`

---

## 📚 Key Files to Understand (In Order)

1. **`App.js`** (2 min read) - Entry point
2. **`src/navigation/AppNavigator.js`** (1 min) - Routing logic
3. **`src/screens/DashboardScreen.js`** (3 min) - Main screen
4. **`src/context/AuthContext.js`** (3 min) - Authentication
5. **`src/services/firebase.js`** (1 min) - Database connection

Then explore screens in `src/screens/` that interest you.

---

## 🎓 Learning Path

### Day 1: Understand the app
- [ ] Read QUICKSTART.md (this folder)
- [ ] Read FILE_EXPLANATIONS.md
- [ ] Run `npm start` and explore screens

### Day 2: Make small changes
- [ ] Change colors in `src/constants/colors.js`
- [ ] Edit button text in `src/screens/DashboardScreen.js`
- [ ] Add a new field to login form

### Day 3: Add features
- [ ] Create new screen
- [ ] Add API call
- [ ] Hook up to Firestore

### Day 4+: Deploy
- [ ] Set up Firebase project
- [ ] Deploy Cloud Functions
- [ ] Connect to real backend

---

## ✨ Pro Tips

1. **Use browser dev tools**: Press F12 while app is open in browser
2. **React DevTools**: Available through browser extension
3. **Console logs**: Type `console.log()` - output appears in terminal
4. **Test with sample data**: Use `src/data/sampleInputs.js`
5. **Dark mode**: Available in PreferencesScreen
6. **TypeScript**: Backend is TS, frontend is JS (both work!)

---

## 🚀 Next Steps

1. **Understand the code**: Read QUICKSTART.md + FILE_EXPLANATIONS.md
2. **Explore the app**: Press `w` to open in browser
3. **Make changes**: Edit files in `src/screens/` and watch them update
4. **Set up Firebase**: When ready to connect backend
5. **Deploy functions**: When backend is ready to deploy

---

**Your app is running! Press `w` in terminal to see it now.** 🎉

Questions? Check FILE_EXPLANATIONS.md for detailed info on each file.
