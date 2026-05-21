import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import StatusPill from './StatusPill';
import { usePreferences } from '../../context/PreferencesContext';

export default function ImpactSummaryCard({ impact, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (!impact) return null;

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Impact Summary</Text>
        <StatusPill 
          label={`Risk: ${impact.riskLevel || 'Unknown'}`} 
          status={impact.riskLevel === 'High' ? 'danger' : impact.riskLevel === 'Medium' ? 'warning' : 'success'} 
        />
      </View>
      
      {impact.details && (
        <View style={styles.content}>
          <Text style={[styles.value, { color: c.textPrimary }]} numberOfLines={3}>{impact.details}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  content: {
    marginTop: 4,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
