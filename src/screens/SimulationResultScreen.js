import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import AgentLogList from '../components/common/AgentLogList';
import EmptyState from '../components/common/EmptyState';

export default function SimulationResultScreen() {
  const navigation = useNavigation();
  const { simulationResult, isSimulating, executionLogs } = useAnalysis();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;

  if (isSimulating) {
    return (
      <Screen scroll={true}>
        <View style={[styles.header, { backgroundColor: c.surfaceContainerLowest, borderBottomColor: c.surfaceBorder }]}>
          <View style={[styles.iconCircle, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
            <ActivityIndicator color={c.accent} size="large" />
          </View>
          <Text style={[styles.title, { color: c.textPrimary }]}>Simulation Running</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Applying the selected action to the mock system state.
          </Text>
        </View>

        <View style={[styles.stateCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, marginTop: 24 }]}>
          <Text style={[styles.keyText, { color: c.textPrimary }]}>Working on simulation</Text>
          <Text style={[styles.noChangeText, { color: c.textSecondary }]}>
            Reading current state, preparing mock update, and writing execution logs.
          </Text>
        </View>

        {preferences.agentTransparency !== 'hidden' && (
          <>
            <SectionHeader title="Live Execution Logs" />
            <View style={styles.logsWrapper}>
              <AgentLogList
                logs={executionLogs}
                limit={preferences.agentTransparency === 'full-trace' ? 10 : 3}
              />
            </View>
          </>
        )}
      </Screen>
    );
  }

  if (!simulationResult) {
    return (
      <Screen>
        <EmptyState 
          icon="skip-back"
          title="No Simulation Result"
          description="You haven't run any simulations yet."
          primaryAction={() => navigation.popToTop()}
          primaryActionTitle="Go to Dashboard"
        />
      </Screen>
    );
  }

  const { actionTitle, beforeState, afterState, logs } = simulationResult;

  // Compute changed keys
  const changedKeys = Object.keys(afterState).filter(
    key => afterState[key] !== beforeState[key]
  );

  return (
    <Screen scroll={true}>
      <View style={[styles.header, { backgroundColor: c.surfaceContainerLowest, borderBottomColor: c.surfaceBorder }]}>
        <View style={[styles.iconCircle, { backgroundColor: c.successSoft, borderColor: c.successBorder }]}>
          <Feather name="check" size={32} color={c.success} />
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]}>Simulation Complete</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>{actionTitle}</Text>
      </View>

      <SectionHeader title="System State Changes" />
      
      <View style={[styles.stateCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        {changedKeys.length === 0 ? (
          <Text style={[styles.noChangeText, { color: c.textSecondary }]}>No explicit state changes detected.</Text>
        ) : (
          changedKeys.map(key => (
            <View key={key} style={[styles.changeRow, { borderBottomColor: c.surfaceBorderSubtle }]}>
              <Text style={[styles.keyText, { color: c.textPrimary }]}>{key}</Text>
              <View style={styles.valueRow}>
                <Text style={[styles.beforeValue, { color: c.textSecondary }]}>{beforeState[key]}</Text>
                <Feather name="arrow-right" size={14} color={c.textSecondary} style={{ marginHorizontal: 8 }} />
                <Text style={[styles.afterValue, { color: c.success }]}>{afterState[key]}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <SectionHeader title="Execution Trace" />
      <View style={styles.logsWrapper}>
        <AgentLogList logs={logs} limit={10} />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: c.surfaceContainerHigh }]} 
          onPress={() => navigation.popToTop()}
        >
          <Text style={[styles.btnText, { color: c.textPrimary }]}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  stateCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
  },
  noChangeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontStyle: 'italic',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorderSubtle,
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    flex: 1,
    lineHeight: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  beforeValue: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textDecorationLine: 'line-through',
  },
  afterValue: {
    color: Colors.success,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  logsWrapper: {
    marginHorizontal: 20,
  },
  footer: {
    padding: 20,
    marginTop: 20,
  },
  btn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.textPrimary,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
});
