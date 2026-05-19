# File-by-File Code Explanation

## 🎯 Understanding What Each File Does

---

## 📍 Entry Point Files

### **index.js** (Root Entry Point)
```javascript
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```
**Purpose**: Tells Expo/React Native where to start rendering. This is always called first.
**What it does**: Registers `App.js` as the root component.

---

### **App.js** (Main App Component)
```javascript
export default function App() {
  return (
    <SafeAreaProvider>           // Manages safe zones on notched phones
      <PreferencesProvider>       // Global theme & settings state
        <AppShell />             // Main app structure
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
```
**Purpose**: The ultimate parent component wrapping the entire app.
**What it does**: 
1. Sets up global state providers (Theme, Preferences)
2. Ensures content respects notches/safe areas
3. Renders AppShell which routes between Auth and Main app

**When used**: Every time the app loads

---

### **app.json** (Expo Configuration)
```json
{
  "expo": {
    "name": "Relay",              // App display name
    "slug": "relay",              // Unique identifier
    "version": "1.0.0",           // Current version
    "orientation": "portrait",    // Lock to portrait
    "icon": "./assets/icon.png",  // App icon
    "splash": { ... },            // Loading screen
    "android": { ... },           // Android-specific settings
    "ios": { ... },               // iOS-specific settings
    "web": { ... }                // Web-specific settings
  }
}
```
**Purpose**: Configuration file for Expo. Defines app name, version, permissions, etc.
**When used**: Read by Expo CLI when building/running the app
**You need to update this if**: Changing app name, version, or adding permissions

---

## 🧭 Navigation Files

### **src/navigation/AppNavigator.js** (Root Navigator)
```javascript
export default function AppNavigator() {
  const { user, initializing } = useAuth();
  
  if (initializing) {
    return <ActivityIndicator />;  // Show loading spinner
  }
  
  // Shows AuthNavigator (login/signup) OR MainNavigator (app tabs)
  return user ? <MainNavigator /> : <AuthNavigator />;
}
```
**Purpose**: Decides which screens to show based on login status.
**Logic**: 
- If user is authenticated → Show MainNavigator (app screens)
- If user is NOT authenticated → Show AuthNavigator (login screens)
- While checking auth status → Show loading spinner

---

### **src/navigation/AuthNavigator.js**
```javascript
// Screens: LoginScreen, SignupScreen, ForgotPasswordScreen
const Stack = createNativeStackNavigator();
export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```
**Purpose**: Stack navigation for unauthenticated users.
**Flow**: User starts at Login → can go to Signup → can do Forgot Password
**When used**: User is not logged in

---

### **src/navigation/MainNavigator.js**
```javascript
// Screens: Dashboard, NewContent, Simulation, Settings, Profile
const Tab = createBottomTabNavigator();
export default function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="NewContent" component={NewContentScreen} />
      <Tab.Screen name="Simulation" component={SimulationResultScreen} />
      <Tab.Screen name="Settings" component={UserPreferencesScreen} />
      <Tab.Screen name="Profile" component={ProfileSettingsScreen} />
    </Tab.Navigator>
  );
}
```
**Purpose**: Bottom tab navigation for authenticated users.
**UX**: 5 tabs at the bottom, user can tap to switch between screens
**When used**: User is logged in

---

## 🔐 Context Files (Global State)

### **src/context/AuthContext.js** (Authentication State)
```javascript
const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Firebase listener for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (fullName, email, password) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName: fullName });
    return userCred;
  };

  const logout = async () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```
**Purpose**: Manages user authentication state globally.
**Stores**: 
- `user` - Current logged-in user object
- `initializing` - Whether checking auth status
**Methods**: `login()`, `signup()`, `logout()`
**When used**: Everywhere user needs to know if they're logged in

**Example usage**:
```javascript
const { user, login } = useAuth();
if (user) { /* show main app */ }
```

---

### **src/context/PreferencesContext.js** (Theme & Settings)
```javascript
const PreferencesContext = createContext({});

export const PreferencesProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTheme, setActiveTheme] = useState(LIGHT_THEME);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    setActiveTheme(darkMode ? LIGHT_THEME : DARK_THEME);
  };

  return (
    <PreferencesContext.Provider value={{ activeTheme, darkMode, toggleDarkMode }}>
      {children}
    </PreferencesContext.Provider>
  );
};
```
**Purpose**: Stores user preferences (theme, notifications, etc.).
**Stores**: 
- `activeTheme` - Current color scheme
- `darkMode` - Is dark mode on?
**Methods**: `toggleDarkMode()`

---

### **src/context/AnalysisContext.js** (Analysis Results)
```javascript
const AnalysisContext = createContext({});

export const AnalysisProvider = ({ children }) => {
  const [analysisRun, setAnalysisRun] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const setAnalysisData = (data) => {
    setAnalysisRun(data);
  };

  return (
    <AnalysisContext.Provider value={{ 
      analysisRun, 
      simulationResult, 
      recommendations,
      setAnalysisData 
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};
```
**Purpose**: Stores analysis results, recommendations, and simulation data.
**Used by**: ImpactReportScreen, ActionsScreen, SimulationResultScreen
**Data stored**: 
- Current analysis run data
- Simulation results
- Recommended actions

---

## 🖥️ Screen Files (What Users See)

Each screen is a React component that renders a full page of the app.

### **src/screens/DashboardScreen.js** (Home Screen)
```javascript
export default function DashboardScreen() {
  const { user } = useAuth();
  const { analysisRun } = useAnalysis();

  return (
    <View>
      <Header title="Dashboard" />
      <ProfileSummaryCard profile={user.profile} />
      <LatestImpactCard data={analysisRun} />
      <RecommendedActionsPreview actions={analysisRun?.recommendations} />
      <Button title="Analyze New Content" onPress={navigateToNewContent} />
    </View>
  );
}
```
**Purpose**: Main dashboard showing overview of everything.
**Shows**: 
- Saved business profile
- Latest analysis results
- Recent actions taken
- Quick access to "Analyze New Content"
**When accessed**: User logs in, lands here first

---

### **src/screens/auth/LoginScreen.js**
```javascript
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Success → Navigation automatically redirects to MainNavigator
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <View>
      <TextInput 
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput 
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
    </View>
  );
}
```
**Purpose**: Email/password login screen.
**UX Flow**: 
1. User enters email & password
2. Taps "Login"
3. Calls `AuthContext.login()`
4. If successful → Auto-redirects to Dashboard
5. If failed → Shows error alert

---

### **src/screens/auth/SignupScreen.js**
```javascript
export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();

  const handleSignup = async () => {
    await signup(fullName, email, password);
    // Auto-redirects to OnboardingScreen
  };

  return (
    <View>
      <TextInput placeholder="Full Name" value={fullName} onChange={...} />
      <TextInput placeholder="Email" value={email} onChange={...} />
      <TextInput placeholder="Password" value={password} onChange={...} />
      <Button title="Sign Up" onPress={handleSignup} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </View>
  );
}
```
**Purpose**: User registration screen.
**Creates**: New user account in Firebase

---

### **src/screens/OnboardingScreen.js** (Profile Setup)
```javascript
export default function OnboardingScreen() {
  const [profile, setProfile] = useState({
    businessName: '',
    locations: [],
    businessGoals: [],
    riskConcerns: [],
    riskTolerance: 'medium'
  });

  const handleSaveProfile = async () => {
    await profileService.saveProfile(profile);
    navigation.navigate('Dashboard');
  };

  return (
    <View>
      <TextInput 
        placeholder="Business Name"
        value={profile.businessName}
        onChangeText={(text) => 
          setProfile({...profile, businessName: text})
        }
      />
      <MultiSelect 
        label="Operating Locations"
        options={['Lahore', 'Karachi', 'Islamabad']}
        selected={profile.locations}
        onChange={(locs) => setProfile({...profile, locations: locs})}
      />
      {/* More fields... */}
      <Button title="Save Profile & Continue" onPress={handleSaveProfile} />
    </View>
  );
}
```
**Purpose**: One-time business profile setup for first-time users.
**Collects**: 
- Company name
- Operating locations
- Business goals
- Risk concerns
- Risk tolerance
**Saves to**: Firestore under user's profile document
**Next**: Redirects to Dashboard

---

### **src/screens/NewContentScreen.js** (Analysis Input)
```javascript
export default function NewContentScreen() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { triggerAnalysis } = useAgent();

  const handleAnalyze = async () => {
    setLoading(true);
    const runId = await triggerAnalysis(content);
    // Navigates to AnalysisRunScreen with runId
    navigation.navigate('AnalysisRun', { runId });
  };

  return (
    <View>
      <TextInput 
        placeholder="Paste article, news, or alert here..."
        multiline
        numberOfLines={10}
        value={content}
        onChangeText={setContent}
      />
      <Button 
        title="Analyze" 
        onPress={handleAnalyze}
        disabled={!content.trim()}
      />
      <Button title="Load Sample Content" onPress={() => {
        setContent(SAMPLE_INPUTS[0]);
      }} />
    </View>
  );
}
```
**Purpose**: Screen where users paste new content for analysis.
**Flow**: 
1. User pastes content
2. Taps "Analyze"
3. Calls `useAgent.triggerAnalysis(content)` → Backend processes
4. Navigates to AnalysisRunScreen (loading/progress)

---

### **src/screens/AnalysisRunScreen.js** (Progress Indicator)
```javascript
export default function AnalysisRunScreen({ route }) {
  const { runId } = route.params;
  const [status, setStatus] = useState('processing');
  const { analysisRun } = useAnalysis();

  // Real-time listener to Firestore
  useEffect(() => {
    const unsubscribe = db.collection('analysisRuns')
      .doc(runId)
      .onSnapshot(doc => {
        const data = doc.data();
        setStatus(data.status);
        
        if (data.status === 'complete') {
          // Auto-redirect to results
          navigation.navigate('ImpactReport', { runId });
        }
      });
    
    return unsubscribe;
  }, [runId]);

  return (
    <View>
      <Header title="Analyzing Content..." />
      <ProgressBar progress={getProgress(status)} />
      <Text>Status: {status}</Text>
      <ActivityIndicator size="large" />
      <Text>Processing your content against saved profile...</Text>
    </View>
  );
}
```
**Purpose**: Shows progress while backend analyzes content.
**UX**: Loading spinner with status updates
**Logic**: Polls Firestore for status changes, auto-redirects when complete

---

### **src/screens/ImpactReportScreen.js** (Results)
```javascript
export default function ImpactReportScreen({ route }) {
  const { runId } = route.params;
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Load analysisRun from Firestore
    db.collection('analysisRuns').doc(runId).get().then(doc => {
      setReport(doc.data());
    });
  }, [runId]);

  return (
    <ScrollView>
      <Header title="Impact Report" />
      
      {/* Signals */}
      <SectionHeader title="Detected Signals" />
      {report?.signals?.map(signal => (
        <SignalCard key={signal.id} signal={signal} />
      ))}

      {/* Insights */}
      <SectionHeader title="Key Insights" />
      {report?.insights?.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}

      {/* Impacts */}
      <SectionHeader title="Projected Impacts" />
      {report?.impacts?.map(impact => (
        <ImpactCard key={impact.id} impact={impact} />
      ))}

      {/* CTA */}
      <Button 
        title="View Recommended Actions"
        onPress={() => navigation.navigate('Actions', { runId })}
      />
    </ScrollView>
  );
}
```
**Purpose**: Shows detailed analysis results to the user.
**Displays**: 
- Detected signals (metrics)
- Key insights
- Financial & operational impacts
- CTA to view recommended actions

---

### **src/screens/ActionsScreen.js** (Recommendations)
```javascript
export default function ActionsScreen({ route }) {
  const { runId } = route.params;
  const [actions, setActions] = useState([]);

  useEffect(() => {
    // Load recommended actions from Firestore
    db.collection('analysisRuns').doc(runId).get().then(doc => {
      setActions(doc.data()?.recommendedActions || []);
    });
  }, [runId]);

  const handleSimulateAction = (actionId) => {
    navigation.navigate('SimulationResult', { runId, actionId });
  };

  return (
    <View>
      <Header title="Recommended Actions" />
      <FlatList
        data={actions}
        renderItem={({ item }) => (
          <ActionCard 
            action={item}
            onSimulate={() => handleSimulateAction(item.id)}
          />
        )}
      />
    </View>
  );
}
```
**Purpose**: Shows grid of recommended actions.
**UX**: Each action is a card with title, description, priority
**User can**: Tap to simulate what would happen if executed

---

### **src/screens/SimulationResultScreen.js** (Before/After)
```javascript
export default function SimulationResultScreen({ route }) {
  const { runId, actionId } = route.params;
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const { simulateAction } = useSimulation();

  const handleRunSimulation = async () => {
    setLoading(true);
    const result = await simulateAction(runId, actionId);
    setSimulation(result);
    setLoading(false);
  };

  return (
    <ScrollView>
      <Header title="Simulation Result" />

      {!simulation ? (
        <>
          <ExplainerCard action={selectedAction} />
          <Button 
            title="Run Simulation"
            onPress={handleRunSimulation}
            disabled={loading}
          />
        </>
      ) : (
        <>
          {/* Before/After Comparison */}
          <ComparisonTable 
            before={simulation.beforeState}
            after={simulation.afterState}
          />

          {/* Delta (Changes) */}
          <DeltaCard deltas={simulation.metrics} />

          {/* Execution Log */}
          <TabView tabs={[
            {
              name: 'Execution Log',
              render: () => <ExecutionLogList logs={simulation.executionLog} />
            },
            {
              name: 'Export',
              render: () => <ExportOptions simulation={simulation} />
            }
          ]} />
        </>
      )}
    </ScrollView>
  );
}
```
**Purpose**: Shows what would happen if user executes the action.
**Features**: 
- Before/after metrics table
- Change deltas highlighted
- Technical execution log
- Export/download options

---

## 📦 Service Files (API Integration)

### **src/services/firebase.js** (Firebase Setup)
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```
**Purpose**: Initializes Firebase and exports instances.
**Exports**: `auth` (for authentication), `db` (for database)
**Used by**: All other service files

---

### **src/services/profileService.js** (Save/Load User Profile)
```javascript
import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function saveProfile(profileData) {
  const userId = auth.currentUser.uid;
  const docRef = doc(db, 'userProfiles', userId);
  
  await setDoc(docRef, {
    ...profileData,
    updatedAt: new Date()
  });
}

export async function getProfile() {
  const userId = auth.currentUser.uid;
  const docRef = doc(db, 'userProfiles', userId);
  const docSnap = await getDoc(docRef);
  
  return docSnap.exists() ? docSnap.data() : null;
}
```
**Purpose**: Load/save user business profile to Firestore.
**Functions**: 
- `saveProfile(data)` - Writes profile
- `getProfile()` - Reads profile

---

### **src/services/api.js** (Backend API Calls)
```javascript
const API_BASE = 'https://us-central1-project-id.cloudfunctions.net';

export async function createAnalysisRun(content, userId) {
  const response = await fetch(
    `${API_BASE}/createAnalysisRun`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, userId })
    }
  );
  return response.json();
}

export async function simulateAction(runId, actionId, userId) {
  const response = await fetch(
    `${API_BASE}/simulateAction`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, actionId, userId })
    }
  );
  return response.json();
}
```
**Purpose**: Makes HTTP calls to backend Cloud Functions.
**Functions**: 
- `createAnalysisRun()` - Triggers analysis
- `simulateAction()` - Runs simulation

---

## 🎣 Hooks (Custom React Logic)

### **src/hooks/useAuth.js**
```javascript
export function useAuth() {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return authContext;
}
```
**Purpose**: Custom hook to access auth context.
**Usage**: `const { user, login, logout } = useAuth();`

---

### **src/hooks/useAgent.js**
```javascript
export function useAgent() {
  const { setAnalysisData } = useContext(AnalysisContext);
  const { user } = useAuth();

  const triggerAnalysis = async (content) => {
    const runData = await api.createAnalysisRun(content, user.uid);
    setAnalysisData(runData);
    return runData.runId;
  };

  return { triggerAnalysis };
}
```
**Purpose**: Wrapper around analysis API calls.
**Methods**: `triggerAnalysis(content)`

---

### **src/hooks/useSimulation.js**
```javascript
export function useSimulation() {
  const { setSimulationResult } = useContext(AnalysisContext);
  const { user } = useAuth();

  const simulateAction = async (runId, actionId) => {
    const result = await api.simulateAction(runId, actionId, user.uid);
    setSimulationResult(result);
    return result;
  };

  return { simulateAction };
}
```
**Purpose**: Wrapper around simulation API calls.
**Methods**: `simulateAction(runId, actionId)`

---

## 🎨 Component Files (Reusable UI)

### **src/components/common/Button.js** (Button Component)
```javascript
export default function Button({
  title,
  onPress,
  disabled,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  size = 'medium'       // 'small' | 'medium' | 'large'
}) {
  const theme = usePreferences().activeTheme;
  
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
```
**Purpose**: Reusable button component with variants.
**Variants**: Primary (blue), Secondary (gray), Danger (red)
**Used everywhere**: Throughout the app

---

### **src/components/common/Card.js** (Card Container)
```javascript
export default function Card({ children, style }) {
  const theme = usePreferences().activeTheme;
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.border
        },
        style
      ]}
    >
      {children}
    </View>
  );
}
```
**Purpose**: Reusable container with consistent styling.
**Features**: Shadows, rounded corners, theming support

---

## 📊 Constants Files

### **src/constants/colors.js**
```javascript
const colors = {
  // Brand colors
  primary: '#007AFF',        // iOS Blue
  accent: '#FF9500',         // Orange
  success: '#34C759',        // Green
  warning: '#FF9500',        // Orange
  error: '#FF3B30',          // Red
  
  // Grays
  background: '#F5F5F5',     // Light
  surface: '#FFFFFF',        // White
  surfaceContainer: '#FAFAFA',
  border: '#E0E0E0',
  
  // Text
  textPrimary: '#000000',    // Black
  textSecondary: '#666666',  // Gray
  textTertiary: '#999999'    // Light Gray
};
```
**Purpose**: Centralized color definitions.
**Usage**: `const { textPrimary } = usePreferences().activeTheme.colors;`

---

### **src/constants/typography.js**
```javascript
const typography = {
  H1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40
  },
  H2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32
  },
  Body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24
  },
  Caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16
  }
};
```
**Purpose**: Consistent typography across app.
**Usage**: `<Text style={typography.H1}>Title</Text>`

---

## 📁 Backend Files (Cloud Functions)

### **functions/src/index.ts** (Function Exports)
```typescript
import * as functions from 'firebase-functions';
import { agentWorker } from './agentWorker';
import { createAnalysisRun } from './createAnalysisRun';
import { simulateAction } from './simulateAction';
import { ingestNewsTick } from './ingestNewsTick';

export const analysisFunction = functions.https.onCall(agentWorker);
export const createRun = functions.https.onCall(createAnalysisRun);
export const simulate = functions.https.onCall(simulateAction);
export const ingest = functions.pubsub.schedule('every 6 hours').onRun(ingestNewsTick);
```
**Purpose**: Exports all Cloud Functions.
**Types**: `https.onCall()` (callable), `pubsub.schedule()` (cron)

---

### **functions/src/agentWorker.ts** (Main AI Processing)
```typescript
import { genkit, z } from 'genkit';
import { gemini15Flash } from '@genkit-ai/google-genai';

export async function agentWorker(request: any) {
  const { content, profile, userId } = request;
  
  // Step 1: Relevance Check
  const relevanceCheck = await gemini15Flash.generate({
    prompt: `Is this content relevant to: ${JSON.stringify(profile)}?`,
    input: content
  });
  
  if (!isRelevant(relevanceCheck)) {
    return { status: 'archived' };
  }
  
  // Step 2: Signal Extraction
  const signals = await extractSignals(content, profile);
  
  // Step 3: Insight Generation
  const insights = await generateInsights(signals, profile);
  
  // Step 4: Impact Modeling
  const impacts = await calculateImpacts(insights);
  
  // Step 5: Action Formulation
  const actions = await formulateActions(impacts, profile);
  
  // Save to Firestore
  await saveAnalysisRun(userId, {
    signals,
    insights,
    impacts,
    recommendedActions: actions,
    status: 'complete'
  });
  
  return { status: 'complete', signals, insights, impacts, actions };
}
```
**Purpose**: AI agent that processes content and generates recommendations.
**Flow**: Relevance → Signals → Insights → Impacts → Actions
**Tech**: Google Genkit + Gemini AI model

---

### **functions/src/createAnalysisRun.ts** (Trigger Analysis)
```typescript
export async function createAnalysisRun(request: any) {
  const { content, userId } = request;
  
  // Load user's saved profile
  const profile = await loadProfile(userId);
  
  // Create analysis run record
  const runId = generateId();
  await createRunRecord(userId, runId, {
    content,
    status: 'processing',
    createdAt: Date.now()
  });
  
  // Call agent worker in background
  callAgentWorker(content, profile, userId, runId);
  
  return { runId, status: 'processing' };
}
```
**Purpose**: HTTP endpoint to start a new analysis.
**Called by**: Frontend `useAgent.triggerAnalysis()`
**Returns**: `{ runId, status }`

---

### **functions/src/simulateAction.ts** (Execute Simulation)
```typescript
export async function simulateAction(request: any) {
  const { runId, actionId, userId } = request;
  
  // Load action details
  const action = await loadAction(userId, runId, actionId);
  
  // Load mock database state
  const beforeState = await loadMockDatabaseState(userId);
  
  // Apply action transaction
  const afterState = { ...beforeState };
  const log = [];
  
  log.push(`Loaded current state`);
  applyActionToState(action, afterState, log);
  log.push(`Action applied successfully`);
  
  // Calculate metrics changes
  const metrics = calculateMetrics(beforeState, afterState);
  
  // Save result
  const resultId = generateId();
  await saveSimulationResult(userId, {
    resultId,
    runId,
    actionId,
    beforeState,
    afterState,
    metrics,
    executionLog: log,
    createdAt: Date.now()
  });
  
  return { resultId, beforeState, afterState, metrics, log };
}
```
**Purpose**: HTTP endpoint to simulate an action.
**Returns**: `{ beforeState, afterState, metrics, log }`
**Represents**: What-if analysis without changing real state

---

## 🗄️ Database Rules

### **firestore.rules** (Security)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /userProfiles/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /analysisRuns/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /simulationResults/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```
**Purpose**: Security rules ensuring privacy.
**Rule**: Users can only access their own data

---

## 🚀 Summary

This project is split into:

1. **Frontend** (React Native): What users see and interact with
2. **Backend** (Cloud Functions): AI processing and business logic
3. **Database** (Firestore): Persistent storage

**Data flow**: User → Frontend → Backend → Database → Frontend UI

All screens are connected through navigation and global state (Context API).

Each screen calls services/hooks that make API calls to backend functions.
Backend functions use Genkit + Gemini for AI processing.
Results are stored in Firestore and displayed back to user.

---

End of file-by-file explanation!
