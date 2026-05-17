import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import AgentLogList from '../components/common/AgentLogList';
import EmptyState from '../components/common/EmptyState';

export default function SimulationResultScreen() {
  const navigation = useNavigation();
  const { simulationResult } = useAnalysis();

  if (!simulationResult) {
    return (
      <Screen>
        <EmptyState 
          icon="play-skip-back-outline"
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
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={32} color={Colors.success} />
        </View>
        <Text style={styles.title}>Simulation Complete</Text>
        <Text style={styles.subtitle}>{actionTitle}</Text>
      </View>

      <SectionHeader title="System State Changes" />
      
      <View style={styles.stateCard}>
        {changedKeys.length === 0 ? (
          <Text style={styles.noChangeText}>No explicit state changes detected.</Text>
        ) : (
          changedKeys.map(key => (
            <View key={key} style={styles.changeRow}>
              <Text style={styles.keyText}>{key}</Text>
              <View style={styles.valueRow}>
                <Text style={styles.beforeValue}>{beforeState[key]}</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.textSecondary} style={{ marginHorizontal: 8 }} />
                <Text style={styles.afterValue}>{afterState[key]}</Text>
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
          style={styles.btn} 
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.btnText}>Return to Dashboard</Text>
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
