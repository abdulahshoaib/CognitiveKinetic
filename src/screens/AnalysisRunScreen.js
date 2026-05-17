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

  const handleFinishReport = () => {
    navigation.navigate('ImpactReport');
  };

  const handleSimulateActions = () => {
    navigation.popToTop();
    navigation.navigate('ActionsTab', { screen: 'ActionsMain' });
  };

  const actionsCount = analysisResult?.actions?.length || 3;
  const threatLevel = analysisResult?.impactMatrix?.overallRisk || 'Moderate';

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      <View style={[styles.header]}>
        <View style={[styles.headerIconContainer, { backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.1)' : c.primarySubtle }]}>
          <Feather 
            name={isCompleted ? "shield-check" : "compass"} 
            size={28} 
            color={isCompleted ? c.success || '#22C55E' : c.primary} 
          />
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]}>
          {isCompleted ? 'Pipeline Finalized' : 'Agent In Progress'}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {isCompleted ? 'Agent analysis successfully mapped to actions.' : 'Running real-time extraction and impact simulation...'}
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
          <View style={styles.completionButtonsRow}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: c.accent, flex: 1 }]} 
              onPress={handleFinishReport}
            >
              <Text style={[styles.primaryBtnText, { color: c.white }]}>View Impact</Text>
              <Feather name="bar-chart-2" size={16} color={c.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.successBtn, { backgroundColor: c.success || '#22C55E', flex: 1 }]} 
              onPress={handleSimulateActions}
            >
              <Text style={[styles.primaryBtnText, { color: c.white }]}>Simulate Change</Text>
              <Feather name="zap" size={16} color={c.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.processingBtn, { backgroundColor: c.surfaceVariant }]}>
            <ActivityIndicator size="small" color={c.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.processingText, { color: c.textSecondary }]}>Evaluating Profile Context...</Text>
          </View>
        )}
        
        {preferences.agentTransparency !== 'hidden' && (
          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={() => navigation.navigate('AgentTrace')}
          >
            <Text style={[styles.secondaryBtnText, { color: c.accent }]}>Examine Complete Agent Log Stack</Text>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 28,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
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
    letterSpacing: 0.5,
  },
  actionsContainer: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  completionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryBtnText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
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
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
});
