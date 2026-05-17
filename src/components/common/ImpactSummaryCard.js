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
      
      <View style={styles.grid}>
        <View style={styles.cell}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Short-term</Text>
          <Text style={[styles.value, { color: c.textPrimary }]}>{impact.shortTerm || 'No data'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: c.surfaceBorder }]} />
        <View style={styles.cell}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Medium-term</Text>
          <Text style={[styles.value, { color: c.textPrimary }]}>{impact.mediumTerm || 'No data'}</Text>
        </View>
      </View>
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
  grid: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
