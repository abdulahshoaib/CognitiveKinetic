import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontSizes, FontWeights } from '../../constants/typography';
import StatusPill from './StatusPill';
import { usePreferences } from '../../context/PreferencesContext';

export default function ActionCard({ action, onSimulate, style }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (!action) return null;

  const canSimulate = action.simulationSupported !== false;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: c.surfaceContainerLow, 
        borderColor: c.surfaceBorder, 
      }, 
      style
    ]}>
      {/* Top Header with title and urgency badge */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>{action.title}</Text>
        <View style={styles.badges}>
          <StatusPill 
            label={action.urgency || 'Normal'} 
            status={action.urgency === 'High' ? 'danger' : 'default'} 
          />
        </View>
      </View>
      
      {/* Rationale / Explanation paragraph */}
      {action.description && (
        <Text style={[
          styles.rationale, 
          { 
            color: c.textSecondary, 
          }
        ]}>
          {action.description}
        </Text>
      )}

      {/* Structured system meta data tags */}
      <View style={[styles.metaBlock, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Target System</Text>
          <Text style={[styles.metaValue, { color: c.textPrimary }]}>{action.targetSystem || 'Internal Policy'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Action Type</Text>
          <Text style={[styles.metaValue, { color: c.textPrimary }]}>{action.actionType || 'Manual Override'}</Text>
        </View>
      </View>
      
      {/* Footer with confidence meter and call-to-action */}
      <View style={[styles.footer, { borderTopColor: c.surfaceBorderSubtle }]}>
        <View>
          <Text style={[styles.confidenceLabel, { color: c.textSecondary }]}>AGENT CONFIDENCE</Text>
          <Text style={[styles.confidenceValue, { color: c.accent }]}>
            {action.confidence ? `${action.confidence}` : '92% Alignment'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { 
              backgroundColor: canSimulate ? c.accent : c.surfaceVariant,
            }
          ]} 
          onPress={() => canSimulate && onSimulate && onSimulate(action)}
          disabled={!canSimulate}
        >
          <Feather name={canSimulate ? "play" : "tool"} size={14} color={c.white} />
          <Text style={[styles.buttonText, { color: c.white }]}>
            {canSimulate ? "Simulate" : "Manual"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 22,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  rationale: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 14,
  },
  metaBlock: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: FontSizes.xs,
  },
  metaValue: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  confidenceLabel: {
    fontSize: FontSizes.xs - 2,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.8,
  },
  confidenceValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
    flexShrink: 0,
  },
  buttonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});
