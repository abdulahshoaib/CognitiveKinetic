import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

const STAGES = [
  { id: 'idle', label: 'Ready', icon: 'play' },
  { id: 'loading_profile', label: 'Profile', icon: 'user' },
  { id: 'ingesting', label: 'Ingest', icon: 'download' },
  { id: 'signals', label: 'Signals', icon: 'activity' },
  { id: 'relevance', label: 'Relevance', icon: 'filter' },
  { id: 'insights', label: 'Insights', icon: 'compass' },
  { id: 'impact', label: 'Impact', icon: 'alert-triangle' },
  { id: 'actions', label: 'Actions', icon: 'zap' },
  { id: 'completed', label: 'Done', icon: 'check-circle' },
];

export default function StepProgress({ currentStage, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { backgroundColor: c.surfaceBorder }]} />
      <View style={styles.stepsRow}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex || currentStage === 'completed';
          const isCurrent = index === currentIndex && currentStage !== 'completed';
          
          let color = c.surfaceVariant;
          if (isCompleted) color = c.success;
          if (isCurrent) color = c.accent;

          return (
            <View key={stage.id} style={styles.stepContainer}>
              <View style={[
                styles.iconWrapper, 
                { backgroundColor: color },
                isCurrent && [styles.currentGlow, { shadowColor: c.accent, borderColor: c.white }]
              ]}>
                <Feather name={stage.icon} size={14} color={c.white} />
              </View>
              {isCurrent && (
                <Text style={[styles.label, { color: c.textPrimary }]}>{stage.label}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  track: {
    position: 'absolute',
    top: 32, // center of icons
    left: 40,
    right: 40,
    height: 2,
    backgroundColor: Colors.surfaceBorder,
    zIndex: 0,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  stepContainer: {
    alignItems: 'center',
    width: 32,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  currentGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: FontWeights.bold,
    position: 'absolute',
    top: 32,
    width: 60,
    textAlign: 'center',
  },
});
