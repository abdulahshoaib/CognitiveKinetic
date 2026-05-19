# 🚀 Relay (CognitiveKinetic) - Complete Quickstart Guide

## ✅ What's Currently Running

Your Expo development server is **LIVE** at:
```
exp://192.168.18.25:8081
```

The Metro bundler is watching your files and will hot-reload when you make changes.

---

## 📱 How to View the App

### Option 1: Web Browser (Easiest)
Press **`w`** in the terminal where the app is running. This opens the app in a browser at `localhost:19000`.

### Option 2: Physical Android Phone
1. Install **Expo Go** from Google Play Store
2. Scan the **QR code** displayed in the terminal
3. The app loads on your phone and updates in real-time as you code

### Option 3: iOS Simulator
Press **`i`** in the terminal (requires macOS and Xcode)

---

## 🏗️ What is This Project?

### **Product Name**: Relay
### **Full System**: CognitiveKinetic (Content-to-Action Pipeline)

**Relay** is an operational intelligence system for dispatch, logistics, and operational teams. It's **NOT a chatbot** — it's a structured, deterministic decision-making system.

### Core Value Proposition

1. **Persistent Context**: User sets up their business profile once (locations, goals, risks)
2. **Automatic Reuse**: Profile is automatically applied to all future analyses
3. **Content Ingestion**: User pastes news, alerts, or policy updates
4. **Agentic Analysis**: AI agent checks relevance against saved profile
5. **Signal Extraction**: Quantitative metrics extracted (e.g., +12% fuel variance)
6. **Impact Modeling**: Financial and operational impacts calculated
7. **Action Recommendations**: Tactical mitigations suggested
8. **Interactive Simulation**: User can test actions and see before/after state changes
9. **Execution Logs**: Full audit trail of all transactions

---

## 📂 Project Structure Deep Dive

```
CognitiveKinetic/
├── 🎨 Frontend (React Native + Expo)
│   ├── App.js                          # Root component with providers
│   ├── index.js                        # Expo app registry entry point
│   ├── app.json                        # Expo configuration (name, version, icons)
│   └── src/
│       ├── 📱 screens/                 # UI Screens (what user sees)
│       │   ├── auth/
│       │   │   ├── LoginScreen.js     # Email/password login
│       │   │   ├── SignupScreen.js    # User registration
│       │   │   └── OnboardingScreen.js # One-time profile setup
│       │   ├── DashboardScreen.js      # Main dashboard (latest risks, actions)
│       │   ├── NewContentScreen.js     # Paste new content/articles
│       │   ├── AnalysisRunScreen.js    # Analysis in progress
│       │   ├── ImpactReportScreen.js   # Results with metrics & impact
│       │   ├── ActionsScreen.js        # Recommended actions grid
│       │   ├── SimulationResultScreen.js # Before/after state comparison
│       │   ├── AgentTraceScreen.js     # Execution logs from backend
│       │   ├── ExportScreen.js         # Download/export reports
│       │   ├── ProfileSettingsScreen.js # Edit saved profile
│       │   ├── UserPreferencesScreen.js # Theme, notifications, etc.
│       │   └── DemoScreen.js           # Demo/sample scenarios
│       │
│       ├── 🧩 components/              # Reusable UI building blocks
│       │   ├── common/
│       │   │   ├── Button.js          # Styled button component
│       │   │   ├── Card.js            # Container card with shadows
│       │   │   ├── Badge.js           # Status badges
│       │   │   ├── Header.js          # Screen headers
│       │   │   ├── StatusPill.js      # Small status indicators
│       │   │   ├── ProgressBar.js     # Progress visualization
│       │   │   ├── MetricCard.js      # Metric display cards
│       │   │   ├── ActionCard.js      # Action recommendation card
│       │   │   ├── InsightCard.js     # Insight/finding card
│       │   │   ├── ImpactSummaryCard.js # Impact summary visualization
│       │   │   ├── AgentLogList.js    # List of execution logs
│       │   │   └── EmptyState.js      # Empty state placeholder
│       │   └── settings/
│       │       └── NewsAggregatorModal.js # Configure news sources
│       │
│       ├── 🎯 navigation/              # Screen routing & stacks
│       │   ├── AppNavigator.js        # Root navigator (auth check)
│       │   ├── AuthNavigator.js       # Login/Signup/Forgot password flow
│       │   └── MainNavigator.js       # Bottom tabs (Dashboard, Content, etc.)
│       │
│       ├── 📊 context/                 # Global state (Redux alternative)
│       │   ├── AuthContext.js         # User login state & functions
│       │   ├── AnalysisContext.js     # Current analysis, results, recommendations
│       │   ├── PreferencesContext.js  # Theme, user settings
│       │   └── IntegrationsContext.js # External integrations (news sources)
│       │
│       ├── 🔌 services/                # API integration layer
│       │   ├── firebase.js            # Firebase SDK initialization
│       │   ├── api.js                 # HTTP calls to backend functions
│       │   ├── profileService.js      # Load/save user profile
│       │   ├── ingestion.js           # Submit new content for analysis
│       │   ├── simulation.js          # Run action simulation
│       │   ├── insights.js            # Fetch insights/findings
│       │   ├── impact.js              # Fetch impact calculations
│       │   ├── actions.js             # Get recommended actions
│       │   ├── export.js              # Export/download functionality
│       │   └── feedService.js         # Fetch news feed
│       │
│       ├── 🎣 hooks/                   # Custom React hooks
│       │   ├── useAuth.js             # Auth state hook
│       │   ├── useAgent.js            # Trigger analysis, get results
│       │   ├── useSimulation.js       # Run simulations
│       │   ├── useIngestion.js        # Upload content
│       │   └── usePreferences.js      # Theme & preferences
│       │
│       ├── 🎨 constants/               # Static values & configurations
│       │   ├── colors.js              # Color palette (HSL format)
│       │   ├── themes.js              # Dark/Light theme definitions
│       │   ├── typography.js          # Font families & sizes
│       │   ├── layout.js              # Spacing, padding constants
│       │   ├── brand.js               # Brand names, logos
│       │   └── domains.js             # API endpoints, Firebase config
│       │
│       ├── 📦 data/                    # Static mock data
│       │   ├── sampleInputs.js        # Sample content for demo
│       │   └── scenarios/             # Sample business scenarios
│       │       ├── customerComplaints.json
│       │       ├── fuelPriceIncrease.json
│       │       └── ...
│       │
│       └── 🛠️ utils/                   # Helper functions
│           ├── formatters.js          # Format dates, numbers
│           ├── validators.js          # Input validation
│           ├── storage.js             # AsyncStorage wrappers
│           ├── analysisContextUtils.js # Context helper functions
│           └── reportTitles.js        # Generate report titles
│
├── ⚡ Backend (Cloud Functions - TypeScript/Node.js)
│   └── functions/
│       ├── package.json               # Node.js dependencies
│       ├── tsconfig.json              # TypeScript config
│       └── src/
│           ├── index.ts               # Exports all Cloud Functions
│           ├── agentWorker.ts         # Main AI processing
│           │   ├── Genkit + Gemini AI setup
│           │   ├── Relevance checking logic
│           │   ├── Signal extraction
│           │   ├── Impact modeling
│           │   └── Action recommendations
│           ├── createAnalysisRun.ts   # HTTP trigger
│           │   ├── Receive content from frontend
│           │   ├── Enqueue analysis task
│           │   └── Return run ID
│           ├── simulateAction.ts      # HTTP trigger
│           │   ├── Apply action to mock database
│           │   ├── Calculate state changes
│           │   ├── Log execution
│           │   └── Return before/after metrics
│           ├── ingestNewsTick.ts      # Cron trigger
│           │   ├── Scheduled news ingestion
│           │   ├── Filter by relevance
│           │   └── Auto-create analysis runs
│           └── constants/
│               ├── sources.ts         # News source endpoints
│               └── types.ts           # TypeScript interfaces
│
└── 🔥 Configuration Files
    ├── firebase.json                 # Firebase emulator & functions deploy config
    ├── firestore.rules               # Database security rules
    ├── firestore.indexes.json        # Database indexes for performance
    ├── .firebaserc                   # Firebase project ID
    └── .env.example                  # Template for environment variables
```

---

## 🔄 Complete Code Flow (User Journey)

### **1. First-Time User: Signup & Onboarding**

```
User Opens App
    ↓
App.js (renders)
    ↓
AppNavigator checks: Is user logged in?
    ↓ (NO)
AuthNavigator renders
    ↓
User taps "Sign Up"
    ↓
SignupScreen.js
    ├─ User enters: fullName, email, password
    ├─ calls: AuthContext.signup(fullName, email, password)
    │   ├─ Firebase: createUserWithEmailAndPassword()
    │   ├─ Firestore: saves user profile doc
    │   └─ Updates displayName
    ↓
Redirects to: OnboardingScreen.js
    ├─ User enters business profile:
    │  ├─ Company name
    │  ├─ Operating locations
    │  ├─ Business goals
    │  ├─ Risk concerns (price volatility, disruptions, etc.)
    │  ├─ Risk tolerance
    │  └─ Industry type
    ├─ calls: profileService.saveProfile(profileData)
    │   └─ Firestore saves profile under user doc
    ↓
Auto-navigates to: DashboardScreen
```

### **2. Returning User: Login & Dashboard**

```
User Opens App
    ↓
App.js (renders)
    ↓
AppNavigator checks: Is user logged in?
    ↓ (YES - from Firebase session)
MainNavigator renders
    ├─ Tabs: Dashboard, New Content, Simulation, Settings, Profile
    ↓
DashboardScreen.js displays:
    ├─ Saved profile summary
    ├─ Latest impact report (from Firestore)
    ├─ Recent analyzed content
    ├─ Pending recommended actions
    ├─ Latest execution logs
    └─ Button: "Analyze New Content"
```

### **3. New Analysis: From Content to Action**

```
User taps "Analyze New Content"
    ↓
NewContentScreen.js
    ├─ User pastes article/news/alert
    ├─ Or selects from auto-fetched news feed
    ├─ User taps "Analyze"
    ├─ calls: useAgent.triggerAnalysis(content)
    │   ├─ Calls backend: POST /createAnalysisRun
    │   ├─ Passes: userId, content, savedProfile
    │   └─ Backend returns: { runId, status }
    ↓
AnalysisRunScreen.js (Progress)
    ├─ Polls Firestore for: analysisRun.status
    ├─ Shows progress indicators
    └─ When complete → redirects to ImpactReportScreen
    
    (Backend Processing - in parallel)
    ├─ agentWorker.ts receives request
    ├─ Step 1: Relevance Check
    │   ├─ Uses Genkit + Gemini
    │   ├─ Compares content against saved profile
    │   └─ Decision: Relevant? → Continue : Archive
    ├─ Step 2: Signal Extraction
    │   ├─ Extracts metrics (fuel +12%, disruption risk, etc.)
    │   └─ Stores in: analysisRun.signals
    ├─ Step 3: Insight Generation
    │   ├─ Interprets signals
    │   └─ Stores in: analysisRun.insights
    ├─ Step 4: Impact Modeling
    │   ├─ Calculates financial impact
    │   ├─ Calculates operational impact
    │   └─ Stores in: analysisRun.impacts
    ├─ Step 5: Action Formulation
    │   ├─ Generates recommended actions
    │   └─ Stores in: analysisRun.recommendedActions
    └─ Updates Firestore: analysisRun.status = 'complete'
    ↓
ImpactReportScreen.js (Results)
    ├─ Loads analysisRun from Firestore
    ├─ Displays:
    │  ├─ Before metrics
    │  ├─ Impact metrics (financial, operational)
    │  ├─ Insights & findings
    │  └─ Button: "View Recommended Actions"
    ↓
ActionsScreen.js (Recommendations)
    ├─ Displays grid of recommended actions
    ├─ User selects one action
    ├─ User taps "Simulate This Action"
    ├─ calls: useSimulation.simulateAction(actionId)
    │   └─ Calls backend: POST /simulateAction
    ↓
    (Backend Simulation)
    ├─ simulateAction.ts receives request
    ├─ Loads mock database state
    ├─ Applies action transaction:
    │  ├─ Updates fees, surcharges, routing
    │  ├─ Calculates new metrics
    │  └─ Logs execution step-by-step
    ├─ Stores in Firestore:
    │  ├─ simulationResult.beforeState
    │  ├─ simulationResult.afterState
    │  ├─ simulationResult.executionLog
    │  └─ simulationResult.metrics
    └─ Returns result ID
    ↓
SimulationResultScreen.js
    ├─ Side-by-side comparison:
    │  ├─ Before metrics vs After metrics
    │  ├─ Delta (changes) highlighted
    │  └─ Visual impact summary
    ├─ Tab: "Execution Log"
    │  └─ Shows detailed transaction steps from backend
    ├─ Options:
    │  ├─ Button: "Execute in Production" (if approved)
    │  ├─ Button: "Back to Actions"
    │  └─ Button: "Export Report"
    ↓
ExportScreen.js (Optional)
    ├─ User can download:
    │  ├─ Impact report (PDF)
    │  ├─ Execution log (JSON)
    │  └─ Before/After metrics (CSV)
    └─ Sent to user's device or email
```

---

## 🚀 Key Entry Points

### **App Root (`App.js`)**
```javascript
// This is where EVERYTHING starts
export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
// Providers wrap the entire app with global state
```

### **App Navigator (`src/navigation/AppNavigator.js`)**
```javascript
// Decides: Show Auth screens or Main app?
export default function AppNavigator() {
  const { user } = useAuth();
  return user ? <MainNavigator /> : <AuthNavigator />;
}
```

### **Main Navigator (`src/navigation/MainNavigator.js`)**
```javascript
// Bottom tab navigation for logged-in users
// Tabs: Dashboard, New Content, Simulation, Settings, Profile
```

### **Dashboard (`src/screens/DashboardScreen.js`)**
```javascript
// Main screen showing:
// - Saved profile
// - Latest analysis results
// - Recommended actions
// - Execution logs
```

---

## 🔧 Available Commands in Terminal

While the app is running, you can press:

| Key | Action |
|-----|--------|
| **w** | Open in web browser |
| **a** | Open Android emulator |
| **i** | Open iOS simulator (macOS only) |
| **s** | Switch to development build |
| **j** | Open debugger |
| **r** | Reload app (hot reload) |
| **m** | Toggle menu |
| **shift+m** | More tools |
| **o** | Open project in editor |
| **?** | Show all commands |
| **Ctrl+C** | Stop server |

---

## 📡 How Frontend & Backend Communicate

### **Frontend → Backend (API Calls)**

The frontend makes HTTP requests to Firebase Cloud Functions:

```
Frontend (React Native)
    ↓
services/api.js
    ├─ POST /createAnalysisRun
    │   └─ Body: { userId, content, profile }
    ├─ POST /simulateAction
    │   └─ Body: { userId, actionId, simulationParams }
    ├─ GET /analysisRun/{runId}
    │   └─ Polls for status
    └─ GET /executionLog/{runId}
        └─ Fetches detailed logs
    ↓
Firebase Cloud Functions (Node.js/TypeScript)
    ├─ index.ts (routes to handlers)
    ├─ agentWorker.ts (Genkit + Gemini processing)
    ├─ simulateAction.ts (state mutations)
    └─ ingestNewsTick.ts (scheduled tasks)
    ↓
Firestore Database (stores results)
    ├─ Collection: analysisRuns/{userId}/{runId}
    ├─ Collection: simulationResults/{userId}/{resultId}
    ├─ Collection: userProfiles/{userId}
    └─ Collection: executionLogs/{userId}/{logId}
```

### **Firestore Real-time Listeners**

Instead of polling, the frontend can listen to Firestore changes:

```javascript
// Example from a screen:
useEffect(() => {
  const unsubscribe = db.collection('analysisRuns')
    .doc(userId)
    .collection('runs')
    .doc(runId)
    .onSnapshot(doc => {
      setAnalysisResult(doc.data());
    });
  return unsubscribe;
}, [runId, userId]);
```

---

## 🔐 Authentication Flow

### **Firebase Authentication**
- **Sign Up**: Email + Password
- **Login**: Email + Password
- **Logout**: Clears session
- **Password Reset**: Email recovery

### **Profile Data**
- Each user has a Firestore document: `users/{userId}/profile`
- Contains: business context, locations, concerns, risk tolerance
- **Secured**: Firebase Rules ensure users can only access their own data

---

## 📊 Data Models (Firestore Structure)

### **User Profile**
```javascript
{
  userId: "user123",
  fullName: "John Doe",
  email: "john@company.com",
  businessName: "Logistics Co",
  locations: ["Lahore", "Karachi", "Islamabad"],
  businessGoals: ["Reduce costs", "Improve delivery time"],
  riskConcerns: ["Fuel price volatility", "Traffic disruptions"],
  riskTolerance: "moderate",
  industry: "Logistics",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **Analysis Run**
```javascript
{
  runId: "run_abc123",
  userId: "user123",
  content: "Article text here...",
  status: "complete", // "pending" | "processing" | "complete"
  signals: [
    { metric: "fuel_price", change: "+12%", severity: "high" },
    { metric: "route_disruption", area: "Lahore", impact: "moderate" }
  ],
  insights: ["Fuel cost increase affecting margins", "..."],
  impacts: [
    { type: "financial", amount: -45000, currency: "PKR", timeframe: "monthly" },
    { type: "operational", description: "2-3 hour delivery delays" }
  ],
  recommendedActions: [
    { id: "action_1", title: "Increase surcharge", description: "...", priority: "high" },
    { id: "action_2", title: "Optimize routes", description: "...", priority: "medium" }
  ],
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

### **Simulation Result**
```javascript
{
  resultId: "sim_xyz789",
  userId: "user123",
  runId: "run_abc123",
  actionId: "action_1",
  beforeState: {
    baseFee: 500,
    surcharge: 0,
    estimatedMargin: 50000,
    coverage: 95
  },
  afterState: {
    baseFee: 500,
    surcharge: 75,
    estimatedMargin: 65000,
    coverage: 92
  },
  metrics: {
    marginsImprovement: "+30%",
    coverageImpact: "-3%"
  },
  executionLog: [
    "Step 1: Loaded current state",
    "Step 2: Applied surcharge +75 PKR",
    "Step 3: Recalculated margins: +30%",
    "Step 4: Updated customer notification settings",
    "Step 5: Transaction complete"
  ],
  createdAt: Timestamp
}
```

---

## 🎨 Styling & Theming

### **Color System**
Located in `src/constants/colors.js`:
```javascript
const colors = {
  primary: "#007AFF",      // iOS blue
  accent: "#FF9500",       // Orange
  success: "#34C759",      // Green
  error: "#FF3B30",        // Red
  warning: "#FF9500",      // Orange
  background: "#F5F5F5",   // Light gray
  textPrimary: "#000000",  // Black
  textSecondary: "#666666" // Gray
};
```

### **Themes**
Located in `src/constants/themes.js`:
- Light theme (default)
- Dark theme (via PreferencesContext)

### **Typography**
Located in `src/constants/typography.js`:
- Font families: System fonts (optimized for mobile)
- Sizes: H1, H2, H3, Body, Caption
- Line heights: Optimized for readability

---

## 🔗 How to Access the App

### **Right Now (Web Browser)**
1. In the terminal running `npm start`, press **`w`**
2. Browser opens at `http://localhost:19000`
3. You can test login, onboarding, and all screens

### **On Your Phone**
1. Install **Expo Go** from app store
2. Scan the **QR code** in the terminal
3. App loads and updates live as you edit code

### **Important Note**
> The app currently uses **demo/mock data** and a mock Firebase setup. To connect to a real backend:
> 1. Set up a real Firebase project
> 2. Update `.env` file with Firebase credentials
> 3. Deploy Cloud Functions from `functions/` folder
> 4. Update Firestore rules and indexes

---

## 🛑 Known Issues & Next Steps

### **Current State**
- ✅ Frontend app structure complete
- ✅ All screens designed
- ✅ Navigation set up
- ⚠️ Backend Cloud Functions need Firebase project setup
- ⚠️ Database integration in progress

### **To Get Fully Operational**
1. **Set up Firebase Project**:
   ```bash
   firebase init
   firebase login
   firebase projects:list
   ```

2. **Set Environment Variables**:
   ```bash
   cp .env.example .env
   # Fill in Firebase credentials
   ```

3. **Deploy Backend Functions**:
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

4. **Test with Real Data**:
   - Create test user account
   - Complete onboarding
   - Paste sample content
   - Trigger analysis

---

## 💡 Pro Tips for Development

1. **Hot Reload**: Make changes → Save file → App updates instantly (usually)
2. **DevTools**: Press `j` in terminal to open React Native debugger
3. **Console Logs**: Use `console.log()` — they appear in terminal
4. **Firestore Emulator**: Great for testing without real database
5. **Mock Data**: Use `src/data/sampleInputs.js` for testing

---

## 📚 Additional Resources

- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/
- **Firebase Docs**: https://firebase.google.com/docs
- **Genkit Docs**: https://firebase.google.com/docs/genkit
- **TypeScript**: https://www.typescriptlang.org/docs/

---

**Your app is running! Press `w` in the terminal to see it in action.** 🎉
