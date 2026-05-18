import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import EmptyState from '../components/common/EmptyState';
import { getReportTitle } from '../utils/reportTitles';

export default function ActionsScreen() {
  const navigation = useNavigation();
  const { analysisHistory, viewAnalysis } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  const handleViewReport = (analysis) => {
    viewAnalysis(analysis);
    navigation.navigate('ImpactReport');
  };

  if (analysisHistory.length === 0) {
    return (
      <Screen style={{ backgroundColor: c.background }}>
        <EmptyState
          icon="activity"
          title="No Analyses Yet"
          description="Analyze news or content from the New Content tab to see results here."
          primaryAction={() => navigation.navigate('IngestionTab')}
          primaryActionTitle="Go to New Content"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Analysis Reports</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Tap any analysis to view the full impact report, findings, and suggested actions.
        </Text>
      </View>

      {/* Summary stats */}
      <View style={[styles.statsRow, { marginHorizontal: 20 }]}>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.accent }]}>{analysisHistory.length}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.success || '#22C55E' }]}>
            {analysisHistory.filter(a => (a.recommendedActions || []).some(act => act.simulationStatus === 'passed')).length}
          </Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Simulated</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.error || '#EF4444' }]}>
            {analysisHistory.filter(a => a.relevanceScore >= 75).length}
          </Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>High Impact</Text>
        </View>
      </View>

      <View style={[styles.list, { paddingBottom: 120 }]}>
        {analysisHistory.map((analysis) => {
          const actions = analysis.recommendedActions || [];
          const passedCount = actions.filter(a => a.simulationStatus === 'passed').length;
          const failedCount = actions.filter(a => a.simulationStatus === 'failed').length;
          const pendingCount = actions.filter(a => a.simulationStatus === 'pending').length;
          const relevanceHigh = analysis.relevanceScore >= 75;
          const timeAgo = getTimeAgo(analysis.analyzedAt);

          return (
            <TouchableOpacity
              key={analysis.id}
              style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
              onPress={() => handleViewReport(analysis)}
              activeOpacity={0.7}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.relevanceIcon, {
                  backgroundColor: relevanceHigh ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)'
                }]}>
                  <Feather
                    name={relevanceHigh ? 'alert-triangle' : 'check-circle'}
                    size={18}
                    color={relevanceHigh ? c.error || '#EF4444' : c.success || '#22C55E'}
                  />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={2}>
                    {getReportTitle(analysis)}
                  </Text>
                  <Text style={[styles.cardTime, { color: c.textSecondary }]}>{timeAgo}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={c.textSecondary} />
              </View>

              {/* Metrics Row */}
              <View style={[styles.cardMetrics, { borderTopColor: c.surfaceBorder }]}>
                <View style={styles.metric}>
                  <Text style={[styles.metricVal, { color: c.textPrimary }]}>{analysis.relevanceScore}%</Text>
                  <Text style={[styles.metricLbl, { color: c.textSecondary }]}>Relevance</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: c.surfaceBorder }]} />
                <View style={styles.metric}>
                  <Text style={[styles.metricVal, { color: c.textPrimary }]}>{actions.length}</Text>
                  <Text style={[styles.metricLbl, { color: c.textSecondary }]}>Actions</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: c.surfaceBorder }]} />
                <View style={styles.metric}>
                  <View style={styles.simStatusRow}>
                    {passedCount > 0 && (
                      <View style={styles.simDot}>
                        <Feather name="check" size={10} color={c.success || '#22C55E'} />
                        <Text style={[styles.simDotText, { color: c.success || '#22C55E' }]}>{passedCount}</Text>
                      </View>
                    )}
                    {failedCount > 0 && (
                      <View style={styles.simDot}>
                        <Feather name="x" size={10} color={c.error || '#EF4444'} />
                        <Text style={[styles.simDotText, { color: c.error || '#EF4444' }]}>{failedCount}</Text>
                      </View>
                    )}
                    {pendingCount > 0 && (
                      <View style={styles.simDot}>
                        <Feather name="clock" size={10} color={c.textSecondary} />
                        <Text style={[styles.simDotText, { color: c.textSecondary }]}>{pendingCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.metricLbl, { color: c.textSecondary }]}>Simulations</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

function getTimeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    marginTop: 4,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * 1.4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  statNum: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.medium,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  relevanceIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    lineHeight: 20,
  },
  cardTime: {
    fontSize: FontSizes.xs - 1,
    marginTop: 2,
  },
  cardMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  metricLbl: {
    fontSize: FontSizes.xs - 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  simStatusRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  simDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  simDotText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
});
