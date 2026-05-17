import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AnalysisProvider } from './src/context/AnalysisContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AnalysisProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AnalysisProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
