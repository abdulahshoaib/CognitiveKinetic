import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AnalysisProvider } from './src/context/AnalysisContext';
import { PreferencesProvider, usePreferences } from './src/context/PreferencesContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppShell() {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: c.accent,
      background: c.background,
      card: c.surfaceContainerLow,
      text: c.textPrimary,
      border: c.surfaceBorder,
      notification: c.accent,
    },
  };

  return (
    <AuthProvider>
      <AnalysisProvider>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>
      </AnalysisProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
