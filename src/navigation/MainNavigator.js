/**
 * Main Navigator — Hybrid Stack and Bottom Tab navigation
 * Streamlined to core pipeline: Dashboard -> New Content -> Actions -> Company Context
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

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

// Bottom Tab Navigator configuration
function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'IngestionTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ActionsTab') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'business' : 'business-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarLabel: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="IngestionTab" 
        component={NewContentScreen} 
        options={{ tabBarLabel: 'New Content' }} 
      />
      <Tab.Screen 
        name="ActionsTab" 
        component={ActionsScreen} 
        options={{ tabBarLabel: 'Actions' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileSettingsScreen} 
        options={{ tabBarLabel: 'Context' }} 
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
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={stackScreenOptions}>
      {/* Tab bar is mounted as the default "Home" route */}
      <Stack.Screen name="Home" component={BottomTabNavigator} options={{ headerShown: false }} />
      
      {/* Onboarding doesn't show tab bar and has no header */}
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      
      {/* Other stack screens for workflow flows, fully accessible with back buttons */}
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profile Settings' }} />
      <Stack.Screen name="UserPreferences" component={UserPreferencesScreen} options={{ title: 'User Preferences' }} />
      
      {/* Pipeline execution screens */}
      <Stack.Screen name="AnalysisRun" component={AnalysisRunScreen} options={{ title: 'Analysis Progress' }} />
      <Stack.Screen name="ImpactReport" component={ImpactReportScreen} options={{ title: 'Impact Report' }} />
      <Stack.Screen name="SimulationResult" component={SimulationResultScreen} options={{ title: 'Simulation Result' }} />
      
      <Stack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Trace' }} />
      <Stack.Screen name="Demo" component={DemoScreen} options={{ title: 'Demo Scenarios' }} />
      <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Export' }} />
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
