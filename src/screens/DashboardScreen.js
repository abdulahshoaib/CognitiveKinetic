import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile } from '../services/profileService';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import { getReportTitle } from '../utils/reportTitles';

const STAGE_LABELS = {
  idle: 'Idle',
  loading_profile: 'Loading profile',
  ingesting: 'Ingesting content',
  signals: 'Extracting signals',
  relevance: 'Checking relevance',
  insights: 'Generating insight',
  impact: 'Analyzing impact',
  actions: 'Planning actions',
  completed: 'Completed',
};

const titleCase = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const countActions = (history, status) =>
  history.reduce((total, analysis) => (
    total + (analysis.recommendedActions || []).filter(action => action.simulationStatus === status).length
  ), 0);

const getFirstPendingAction = (history) => {
  for (const analysis of history) {
    const action = (analysis.recommendedActions || []).find(item => item.simulationStatus === 'pending');
    if (action) return { analysis, action };
  }
  return null;
};

const getTimeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const {
    analysisResult,
    analysisHistory,
    currentStage,
    executionLogs,
    executeSimulation,
    isAnalyzing,
    simulationResult,
    viewAnalysis,
  } = useAnalysis();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (isFocused && user?.uid) {
      loadProfile();
    }
  }, [isFocused, user?.uid]);

  const loadProfile = async () => {
    try {
      const activeProfile = await getProfile(user.uid);
      if (!activeProfile) {
        navigation.replace('Onboarding');
      } else {
        setProfile(activeProfile);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const latestReport = analysisResult || analysisHistory[0] || null;
  const latestImpact = latestReport?.impact;
  const pendingAction = useMemo(() => getFirstPendingAction(analysisHistory), [analysisHistory]);
  const recentReports = analysisHistory.slice(0, 2);
  const userLabel = user?.displayName || user?.email || 'Profile';

  const metrics = [
    { label: 'Reports', value: analysisHistory.length, color: c.accent },
    { label: 'High Risk', value: analysisHistory.filter(item => item.relevanceScore >= 75).length, color: c.error || '#EF4444' },
    { label: 'Pending', value: countActions(analysisHistory, 'pending'), color: c.warning || '#F59E0B' },
    { label: 'Simulated', value: countActions(analysisHistory, 'passed'), color: c.success || '#22C55E' },
  ];

  const riskLevel = String(latestImpact?.riskLevel || 'nominal').toLowerCase();
  const riskLabel = riskLevel === 'none' ? 'None' : titleCase(riskLevel);
  const riskColor = ['critical', 'high'].includes(riskLevel)
    ? c.error || '#EF4444'
    : riskLevel === 'medium'
      ? c.warning || '#F59E0B'
      : c.success || '#22C55E';

  const openReport = (report) => {
    if (!report) return;
    viewAnalysis(report);
    navigation.navigate('ActionsTab', { screen: 'ImpactReport' });
  };

  const handleSimulateNextAction = async () => {
    if (!pendingAction) return;
    const { analysis, action } = pendingAction;
    viewAnalysis(analysis);
    const isManual = action.simulationSupported === false || action.actionType === 'manual_review';
    if (isManual) {
      navigation.navigate('ActionsTab', { screen: 'ImpactReport' });
      return;
    }
    await executeSimulation(action, analysis.id);
    navigation.navigate('SimulationResult');
  };

  if (!profile) return <Screen style={{ backgroundColor: c.background }} />;

  const renderProfileStrip = () => (
    <View style={[styles.profileStrip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
      <View style={[styles.profileIcon, { backgroundColor: c.successSoft }]}>
        <Feather name="check-circle" size={18} color={c.success || '#22C55E'} />
      </View>
      <View style={styles.profileText}>
        <Text style={[styles.profileTitle, { color: c.textPrimary }]} numberOfLines={1}>
          {profile.businessName || profile.organizationName || 'Saved profile active'}
        </Text>
        <Text style={[styles.profileSub, { color: c.textSecondary }]} numberOfLines={1}>
          Saved profile reused automatically
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.smallButton, { borderColor: c.surfaceBorder }]}
        onPress={() => navigation.navigate('ProfileTab', { screen: 'SettingsMain' })}
      >
        <Text style={[styles.smallButtonText, { color: c.textPrimary }]}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrimaryCTA = () => (
    <TouchableOpacity
      style={[styles.primaryCTA, { backgroundColor: c.accent }]}
      onPress={() => navigation.navigate('IngestionTab')}
    >
      <Feather name="plus-circle" size={18} color={c.white} />
      <Text style={[styles.primaryCTAText, { color: c.white }]}>Analyze New Content</Text>
    </TouchableOpacity>
  );

  const renderMetricGrid = () => (
    <View style={styles.metricsGrid}>
      {metrics.map(metric => (
        <View key={metric.label} style={[styles.metricCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
          <Text style={[styles.metricLabel, { color: c.textSecondary }]}>{metric.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderPipelineCard = () => {
    if (!isAnalyzing) return null;
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.accentBorder }]}
        onPress={() => navigation.navigate('IngestionTab', { screen: 'AnalysisRun' })}
      >
        <View style={styles.cardRow}>
          <View style={[styles.cardIcon, { backgroundColor: c.accentSoft }]}>
            <Feather name="activity" size={18} color={c.accent} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>Analysis running</Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]}>{STAGE_LABELS[currentStage] || titleCase(currentStage)}</Text>
          </View>
          <Feather name="arrow-right" size={18} color={c.accent} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderLatestReport = () => {
    if (!latestReport) {
      return (
        <EmptyState
          icon="bar-chart-2"
          title="No Report Yet"
          description="Analyze news or pasted content to generate your first impact report."
          primaryAction={() => navigation.navigate('IngestionTab')}
          primaryActionTitle="Analyze Content"
        />
      );
    }

    return (
      <TouchableOpacity
        style={[styles.reportCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
        onPress={() => openReport(latestReport)}
      >
        <View style={styles.reportHeader}>
          <View style={[styles.cardIcon, { backgroundColor: c.accentSoft }]}>
            <Feather name="file-text" size={18} color={c.accent} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={2}>
              {getReportTitle(latestReport)}
            </Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]} numberOfLines={2}>
              {latestImpact?.shortTerm || 'Signals, impact, and actions are ready.'}
            </Text>
          </View>
        </View>

        <View style={[styles.reportMetrics, { backgroundColor: c.surfaceContainerLowest }]}>
          <View style={styles.reportMetric}>
            <Text style={[styles.reportMetricLabel, { color: c.textSecondary }]}>Relevance</Text>
            <Text style={[styles.reportMetricValue, { color: c.textPrimary }]}>{latestReport.relevanceScore || 0}%</Text>
          </View>
          <View style={styles.reportMetric}>
            <Text style={[styles.reportMetricLabel, { color: c.textSecondary }]}>Risk</Text>
            <Text style={[styles.reportMetricValue, { color: riskColor }]}>{riskLabel}</Text>
          </View>
          <View style={styles.reportMetric}>
            <Text style={[styles.reportMetricLabel, { color: c.textSecondary }]}>Actions</Text>
            <Text style={[styles.reportMetricValue, { color: c.textPrimary }]}>
              {(latestReport.recommendedActions || []).length}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNextAction = () => {
    if (!pendingAction) return null;
    const { analysis, action } = pendingAction;
    const isManual = action.simulationSupported === false || action.actionType === 'manual_review';

    return (
      <View style={[styles.actionCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.cardRow}>
          <View style={[styles.cardIcon, { backgroundColor: c.warningSoft }]}>
            <Feather name="zap" size={18} color={c.warning || '#F59E0B'} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.eyebrow, { color: c.textSecondary }]}>Next recommended action</Text>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={2}>{action.title}</Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]} numberOfLines={1}>
              {action.targetSystem || 'Internal workflow'}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: c.surfaceBorder }]}
            onPress={() => openReport(analysis)}
          >
            <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: c.accent }]}
            onPress={handleSimulateNextAction}
          >
            <Text style={[styles.actionButtonText, { color: c.white }]}>{isManual ? 'Review' : 'Simulate'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSimulationCard = () => {
    if (!simulationResult) return null;
    return (
      <TouchableOpacity
        style={[styles.compactCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.successBorder }]}
        onPress={() => navigation.navigate('SimulationResult')}
      >
        <View style={styles.cardRow}>
          <View style={[styles.cardIcon, { backgroundColor: c.successSoft }]}>
            <Feather name="check-circle" size={18} color={c.success || '#22C55E'} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]} numberOfLines={1}>
              Latest simulation passed
            </Text>
            <Text style={[styles.cardSub, { color: c.textSecondary }]} numberOfLines={1}>
              {simulationResult.actionTitle}
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color={c.success || '#22C55E'} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentReports = () => {
    if (recentReports.length === 0) return null;

    return (
      <View style={styles.sectionWrapper}>
        <SectionHeader
          title="Recent Reports"
          rightElement={
            <TouchableOpacity onPress={() => navigation.navigate('ActionsTab')}>
              <Text style={[styles.seeAllLink, { color: c.accent }]}>All Reports</Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.reportList}>
          {recentReports.map(report => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportListItem, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
              onPress={() => openReport(report)}
            >
              <View style={styles.cardText}>
                <Text style={[styles.listTitle, { color: c.textPrimary }]} numberOfLines={1}>
                  {getReportTitle(report)}
                </Text>
                <Text style={[styles.cardSub, { color: c.textSecondary }]}>{getTimeAgo(report.analyzedAt)}</Text>
              </View>
              <Text style={[styles.listScore, { color: report.relevanceScore >= 75 ? c.error || '#EF4444' : c.textSecondary }]}>
                {report.relevanceScore || 0}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderLatestLog = () => {
    const latestLog = executionLogs[executionLogs.length - 1];
    if (!latestLog) return null;

    return (
      <View style={[styles.logStrip, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <Feather name="terminal" size={14} color={c.textSecondary} />
        <Text style={[styles.logText, { color: c.textSecondary }]} numberOfLines={1}>{latestLog.message}</Text>
      </View>
    );
  };

  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.appName, { color: c.textPrimary }]}>CognitiveKinetic</Text>
        </View>
        <TouchableOpacity
          style={styles.profileControl}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'SettingsMain', params: { tab: 'account' } })}
        >
          <View style={styles.profileControlText}>
            <Text style={[styles.profileControlLabel, { color: c.textPrimary }]} numberOfLines={1}>{userLabel}</Text>
            <Text style={[styles.profileControlCompany, { color: c.textSecondary }]} numberOfLines={1}>Account</Text>
          </View>
          <View style={[styles.profileAvatar, { backgroundColor: c.accent }]}>
            <Feather name="user" size={18} color={c.white} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {renderProfileStrip()}
        {renderPrimaryCTA()}
        {renderMetricGrid()}
        {renderPipelineCard()}

        <View style={styles.sectionWrapper}>
          <SectionHeader title="Latest Impact" />
          {renderLatestReport()}
        </View>

        {renderNextAction()}
        {renderSimulationCard()}
        {renderRecentReports()}
        {renderLatestLog()}
      </View>
      <View style={{ height: 120 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  headerTitle: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    fontSize: FontSizes.sm,
  },
  appName: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  profileControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    maxWidth: '52%',
    paddingVertical: 6,
  },
  profileControlText: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  profileControlLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  profileControlCompany: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    gap: 14,
  },
  profileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  profileSub: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  smallButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryCTAText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  metricValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  compactCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 21,
  },
  cardSub: {
    fontSize: FontSizes.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  sectionWrapper: {
    gap: 10,
  },
  reportCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  reportHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reportMetrics: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 10,
    marginTop: 14,
    padding: 12,
  },
  reportMetric: {
    flex: 1,
  },
  reportMetricLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  reportMetricValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginTop: 3,
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  eyebrow: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  seeAllLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  reportList: {
    gap: 10,
  },
  reportListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  listTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  listScore: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  logStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  logText: {
    flex: 1,
    fontSize: FontSizes.xs,
  },
});
