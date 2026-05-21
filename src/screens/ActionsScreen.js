import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
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
  const { analysisHistory, viewAnalysis, archiveAnalysis, deleteAnalysis } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const [showArchived, setShowArchived] = useState(false);

  const handleViewReport = (analysis) => {
    viewAnalysis(analysis);
    navigation.navigate('ImpactReport');
  };

  const handleArchiveToggle = async (analysis) => {
    try {
      await archiveAnalysis(analysis.id, !analysis.isArchived);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConfirm = (analysis) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently delete this report? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnalysis(analysis.id);
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const activeHistory = (analysisHistory || []).filter(item => item?.isArchived !== true);
  const archivedHistory = (analysisHistory || []).filter(item => item?.isArchived === true);
  const currentHistory = showArchived ? archivedHistory : activeHistory;

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

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: c.surfaceBorder }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            !showArchived && { borderBottomColor: c.accent }
          ]}
          onPress={() => setShowArchived(false)}
        >
          <Text style={[
            styles.tabText,
            { color: !showArchived ? c.textPrimary : c.textSecondary },
            !showArchived && { fontWeight: FontWeights.bold }
          ]}>
            Active ({activeHistory.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showArchived && { borderBottomColor: c.accent }
          ]}
          onPress={() => setShowArchived(true)}
        >
          <Text style={[
            styles.tabText,
            { color: showArchived ? c.textPrimary : c.textSecondary },
            showArchived && { fontWeight: FontWeights.bold }
          ]}>
            Archived ({archivedHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary stats */}
      <View style={[styles.statsRow, { marginHorizontal: 20 }]}>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.accent }]}>{currentHistory.length}</Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Total</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.success || '#22C55E' }]}>
            {currentHistory.filter(a => (a.recommendedActions || []).some(act => act.simulationStatus === 'passed')).length}
          </Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>Simulated</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.statNum, { color: c.error || '#EF4444' }]}>
            {currentHistory.filter(a => a.relevanceScore >= 75).length}
          </Text>
          <Text style={[styles.statLabel, { color: c.textSecondary }]}>High Impact</Text>
        </View>
      </View>

      {currentHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="archive" size={48} color={c.textSecondary} style={{ opacity: 0.5, marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>
            {showArchived ? 'No Archived Reports' : 'No Active Reports'}
          </Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            {showArchived
              ? 'Archived reports will be kept here for your historical records.'
              : 'All reports are archived or deleted.'}
          </Text>
        </View>
      ) : (
        <View style={[styles.list, { paddingBottom: 120 }]}>
          {currentHistory.map((analysis) => {
            const actions = analysis.recommendedActions || [];
            const passedCount = actions.filter(a => a.simulationStatus === 'passed').length;
            const failedCount = actions.filter(a => a.simulationStatus === 'failed').length;
            const pendingCount = actions.filter(a => a.simulationStatus === 'pending').length;
            const relevanceHigh = analysis.relevanceScore >= 75;
            const timeAgo = getTimeAgo(analysis.analyzedAt);

            return (
              <View
                key={analysis.id}
                style={[styles.card, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
              >
                {/* Main clickable area for details */}
                <TouchableOpacity
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

                {/* Inline Card Actions Row */}
                <View style={[styles.cardActions, { borderTopWidth: 1, borderTopColor: c.surfaceBorder }]}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleArchiveToggle(analysis)}
                    activeOpacity={0.6}
                  >
                    <Feather
                      name={analysis.isArchived ? "rotate-ccw" : "archive"}
                      size={14}
                      color={c.accent}
                    />
                    <Text style={[styles.cardActionText, { color: c.accent }]}>
                      {analysis.isArchived ? "Restore" : "Archive"}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.actionDivider, { backgroundColor: c.surfaceBorder }]} />

                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleDeleteConfirm(analysis)}
                    activeOpacity={0.6}
                  >
                    <Feather name="trash-2" size={14} color={c.error || '#EF4444'} />
                    <Text style={[styles.cardActionText, { color: c.error || '#EF4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: FontSizes.sm,
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
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  cardActionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  actionDivider: {
    width: 1,
    height: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: FontSizes.sm * 1.4,
  },
});
