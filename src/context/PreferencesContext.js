import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Themes } from '../constants/themes';

const PREFERENCES_STORAGE_KEY = '@cognitive_kinetic_preferences';

const defaultPreferences = {
  themeMode: 'ember-carbon',
  insightStyle: 'simple', // simple, detailed, technical
  motion: 'full', // full, reduced, minimal
  homeFocus: 'latest-insight', // latest-insight, current-goal, action-queue, progress-summary
  agentTransparency: 'summary-only', // hidden, summary-only, full-trace
};

const PreferencesContext = createContext();

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load preferences', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error(`Failed to save preference: ${key}`, error);
    }
  };

  const activeTheme = Themes[preferences.themeMode] || Themes['ember-carbon'];

  const value = {
    preferences,
    updatePreference,
    activeTheme,
    isLoaded,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
