/**
 * App Navigator — Stack-based navigation for all screens
 * Maps to the agentic pipeline flow:
 * Home → Ingestion → Understanding → Insights → Impact → Actions → Simulation → Comparison → Outcome
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Colors from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import IngestionScreen from '../screens/IngestionScreen';
import UnderstandingScreen from '../screens/UnderstandingScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ImpactScreen from '../screens/ImpactScreen';
import ActionsScreen from '../screens/ActionsScreen';
import SimulationScreen from '../screens/SimulationScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import AgentTraceScreen from '../screens/AgentTraceScreen';
import OutcomeScreen from '../screens/OutcomeScreen';
import DemoScreen from '../screens/DemoScreen';
import ExportScreen from '../screens/ExportScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: Colors.background },
};

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Ingestion" component={IngestionScreen} options={{ title: 'Content Input' }} />
      <Stack.Screen name="Understanding" component={UnderstandingScreen} options={{ title: 'Understanding' }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      <Stack.Screen name="Impact" component={ImpactScreen} options={{ title: 'Impact Analysis' }} />
      <Stack.Screen name="Actions" component={ActionsScreen} options={{ title: 'Recommendations' }} />
      <Stack.Screen name="Simulation" component={SimulationScreen} options={{ title: 'Simulation' }} />
      <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ title: 'Before vs After' }} />
      <Stack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Trace' }} />
      <Stack.Screen name="Outcome" component={OutcomeScreen} options={{ title: 'Outcome' }} />
      <Stack.Screen name="Demo" component={DemoScreen} options={{ title: 'Demo Scenarios' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
    </Stack.Navigator>
  );
}
