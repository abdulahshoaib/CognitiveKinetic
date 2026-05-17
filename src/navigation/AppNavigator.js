import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import Colors from '../constants/colors';

export default function AppNavigator() {
  const { user, initializing } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthNavigator />;
}
