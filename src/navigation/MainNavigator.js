/**
 * Main Navigator — Hybrid Stack and Bottom Tab navigation
 * Streamlined to core pipeline: Dashboard -> New Content -> Actions -> Company Context
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { usePreferences } from '../context/PreferencesContext';

// New Unified Screens
import DashboardScreen from '../screens/DashboardScreen';
import NewContentScreen from '../screens/NewContentScreen';
import ActionsScreen from '../screens/ActionsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import UserPreferencesScreen from '../screens/UserPreferencesScreen';

// Stack Only Screens
import AnalysisRunScreen from '../screens/AnalysisRunScreen';
import ImpactReportScreen from '../screens/ImpactReportScreen';
import SimulationResultScreen from '../screens/SimulationResultScreen';
import AgentTraceScreen from '../screens/AgentTraceScreen';
import DemoScreen from '../screens/DemoScreen';
import ExportScreen from '../screens/ExportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const IngestionStack = createNativeStackNavigator();
const ActionsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const subStackScreenOptions = (c) => ({
  headerStyle: { backgroundColor: c.background },
  headerTintColor: c.textPrimary,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: c.background },
  headerBackTitleVisible: false,
});

function DashboardStackScreen() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  return (
    <DashboardStack.Navigator screenOptions={subStackScreenOptions(c)}>
      <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="ImpactReport" component={ImpactReportScreen} options={{ title: 'Impact Report' }} />
      <DashboardStack.Screen name="SimulationResult" component={SimulationResultScreen} options={{ title: 'Simulation Result' }} />
      <DashboardStack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Trace' }} />
      <DashboardStack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
      <DashboardStack.Screen name="Demo" component={DemoScreen} options={{ title: 'Demo Scenarios' }} />
    </DashboardStack.Navigator>
  );
}

function IngestionStackScreen() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  return (
    <IngestionStack.Navigator screenOptions={subStackScreenOptions(c)}>
      <IngestionStack.Screen name="IngestionMain" component={NewContentScreen} options={{ headerShown: false }} />
      <IngestionStack.Screen name="AnalysisRun" component={AnalysisRunScreen} options={{ title: 'Analysis Progress' }} />
      <IngestionStack.Screen name="ImpactReport" component={ImpactReportScreen} options={{ title: 'Impact Report' }} />
      <IngestionStack.Screen name="SimulationResult" component={SimulationResultScreen} options={{ title: 'Simulation Result' }} />
      <IngestionStack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Trace' }} />
    </IngestionStack.Navigator>
  );
}

function ActionsStackScreen() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  return (
    <ActionsStack.Navigator screenOptions={subStackScreenOptions(c)}>
      <ActionsStack.Screen name="ActionsMain" component={ActionsScreen} options={{ headerShown: false }} />
      <ActionsStack.Screen name="SimulationResult" component={SimulationResultScreen} options={{ title: 'Simulation Result' }} />
    </ActionsStack.Navigator>
  );
}

function SettingsStackScreen() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  return (
    <SettingsStack.Navigator screenOptions={subStackScreenOptions(c)}>
      <SettingsStack.Screen name="SettingsMain" component={ProfileSettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="UserPreferences" component={UserPreferencesScreen} options={{ title: 'User Preferences' }} />
    </SettingsStack.Navigator>
  );
}

// Bottom Tab Navigator configuration
function BottomTabNavigator() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'activity';
          } else if (route.name === 'IngestionTab') {
            iconName = 'plus-circle';
          } else if (route.name === 'ActionsTab') {
            iconName = 'zap';
          } else if (route.name === 'ProfileTab') {
            iconName = 'sliders';
          }

          return <Feather name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarStyle: [styles.tabBar, { backgroundColor: c.surfaceContainerLow, borderTopColor: c.surfaceBorder }],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStackScreen} 
        options={{ tabBarLabel: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="IngestionTab" 
        component={IngestionStackScreen} 
        options={{ tabBarLabel: 'New Content' }} 
      />
      <Tab.Screen 
        name="ActionsTab" 
        component={ActionsStackScreen} 
        options={{ tabBarLabel: 'Actions' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={SettingsStackScreen} 
        options={{ tabBarLabel: 'Settings' }} 
      />
    </Tab.Navigator>
  );
}

const stackScreenOptions = {
  headerStyle: { backgroundColor: Colors.background },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: Colors.background },
  headerBackTitleVisible: false,
};
export default function MainNavigator() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...stackScreenOptions,
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.textPrimary,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      {/* Tab bar is mounted as the default "Home" route */}
      <Stack.Screen name="Home" component={BottomTabNavigator} options={{ headerShown: false }} />
      
      {/* Onboarding doesn't show tab bar and has no header */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    minHeight: 68,
    paddingBottom: 10,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
    minWidth: 72,
  },
});
