import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';

const STAGES = [
  { id: 'idle', label: 'Ready', icon: 'play-outline' },
  { id: 'loading_profile', label: 'Profile', icon: 'person-outline' },
  { id: 'ingesting', label: 'Ingest', icon: 'download-outline' },
  { id: 'signals', label: 'Signals', icon: 'git-network-outline' },
  { id: 'relevance', label: 'Relevance', icon: 'filter-outline' },
  { id: 'insights', label: 'Insights', icon: 'bulb-outline' },
  { id: 'impact', label: 'Impact', icon: 'warning-outline' },
  { id: 'actions', label: 'Actions', icon: 'flash-outline' },
  { id: 'completed', label: 'Done', icon: 'checkmark-circle-outline' },
];

export default function StepProgress({ currentStage, style }) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.track} />
      <View style={styles.stepsRow}>
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex || currentStage === 'completed';
          const isCurrent = index === currentIndex && currentStage !== 'completed';
          
          let color = Colors.surfaceVariant;
          if (isCompleted) color = Colors.success;
          if (isCurrent) color = Colors.accent;

          return (
            <View key={stage.id} style={styles.stepContainer}>
              <View style={[
                styles.iconWrapper, 
                { backgroundColor: color },
                isCurrent && styles.currentGlow
              ]}>
                <Ionicons name={stage.icon} size={14} color={Colors.white} />
              </View>
              {isCurrent && (
                <Text style={styles.label}>{stage.label}</Text>
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
