import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Linking, BackHandler, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import InsightCard from '../components/common/InsightCard';
import ImpactSummaryCard from '../components/common/ImpactSummaryCard';
import StatusPill from '../components/common/StatusPill';
import { getReportTitle } from '../utils/reportTitles';

export default function ImpactReportScreen() {
  const navigation = useNavigation();
  const { analysisResult, executeSimulation, markActionSimulated, archiveAnalysis, deleteAnalysis } = useAnalysis();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;

  // Track which action is currently being simulated (by id)
  const [simulatingActionId, setSimulatingActionId] = useState(null);
  // Logs modal
  const [logsModalAction, setLogsModalAction] = useState(null);
  const [sourceModalVisible, setSourceModalVisible] = useState(false);

  const handleArchiveToggle = async () => {
    if (!analysisResult) return;
    try {
      await archiveAnalysis(analysisResult.id, !analysisResult.isArchived);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteConfirm = () => {
    if (!analysisResult) return;
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
              await deleteAnalysis(analysisResult.id);
              navigation.navigate('ActionsTab', { screen: 'ActionsMain' });
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  React.useLayoutEffect(() => {
    if (!analysisResult) return;
    const isArchived = analysisResult.isArchived;

    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ActionsTab', { screen: 'ActionsMain' });
          }}
          style={{ marginRight: 16 }}
        >
          <Feather name="arrow-left" size={24} color={c.textPrimary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity
            onPress={handleArchiveToggle}
            style={{ padding: 4 }}
          >
            <Feather 
              name={isArchived ? "inbox" : "archive"} 
              size={22} 
              color={isArchived ? (c.success || '#22C55E') : c.textPrimary} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteConfirm}
            style={{ padding: 4 }}
          >
            <Feather name="trash-2" size={22} color={c.error || '#EF4444'} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, c, analysisResult]);

  React.useEffect(() => {
    const backAction = () => {
      navigation.navigate('ActionsTab', { screen: 'ActionsMain' });
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  if (!analysisResult) {
    return (
      <Screen>
        <EmptyState
          icon="bar-chart-2"
          title="No Report Available"
          description="Analyze new content to generate an insight and impact report."
          primaryAction={() => navigation.navigate('Home', { screen: 'IngestionTab' })}
          primaryActionTitle="Analyze New Content"
        />
      </Screen>
    );
  }

  const signals = analysisResult.signals || [];
  const insights = analysisResult.insights || [];
  const actions = analysisResult.recommendedActions || [];
  const relevanceStatus = analysisResult.isRelevant ? 'Relevant' : 'Low relevance';
  const reportTitle = getReportTitle(analysisResult);
  const sourceDetail = {
    ...(analysisResult.sourceItem || {}),
    title: analysisResult.sourceTitle || analysisResult.sourceItem?.title || reportTitle,
    sourceName: analysisResult.sourceName || analysisResult.sourceItem?.sourceName || 'Analyzed Content',
    body: analysisResult.sourceBody || analysisResult.sourceItem?.body || analysisResult.sourceContent || '',
    timestamp: analysisResult.sourceTimestamp || analysisResult.sourceItem?.timestamp || analysisResult.analyzedAt,
    url: analysisResult.sourceUrl || analysisResult.sourceItem?.url || analysisResult.sourceItem?.sourceUrl || '',
    detectedTopics: analysisResult.sourceTopics || analysisResult.sourceItem?.detectedTopics || [],
  };
  const hasSourceDetail = !!(sourceDetail.title || sourceDetail.body || sourceDetail.url);

  const openSourceUrl = async () => {
    if (!sourceDetail.url) return;
    try {
      await Linking.openURL(sourceDetail.url);
    } catch (error) {
      console.warn('Unable to open source URL:', error);
    }
  };

  const handleSimulateAction = async (action) => {
    if (action.simulationStatus === 'passed' || action.simulationStatus === 'running') return;
    setSimulatingActionId(action.id);
    await executeSimulation(action, analysisResult.id);
    setSimulatingActionId(null);
  };

  const renderActionSimButton = (action) => {
    const status = action.simulationStatus || 'pending';
    const isRunning = simulatingActionId === action.id;
    const isManual = action.simulationSupported === false || action.actionType === 'manual_review';

    if (isRunning || status === 'running') {
      return (
        <View style={[styles.simBtn, { backgroundColor: c.surfaceVariant }]}>
          <ActivityIndicator size="small" color={c.textSecondary} />
          <Text style={[styles.simBtnText, { color: c.textSecondary }]}>Simulating...</Text>
        </View>
      );
    }

    if (status === 'passed') {
      return (
        <View style={[styles.simBtn, { backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}>
          <Feather name="check-circle" size={14} color={c.success || '#22C55E'} />
          <Text style={[styles.simBtnText, { color: c.success || '#22C55E' }]}>Passed</Text>
        </View>
      );
    }

    if (status === 'failed') {
      return (
        <View style={styles.failedRow}>
          <View style={[styles.simBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', flex: 1 }]}>
            <Feather name="x-circle" size={14} color={c.error || '#EF4444'} />
            <Text style={[styles.simBtnText, { color: c.error || '#EF4444' }]}>Failed</Text>
          </View>
          <TouchableOpacity
            style={[styles.logsBtn, { borderColor: c.surfaceBorder }]}
            onPress={() => setLogsModalAction(action)}
          >
            <Feather name="terminal" size={13} color={c.textSecondary} />
            <Text style={[styles.logsBtnText, { color: c.textSecondary }]}>Logs</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // pending
    if (isManual) {
      return (
        <View style={styles.failedRow}>
          <View style={[styles.simBtn, { backgroundColor: c.surfaceVariant, flex: 1 }]}>
            <Feather name="tool" size={14} color={c.textSecondary} />
            <Text style={[styles.simBtnText, { color: c.textSecondary }]}>Manual Action</Text>
          </View>
          <TouchableOpacity
            style={[styles.logsBtn, { borderColor: c.surfaceBorder, backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}
            onPress={() => {
              markActionSimulated(analysisResult.id, action.id, 'passed', [
                { id: Date.now().toString(), timestamp: new Date().toISOString(), message: 'Action marked as manually completed.', level: 'success' }
              ]);
            }}
          >
            <Feather name="check" size={13} color={c.success || '#22C55E'} />
            <Text style={[styles.logsBtnText, { color: c.success || '#22C55E' }]}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.simBtn, { backgroundColor: c.accent }]}
        onPress={() => handleSimulateAction(action)}
      >
        <Feather name="play" size={14} color={c.white} />
        <Text style={[styles.simBtnText, { color: c.white }]}>Simulate</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Screen scroll={true}>
      {/* Report Header */}
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.accent }]}>Impact Report</Text>
        <Text style={[styles.title, { color: c.textPrimary }]}>{reportTitle}</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Generated against the saved profile automatically.
        </Text>
      </View>

      {analysisResult.isArchived && (
        <View style={[styles.archiveBanner, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#F59E0B' }]}>
          <Feather name="alert-triangle" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
          <Text style={[styles.archiveBannerText, { color: c.textPrimary }]}>
            Report is archived.
          </Text>
          <TouchableOpacity 
            style={[styles.restoreBtn, { backgroundColor: c.accent }]}
            onPress={handleArchiveToggle}
          >
            <Text style={[styles.restoreBtnText, { color: c.white }]}>Restore</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasSourceDetail && (
        <TouchableOpacity
          style={[styles.sourceButton, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
          onPress={() => setSourceModalVisible(true)}
        >
          <View style={[styles.sourceButtonIcon, { backgroundColor: c.accentSoft }]}>
            <Feather name="link-2" size={16} color={c.accent} />
          </View>
          <View style={styles.sourceButtonText}>
            <Text style={[styles.sourceButtonLabel, { color: c.textSecondary }]}>{sourceDetail.sourceName}</Text>
            <Text style={[styles.sourceButtonTitle, { color: c.textPrimary }]} numberOfLines={1}>
              {sourceDetail.title}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={c.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Relevance Score */}
      <View style={[styles.summaryCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreLabel, { color: c.textSecondary }]}>Relevance</Text>
          <Text style={[styles.scoreValue, { color: c.textPrimary }]}>{analysisResult.relevanceScore}%</Text>
        </View>
        <StatusPill label={relevanceStatus} status={analysisResult.isRelevant ? 'success' : 'warning'} />
      </View>

      {/* Extracted Signals */}
      <SectionHeader title="Extracted Signals" />
      <View style={styles.sectionBody}>
        {signals.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.textSecondary, backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>No signals extracted.</Text>
        ) : (
          signals.map(signal => (
            <View key={signal.id} style={[styles.signalRow, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              <View style={[styles.signalIcon, { backgroundColor: c.accentSoft }]}>
                <Feather name="activity" size={16} color={c.accent} />
              </View>
              <View style={styles.signalText}>
                <Text style={[styles.signalTitle, { color: c.textPrimary }]}>{signal.label}</Text>
                <Text style={[styles.signalEvidence, { color: c.textSecondary }]}>{signal.evidence}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Insights */}
      <SectionHeader title="Insights" />
      <View style={styles.sectionBody}>
        {insights.map(insight => (
          <View key={insight.id} style={styles.cardSpacing}>
            <InsightCard insight={insight} />
            {preferences.insightStyle !== 'simple' && (
              <View style={[styles.insightMetaCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
                <Text style={[styles.explanationLabel, { color: c.textSecondary }]}>Insight Details</Text>
                <Text style={[styles.explanationText, { color: c.textPrimary }]}>
                  Affected area: {insight.affectedArea || 'General operations'}
                </Text>
                <Text style={[styles.explanationText, { color: c.textPrimary }]}>
                  Priority: {insight.priority || 'normal'}
                </Text>
                {preferences.insightStyle === 'technical' && (
                  <Text style={[styles.explanationText, { color: c.textSecondary }]}>
                    Evidence: {insight.evidence || 'Dynamic term extraction and profile alignment.'}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Impact Analysis */}
      <SectionHeader title="Impact Analysis" />
      <View style={styles.sectionBody}>
        <ImpactSummaryCard impact={analysisResult.impact} />
        {analysisResult.impact?.explanation && (
          <View style={[styles.explanationCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Text style={[styles.explanationLabel, { color: c.textSecondary }]}>Reasoning</Text>
            <Text style={[styles.explanationText, { color: c.textPrimary }]}>{analysisResult.impact.explanation}</Text>
          </View>
        )}
      </View>

      {/* Recommended Actions with inline simulate */}
      <SectionHeader title="Recommended Actions" />
      <View style={[styles.sectionBody, { paddingBottom: 10 }]}>
        {actions.length === 0 ? (
          <View style={[styles.noActionsCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <Feather name="check-circle" size={20} color={c.success || '#22C55E'} />
            <Text style={[styles.noActionsText, { color: c.textSecondary }]}>
              No follow-up actions needed. The analyzed content poses no actionable risk.
            </Text>
          </View>
        ) : (
          actions.map(action => (
            <View key={action.id} style={[styles.actionCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              {/* Action Header */}
              <View style={styles.actionHeader}>
                <View style={styles.actionHeaderLeft}>
                  <Text style={[styles.actionTitle, { color: c.textPrimary }]}>{action.title}</Text>
                  <StatusPill
                    label={action.urgency || 'Normal'}
                    status={action.urgency === 'High' ? 'danger' : 'default'}
                  />
                </View>
              </View>

              {/* Rationale */}
              {action.rationale && (
                <Text style={[styles.actionRationale, { color: c.textSecondary }]}>{action.rationale}</Text>
              )}

              {/* Meta */}
              <View style={[styles.actionMeta, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorderSubtle }]}>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Target</Text>
                  <Text style={[styles.metaValue, { color: c.textPrimary }]}>{action.targetSystem || 'Internal Policy'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Type</Text>
                  <Text style={[styles.metaValue, { color: c.textPrimary }]}>{action.actionType || 'Manual Override'}</Text>
                </View>
                {action.confidence && (
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Confidence</Text>
                    <Text style={[styles.metaValue, { color: c.accent }]}>{action.confidence}</Text>
                  </View>
                )}
              </View>

              {/* Simulate / Status */}
              <View style={[styles.actionFooter, { borderTopColor: c.surfaceBorder }]}>
                {renderActionSimButton(action)}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Report Management Actions */}
      <SectionHeader title="Report Management" />
      <View style={[styles.sectionBody, { paddingBottom: 140 }]}>
        <View style={[styles.managementCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.managementTitle, { color: c.textPrimary }]}>
            Control Center
          </Text>
          <Text style={[styles.managementSubtitle, { color: c.textSecondary }]}>
            Archive to save historically, or permanently remove this analysis.
          </Text>
          <View style={styles.managementButtons}>
            <TouchableOpacity
              style={[
                styles.managementBtn,
                { 
                  backgroundColor: analysisResult.isArchived ? 'rgba(34, 197, 94, 0.08)' : c.surfaceVariant,
                  borderColor: analysisResult.isArchived ? (c.success || '#22C55E') : c.surfaceBorder,
                  borderWidth: 1
                }
              ]}
              onPress={handleArchiveToggle}
            >
              <Feather 
                name={analysisResult.isArchived ? "inbox" : "archive"} 
                size={16} 
                color={analysisResult.isArchived ? (c.success || '#22C55E') : c.textPrimary} 
              />
              <Text style={[
                styles.managementBtnText, 
                { color: analysisResult.isArchived ? (c.success || '#22C55E') : c.textPrimary }
              ]}>
                {analysisResult.isArchived ? "Restore Active" : "Archive Report"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.managementBtn,
                { 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderColor: c.error || '#EF4444',
                  borderWidth: 1
                }
              ]}
              onPress={handleDeleteConfirm}
            >
              <Feather name="trash-2" size={16} color={c.error || '#EF4444'} />
              <Text style={[styles.managementBtnText, { color: c.error || '#EF4444' }]}>
                Delete Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Source Detail Modal */}
      <Modal visible={sourceModalVisible} animationType="slide" transparent onRequestClose={() => setSourceModalVisible(false)}>
        <View style={styles.logsModalOverlay}>
          <View style={[styles.logsModalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.logsModalHead, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.logsModalTitle, { color: c.textPrimary }]}>Source Article</Text>
              <TouchableOpacity onPress={() => setSourceModalVisible(false)}>
                <Feather name="x" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 14, maxHeight: 430 }}>
              <View style={styles.sourceMetaRow}>
                <Feather name="globe" size={14} color={c.textSecondary} />
                <Text style={[styles.sourceMetaText, { color: c.textSecondary }]}>{sourceDetail.sourceName}</Text>
                {!!sourceDetail.timestamp && (
                  <Text style={[styles.sourceMetaTime, { color: c.textSecondary }]}>{sourceDetail.timestamp}</Text>
                )}
              </View>
              <Text style={[styles.sourceModalTitle, { color: c.textPrimary }]}>{sourceDetail.title}</Text>
              {!!sourceDetail.url && (
                <TouchableOpacity
                  style={[styles.sourceLinkRow, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}
                  onPress={openSourceUrl}
                >
                  <Feather name="external-link" size={14} color={c.accent} />
                  <Text style={[styles.sourceLinkText, { color: c.accent }]} numberOfLines={1}>{sourceDetail.url}</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.sourceBodyText, { color: c.textPrimary }]}>
                {sourceDetail.body || 'No source text saved for this report.'}
              </Text>
              {!!sourceDetail.detectedTopics?.length && (
                <View style={styles.sourceTopicRow}>
                  {sourceDetail.detectedTopics.map((topic, index) => (
                    <View key={`${topic}_${index}`} style={[styles.sourceTopicChip, { backgroundColor: c.surfaceVariant }]}>
                      <Text style={[styles.sourceTopicText, { color: c.textSecondary }]}>{topic}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.logsModalClose, { backgroundColor: c.surfaceVariant }]}
              onPress={() => setSourceModalVisible(false)}
            >
              <Text style={[styles.logsModalCloseText, { color: c.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logs Modal */}
      <Modal visible={!!logsModalAction} animationType="slide" transparent onRequestClose={() => setLogsModalAction(null)}>
        <View style={styles.logsModalOverlay}>
          <View style={[styles.logsModalBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
            <View style={[styles.logsModalHead, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.logsModalTitle, { color: c.textPrimary }]}>Simulation Logs</Text>
              <TouchableOpacity onPress={() => setLogsModalAction(null)}>
                <Feather name="x" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 14, maxHeight: 400 }}>
              <Text style={[styles.logsModalActionTitle, { color: c.accent }]}>
                {logsModalAction?.title}
              </Text>
              {(logsModalAction?.simulationLogs || []).map((log, i) => (
                <View key={i} style={[styles.logLine, { borderLeftColor: c.error || '#EF4444' }]}>
                  <Text style={[styles.logLineText, { color: c.textPrimary }]}>{log}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.logsModalClose, { backgroundColor: c.surfaceVariant }]}
              onPress={() => setLogsModalAction(null)}
            >
              <Text style={[styles.logsModalCloseText, { color: c.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 6,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  scoreBlock: { flex: 1 },
  sourceButton: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceButtonText: {
    flex: 1,
  },
  sourceButtonLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sourceButtonTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    lineHeight: 19,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  sectionBody: {
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: { flex: 1 },
  signalTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    lineHeight: 20,
  },
  signalEvidence: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  cardSpacing: { marginBottom: 12 },
  insightMetaCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  explanationCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  explanationLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  // No actions
  noActionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  noActionsText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  // Action cards
  actionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  actionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  actionHeaderLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 22,
    flex: 1,
  },
  actionRationale: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionMeta: {
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: { fontSize: FontSizes.xs },
  metaValue: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold },
  actionFooter: {
    borderTopWidth: 1,
    padding: 12,
    paddingHorizontal: 16,
  },

  // Simulation button states
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
  },
  simBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  failedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  logsBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  sourceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sourceMetaText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  sourceMetaTime: {
    fontSize: FontSizes.xs,
  },
  sourceModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    lineHeight: 25,
    marginBottom: 12,
  },
  sourceLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  sourceLinkText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  sourceBodyText: {
    fontSize: FontSizes.md,
    lineHeight: 24,
    marginBottom: 14,
  },
  sourceTopicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  sourceTopicChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sourceTopicText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },

  // Logs Modal
  logsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  logsModalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  logsModalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  logsModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  logsModalActionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginBottom: 14,
  },
  logLine: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  logLineText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  logsModalClose: {
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logsModalCloseText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  archiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  archiveBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  restoreBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  managementCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  managementTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  managementSubtitle: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
    marginBottom: 16,
  },
  managementButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  managementBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  managementBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
});
