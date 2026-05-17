import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import StepProgress from '../components/common/StepProgress';
import AgentLogList from '../components/common/AgentLogList';

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

export default function AnalysisRunScreen() {
  const navigation = useNavigation();
  const { currentStage, isAnalyzing, executionLogs, analysisResult } = useAnalysis();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;

  const isCompleted = currentStage === 'completed';
  const density = preferences.density || 'cozy';
  const ds = getDensityStyle(density);

  const handleFinishReport = () => {
    navigation.navigate('Dashboard', { screen: 'ImpactReport' });
  };

  const handleSimulateActions = () => {
    navigation.navigate('ActionsTab', { screen: 'ActionsMain' });
  };

  const actionsCount = analysisResult?.actions?.length || 3;
  const threatLevel = analysisResult?.impactMatrix?.overallRisk || 'Moderate';

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      <View style={[styles.header, { paddingTop: ds.headerPaddingTop }]}>
        <View style={[styles.headerIconContainer, { backgroundColor: isCompleted ? 'rgba(34, 197, 94, 0.1)' : c.primarySubtle }]}>
          <Feather 
            name={isCompleted ? "shield-check" : "compass"} 
            size={28} 
            color={isCompleted ? c.success || '#22C55E' : c.primary} 
          />
        </View>
        <Text style={[styles.title, { color: c.textPrimary, fontSize: ds.fontSizeTitle }]}>
          {isCompleted ? 'Pipeline Finalized' : 'Agent In Progress'}
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>
          {isCompleted ? 'Agent analysis successfully mapped to actions.' : 'Running real-time extraction and impact simulation...'}
        </Text>
      </View>

      <View style={[styles.progressCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: ds.cardPadding, marginHorizontal: ds.padding, marginBottom: ds.cardMarginBottom }]}>
        <StepProgress currentStage={currentStage} />
      </View>

      {isCompleted && (
        <View style={[styles.completionCard, { 
          backgroundColor: c.successSubtle || 'rgba(34, 197, 94, 0.04)', 
          borderColor: c.success || '#22C55E',
          marginHorizontal: ds.padding,
          padding: ds.cardPadding,
          marginBottom: ds.cardMarginBottom
        }]}>
          <View style={styles.completionHeader}>
            <Feather name="check-circle" size={20} color={c.success || '#22C55E'} />
            <Text style={[styles.completionTitle, { color: c.textPrimary }]}>Decision Pipeline Verified</Text>
          </View>
          <Text style={[styles.completionDesc, { color: c.textSecondary, fontSize: ds.fontSizeBody }]}>
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
        <View style={[styles.logsSection, { marginHorizontal: ds.padding, marginBottom: ds.cardMarginBottom * 1.5 }]}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary, fontSize: ds.fontSizeBody, fontWeight: '700' }]}>
            Execution Traces
          </Text>
          <AgentLogList
            logs={executionLogs}
            limit={preferences.agentTransparency === 'full-trace' ? 12 : 4}
          />
        </View>
      )}

      <View style={[styles.actionsContainer, { paddingHorizontal: ds.padding, gap: ds.gap, paddingBottom: 120 }]}>
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
            onPress={() => navigation.navigate('Dashboard', { screen: 'AgentTrace' })}
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
    fontWeight: FontWeights.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  completionCard: {
    borderRadius: 14,
    borderWidth: 1,
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
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    gap: 12,
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
