import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import StatusPill from './StatusPill';
import { usePreferences } from '../../context/PreferencesContext';

export default function ActionCard({ action, onSimulate, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (!action) return null;

  const canSimulate = action.simulationSupported !== false;

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }, style]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>{action.title}</Text>
        <View style={styles.badges}>
          <StatusPill 
            label={action.urgency || 'Normal'} 
            status={action.urgency === 'High' ? 'danger' : 'default'} 
          />
        </View>
      </View>
      
      {action.rationale && (
        <Text style={[styles.rationale, { color: c.textSecondary }]}>{action.rationale}</Text>
      )}
      
      <View style={[styles.footer, { borderTopColor: c.surfaceBorderSubtle }]}>
        <Text style={[styles.confidence, { color: c.textSecondary }]}>Confidence: {action.confidence || 'N/A'}</Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: canSimulate ? c.accent : c.surfaceVariant }]} 
          onPress={() => canSimulate && onSimulate && onSimulate(action)}
          disabled={!canSimulate}
        >
          <Ionicons name={canSimulate ? "play" : "build"} size={16} color={c.white} />
          <Text style={[styles.buttonText, { color: c.white }]}>{canSimulate ? "Simulate" : "Manual Review"}</Text>
        </TouchableOpacity>
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
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    flex: 1,
    lineHeight: 22,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  rationale: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderSubtle,
    paddingTop: 12,
  },
  confidence: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    flexShrink: 0,
  },
  buttonDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
  },
});
