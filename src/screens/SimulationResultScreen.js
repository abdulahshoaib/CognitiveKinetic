import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import AgentLogList from '../components/common/AgentLogList';
import EmptyState from '../components/common/EmptyState';

const getDensityStyle = (density) => {
  switch (density) {
    case 'compact':
      return {
        padding: 12,
        gap: 8,
        fontSizeTitle: FontSizes.lg,
        fontSizeBody: FontSizes.xs,
        cardPadding: 12,
        cardMarginBottom: 10,
        headerPaddingTop: 16,
      };
    case 'spacious':
      return {
        padding: 24,
        gap: 20,
        fontSizeTitle: FontSizes.xxl,
        fontSizeBody: FontSizes.md,
        cardPadding: 20,
        cardMarginBottom: 24,
        headerPaddingTop: 36,
      };
    case 'cozy':
    default:
      return {
        padding: 18,
        gap: 14,
        fontSizeTitle: FontSizes.xl,
        fontSizeBody: FontSizes.sm,
        cardPadding: 16,
        cardMarginBottom: 16,
        headerPaddingTop: 28,
      };
  }
};

const getChangeDelta = (before, after) => {
  const bNum = parseFloat(before.toString().replace(/[^0-9.-]/g, ''));
  const aNum = parseFloat(after.toString().replace(/[^0-9.-]/g, ''));
  if (!isNaN(bNum) && !isNaN(aNum) && bNum !== 0) {
    const pct = ((aNum - bNum) / bNum) * 100;
    const pctStr = pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
    return {
      text: pctStr,
      isPositive: pct > 0,
      isNegative: pct < 0,
    };
  }
  return null;
};

export default function SimulationResultScreen() {
  const navigation = useNavigation();
  const { simulationResult, isSimulating, executionLogs, executeSimulation, analysisResult } = useAnalysis();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;

  const density = preferences.density || 'cozy';
  const ds = getDensityStyle(density);

  const handleRetrySimulation = async () => {
    if (!simulationResult || !analysisResult) return;
    // Find matching action in current analysis
    const actions = analysisResult.recommendedActions || [];
    const matchingAction = actions.find(a =>
      a.title === simulationResult.actionTitle || a.id === simulationResult.actionId
    );
    if (matchingAction) {
      await executeSimulation(matchingAction, analysisResult.id);
    }
  };

  if (isSimulating) {
    return (
      <Screen scroll={true} style={{ backgroundColor: c.background }}>
        <View style={[styles.header, { backgroundColor: c.surfaceContainerLowest, borderBottomColor: c.surfaceBorder, paddingTop: ds.headerPaddingTop }]}>
          <View style={[styles.iconCircle, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
            <ActivityIndicator color={c.accent} size="large" />
          </View>
          <Text style={[styles.title, { color: c.textPrimary, fontSize: ds.fontSizeTitle }]}>Simulation Running</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>
            Applying the selected action to the mock system state.
          </Text>
        </View>

        <View style={[styles.stateCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, marginHorizontal: ds.padding, padding: ds.cardPadding, marginTop: ds.gap }]}>
          <Text style={[styles.keyText, { color: c.textPrimary, fontWeight: 'bold' }]}>Writing execution trace...</Text>
          <Text style={[styles.noChangeText, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>
            Evaluating impact vector, modifying system parameters, and preparing state transaction logs.
          </Text>
        </View>

        {preferences.agentTransparency !== 'hidden' && (
          <View style={{ marginTop: ds.gap }}>
            <SectionHeader title="Live Execution Logs" style={{ paddingHorizontal: ds.padding }} />
            <View style={[styles.logsWrapper, { marginHorizontal: ds.padding }]}>
              <AgentLogList
                logs={executionLogs}
                limit={preferences.agentTransparency === 'full-trace' ? 12 : 4}
              />
            </View>
          </View>
        )}
      </Screen>
    );
  }

  if (!simulationResult) {
    return (
      <Screen style={{ backgroundColor: c.background }}>
        <EmptyState 
          icon="skip-back"
          title="No Simulation Active"
          description="You haven't run any simulations yet."
          primaryAction={() => navigation.navigate('ActionsTab')}
          primaryActionTitle="Go to Action Queue"
        />
      </Screen>
    );
  }

  const {
    actionTitle,
    beforeState,
    afterState,
    logs,
    apiName,
    endpoint,
    method,
    passed,
    requestPayload,
    responseStatus,
  } = simulationResult;
  const changedKeys = Object.keys(afterState).filter(
    key => afterState[key] !== beforeState[key]
  );

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.surfaceContainerLowest, borderBottomColor: c.surfaceBorder, paddingTop: ds.headerPaddingTop }]}>
        <View style={[styles.iconCircle, {
          backgroundColor: passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderColor: passed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
        }]}>
          <Feather
            name={passed ? 'check-circle' : 'alert-triangle'}
            size={30}
            color={passed ? c.success || '#22C55E' : c.error || '#EF4444'}
          />
        </View>
        <Text style={[styles.title, { color: c.textPrimary, fontSize: ds.fontSizeTitle }]}>
          {passed ? 'Simulation Complete' : 'Simulation Failed'}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>{actionTitle}</Text>
      </View>

      <SectionHeader title="API Call" style={{ paddingHorizontal: ds.padding, marginTop: ds.gap }} />
      <View style={[styles.stateCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, marginHorizontal: ds.padding, padding: ds.cardPadding }]}>
        <View style={styles.apiRow}>
          <Text style={[styles.apiLabel, { color: c.textSecondary }]}>Selected API</Text>
          <Text style={[styles.apiValue, { color: c.textPrimary }]}>{apiName || 'None'}</Text>
        </View>
        <View style={styles.apiRow}>
          <Text style={[styles.apiLabel, { color: c.textSecondary }]}>Endpoint</Text>
          <Text style={[styles.apiValue, { color: c.textPrimary }]}>{endpoint || 'No endpoint configured'}</Text>
        </View>
        <View style={styles.apiRow}>
          <Text style={[styles.apiLabel, { color: c.textSecondary }]}>Request</Text>
          <Text style={[styles.apiValue, { color: c.textPrimary }]}>
            {method || 'POST'} / HTTP {responseStatus || 0}
          </Text>
        </View>
        {!!requestPayload && (
          <Text style={[styles.payloadText, { color: c.textSecondary, borderColor: c.surfaceBorder }]}>
            {JSON.stringify(requestPayload, null, 2)}
          </Text>
        )}
      </View>

      <SectionHeader title="System State Changes" style={{ paddingHorizontal: ds.padding, marginTop: ds.gap }} />
      
      <View style={[styles.stateCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, marginHorizontal: ds.padding, padding: ds.cardPadding }]}>
        {changedKeys.length === 0 ? (
          <Text style={[styles.noChangeText, { color: c.textSecondary }]}>No explicit state changes detected.</Text>
        ) : (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={[styles.tableHeaderRow, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.tableHeaderCell, { color: c.textSecondary, flex: 2 }]}>Metric</Text>
              <Text style={[styles.tableHeaderCell, { color: c.textSecondary, flex: 1.2, textAlign: 'right' }]}>Before</Text>
              <Text style={[styles.tableHeaderCell, { color: c.textSecondary, flex: 1.2, textAlign: 'right' }]}>After</Text>
              <Text style={[styles.tableHeaderCell, { color: c.textSecondary, flex: 1.2, textAlign: 'right' }]}>Delta</Text>
            </View>

            {/* Table Rows */}
            {changedKeys.map(key => {
              const delta = getChangeDelta(beforeState[key], afterState[key]);
              return (
                <View key={key} style={[styles.changeRow, { borderBottomColor: c.surfaceBorderSubtle }]}>
                  <Text style={[styles.keyText, { color: c.textPrimary, flex: 2 }]} numberOfLines={1}>
                    {key}
                  </Text>
                  <Text style={[styles.beforeValue, { color: c.textSecondary, flex: 1.2, textAlign: 'right' }]}>
                    {beforeState[key]}
                  </Text>
                  <Text style={[styles.afterValue, { color: c.success || '#22C55E', flex: 1.2, textAlign: 'right' }]}>
                    {afterState[key]}
                  </Text>
                  <View style={[styles.deltaCol, { flex: 1.2 }]}>
                    {delta ? (
                      <View style={[styles.deltaBadge, { 
                        backgroundColor: delta.isPositive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                      }]}>
                        <Text style={[styles.deltaText, { 
                          color: delta.isPositive ? c.success || '#22C55E' : c.error || '#EF4444' 
                        }]}>
                          {delta.text}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.deltaLabel, { color: c.textSecondary }]}>Mod</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <SectionHeader title="Simulation Trace" style={{ paddingHorizontal: ds.padding, marginTop: ds.gap }} />
      <View style={[styles.logsWrapper, { marginHorizontal: ds.padding }]}>
        <AgentLogList logs={logs} limit={10} />
      </View>

      <View style={[styles.footer, { paddingHorizontal: ds.padding, marginTop: ds.gap, paddingBottom: 120 }]}>
        {!passed && (
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: c.error || '#EF4444', marginBottom: 12 }]} 
            onPress={handleRetrySimulation}
          >
            <Feather name="refresh-cw" size={16} color={c.white} />
            <Text style={[styles.btnText, { color: c.white }]}>Retry Simulation</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: c.accent }]} 
          onPress={() => {
            try {
              navigation.popToTop();
            } catch (e) {}
            navigation.navigate('Home', { screen: 'Dashboard' });
          }}
        >
          <Text style={[styles.btnText, { color: c.white }]}>{passed ? 'Commit and Return to Dashboard' : 'Return to Dashboard'}</Text>
          <Feather name={passed ? "check" : "arrow-right"} size={16} color={c.white} />
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  title: {
    fontWeight: FontWeights.bold,
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  stateCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  noChangeText: {
    fontStyle: 'italic',
  },
  tableContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: FontSizes.xs - 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  keyText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  beforeValue: {
    fontSize: FontSizes.sm,
    textDecorationLine: 'line-through',
  },
  afterValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  deltaCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deltaText: {
    fontSize: FontSizes.xs - 2,
    fontWeight: FontWeights.bold,
  },
  deltaLabel: {
    fontSize: FontSizes.xs - 1,
  },
  logsWrapper: {
    flex: 1,
  },
  apiRow: {
    gap: 4,
    marginBottom: 10,
  },
  apiLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  apiValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  payloadText: {
    borderTopWidth: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: FontSizes.xs,
    lineHeight: 16,
    marginTop: 4,
    paddingTop: 10,
  },
  footer: {
    marginTop: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
});
