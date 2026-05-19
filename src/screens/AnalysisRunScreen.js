import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import StepProgress from '../components/common/StepProgress';
import AgentLogList from '../components/common/AgentLogList';

export default function AnalysisRunScreen() {
  const navigation = useNavigation();
  const { currentStage, executionLogs, analysisResult } = useAnalysis();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;

  const isCompleted = currentStage === 'completed';
  const isError = currentStage === 'error' || currentStage === 'failed';

  const handleViewReport = () => {
    navigation.navigate('ActionsTab', { screen: 'ImpactReport' });
    navigation.reset({
      index: 0,
      routes: [{ name: 'IngestionMain' }],
    });
  };

  const actionsCount = analysisResult?.recommendedActions?.length || 0;
  const threatLevel = analysisResult?.impactMatrix?.overallRisk || 'Moderate';

  const getProcessingMessage = () => {
    switch (currentStage) {
      case 'loading_profile':
        return 'Loading Business Profile...';
      case 'ingesting':
        return 'Ingesting Content Signals...';
      case 'signals':
        return 'Extracting Facts & Patterns...';
      case 'relevance':
        return 'Evaluating Business Relevance...';
      case 'insights':
        return 'Generating Operational Insight...';
      case 'impact':
        return 'Running Impact Simulation...';
      case 'actions':
        return 'Formulating Recommended Actions...';
      default:
        return 'Evaluating progress context...';
    }
  };

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      <View style={[styles.header]}>
        <Text style={[styles.title, { color: c.textPrimary }]}>
          {isCompleted ? 'Pipeline Finalized' : isError ? 'Pipeline Execution Failed' : 'Agent In Progress'}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {isCompleted 
            ? 'Agent analysis successfully mapped to actions.' 
            : isError 
              ? 'The agent encountered a critical error processing this content.'
              : 'Running real-time extraction and impact simulation...'}
        </Text>
      </View>

      <View style={[styles.progressCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <StepProgress currentStage={currentStage} />
      </View>

      {isCompleted && (
        <View style={[styles.completionCard, { 
          backgroundColor: c.successSubtle || 'rgba(34, 197, 94, 0.04)', 
          borderColor: c.success || '#22C55E',
        }]}>
          <View style={styles.completionHeader}>
            <Feather name="check-circle" size={20} color={c.success || '#22C55E'} />
            <Text style={[styles.completionTitle, { color: c.textPrimary }]}>Decision Pipeline Verified</Text>
          </View>
          <Text style={[styles.completionDesc, { color: c.textSecondary }]}>
            External signals matched to operational profile. Risks cataloged and executable recommendations loaded.
          </Text>
          <View style={[styles.metricsRow, { borderColor: c.surfaceBorder }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: c.error || '#EF4444' }]}>{threatLevel}</Text>
              <Text style={[styles.metricLbl, { color: c.textSecondary }]}>Threat Level</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: c.surfaceBorder }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: c.accent }]}>{actionsCount}</Text>
              <Text style={[styles.metricLbl, { color: c.textSecondary }]}>Decisions</Text>
            </View>
          </View>
        </View>
      )}

      {isError && (
        <View style={[styles.completionCard, { 
          backgroundColor: 'rgba(239, 68, 68, 0.04)', 
          borderColor: c.error || '#EF4444',
        }]}>
          <View style={styles.completionHeader}>
            <Feather name="alert-triangle" size={20} color={c.error || '#EF4444'} />
            <Text style={[styles.completionTitle, { color: c.textPrimary }]}>Pipeline Halted</Text>
          </View>
          <Text style={[styles.completionDesc, { color: c.textSecondary }]}>
            An unexpected error occurred during execution. Please review the trace logs below or retry.
          </Text>
          {analysisResult?.errorMessage && (
            <Text style={{ color: c.error || '#EF4444', fontSize: FontSizes.xs, fontStyle: 'italic', marginTop: 4 }}>
              Details: {analysisResult.errorMessage}
            </Text>
          )}
        </View>
      )}

      {preferences.agentTransparency !== 'hidden' && (
        <View style={[styles.logsSection]}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
            Execution Traces
          </Text>
          <AgentLogList
            logs={executionLogs}
            limit={preferences.agentTransparency === 'full-trace' ? 12 : 4}
          />
        </View>
      )}

      <View style={[styles.actionsContainer]}>
        {isCompleted ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.accent }]}
            onPress={handleViewReport}
          >
            <Feather name="file-text" size={18} color={c.white} />
            <Text style={[styles.primaryBtnText, { color: c.white }]}>View Impact Report</Text>
          </TouchableOpacity>
        ) : isError ? (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.error || '#EF4444' }]}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'IngestionMain' }],
              });
            }}
          >
            <Feather name="arrow-left" size={18} color={c.white} />
            <Text style={[styles.primaryBtnText, { color: c.white }]}>Return to Ingestion</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.processingBtn, { backgroundColor: c.surfaceVariant }]}>
            <ActivityIndicator size="small" color={c.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.processingText, { color: c.textSecondary }]}>
              {getProcessingMessage()}
            </Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
    paddingTop: 12,
  },

  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: 6,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  completionCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  completionDesc: {
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  metricLbl: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  logsSection: {
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  actionsContainer: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  primaryBtnText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
  processingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  processingText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
});
