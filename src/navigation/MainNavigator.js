/**
 * Main Navigator — Hybrid Stack and Bottom Tab navigation
 * Maps to the agentic pipeline flow while maintaining constant access to core screens.
 */
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import IngestionScreen from '../screens/IngestionScreen';
import UnderstandingScreen from '../screens/UnderstandingScreen';
import InsightsScreen from '../screens/InsightsScreen';
import ImpactScreen from '../screens/ImpactScreen';
import ActionsScreen from '../screens/ActionsScreen';
import SimulationScreen from '../screens/SimulationScreen';
import AgentTraceScreen from '../screens/AgentTraceScreen';
import OutcomeScreen from '../screens/OutcomeScreen';
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
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'InsightsTab') {
            iconName = focused ? 'bulb' : 'bulb-outline';
          } else if (route.name === 'ActionsTab') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
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
        component={HomeScreen} 
        options={{ tabBarLabel: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="IngestionTab" 
        component={IngestionScreen} 
        options={{ tabBarLabel: 'Ingestion' }} 
      />
      <Tab.Screen 
        name="InsightsTab" 
        component={InsightsScreen} 
        options={{ tabBarLabel: 'Insights' }} 
      />
      <Tab.Screen 
        name="ActionsTab" 
        component={ActionsScreen} 
        options={{ tabBarLabel: 'Actions' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileSettingsScreen} 
        options={{ tabBarLabel: 'Profile' }} 
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
      <Stack.Screen name="Ingestion" component={IngestionScreen} options={{ title: 'Content Input' }} />
      <Stack.Screen name="Understanding" component={UnderstandingScreen} options={{ title: 'Understanding' }} />
      <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Insights' }} />
      <Stack.Screen name="Impact" component={ImpactScreen} options={{ title: 'Impact Analysis' }} />
      <Stack.Screen name="Actions" component={ActionsScreen} options={{ title: 'Recommendations' }} />
      <Stack.Screen name="Simulation" component={SimulationScreen} options={{ title: 'Simulation' }} />
      <Stack.Screen name="AgentTrace" component={AgentTraceScreen} options={{ title: 'Agent Trace' }} />
      <Stack.Screen name="Outcome" component={OutcomeScreen} options={{ title: 'Outcome' }} />
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
    height: 60,
    paddingBottom: 8,
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
  },
});
