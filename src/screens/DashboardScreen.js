import React, { useEffect, useState } from 'react';
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
import ContentItemCard from '../components/common/ContentItemCard';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;
  const { feedItems, analysisResult, simulationResult, analyzeContent, executionLogs } = useAnalysis();
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
    } catch (e) {
      console.error(e);
    }
  };

  if (!profile) return <Screen />; // Loading state

  const recentItems = feedItems.slice(0, 3);
  const latestInsight = analysisResult?.insights?.[0];
  const latestImpact = analysisResult?.impact;
  const pendingActions = analysisResult?.recommendedActions?.length || 0;
  
  const userLabel = user?.displayName || user?.email || 'Profile';

  const handleRecentItemPress = (item) => {
    if (!profile) return;
    const contentToAnalyze = `${item.title}\n\n${item.body}`;
    analyzeContent(contentToAnalyze, profile, item.id);
    navigation.navigate('IngestionTab', { screen: 'AnalysisRun' });
  };

  const renderIngestionCTA = () => (
    <View style={styles.ctaWrapper}>
      <TouchableOpacity 
        style={[styles.ingestCTA, { backgroundColor: c.accent }]}
        onPress={() => navigation.navigate('IngestionTab')}
      >
        <Feather name="plus-circle" size={18} color={c.white} />
        <Text style={[styles.ingestCTAText, { color: c.white }]}>
          Ingest & Analyze Update
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRiskStatus = () => {
    const riskLevel = latestImpact?.riskLevel || 'Nominal';
    const riskColor = riskLevel === 'High' ? c.error || '#EF4444' : riskLevel === 'Medium' ? c.warning || '#F59E0B' : c.success || '#22C55E';
    const riskBg = riskLevel === 'High' ? 'rgba(239, 68, 68, 0.08)' : riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)';
    
    return (
      <View style={styles.sectionWrapper}>
        <SectionHeader title="Operational Risk Status" />
        <View style={[styles.riskCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={styles.riskHeader}>
            <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>{riskLevel} Threat Vector</Text>
            </View>
            <Text style={[styles.riskScore, { color: c.textPrimary }]}>Score: {analysisResult?.relevanceScore || 0}/100</Text>
          </View>
          <Text style={[styles.riskDescription, { color: c.textSecondary, fontSize: FontSizes.sm }]}>
            {analysisResult 
              ? `Relevance threats verified at ${analysisResult.relevanceScore}% based on active business parameters.`
              : 'No active threat vectors parsed. System running at nominal baselines.'
            }
          </Text>
        </View>
      </View>
    );
  };

  const renderReportSection = () => (
    <View style={styles.sectionWrapper}>
      <SectionHeader title="Latest Report" />
      {!analysisResult ? (
        <EmptyState 
          icon="bar-chart-2"
          title="No Active Report"
          description="Analyze new content to generate an insight and impact report for your business."
          primaryAction={() => navigation.navigate('IngestionTab')}
          primaryActionTitle="Analyze New Content"
        />
      ) : (
        <View style={styles.reportContainer}>
          <TouchableOpacity
            style={[styles.reportSummaryCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}
            onPress={() => navigation.navigate('ImpactReport')}
          >
            <View style={styles.reportTopRow}>
              <View style={[styles.reportIcon, { backgroundColor: c.accentSoft }]}>
                <Feather name="file-text" size={20} color={c.accent} />
              </View>
              <View style={styles.reportTextBlock}>
                <Text style={[styles.reportTitle, { color: c.textPrimary }]}>{latestInsight?.title || 'Impact report ready'}</Text>
                <Text style={[styles.reportSubtitle, { color: c.textSecondary, fontSize: FontSizes.sm }]} numberOfLines={2}>
                  {latestImpact?.shortTerm || 'Review extracted signals, impact analysis, and recommended actions.'}
                </Text>
              </View>
            </View>

            <View style={[styles.reportMetaRow, { backgroundColor: c.surfaceContainerLowest }]}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Relevance</Text>
                <Text style={[styles.metaValue, { color: c.textPrimary }]}>{analysisResult.relevanceScore}%</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Risk</Text>
                <Text style={[styles.metaValue, { color: c.textPrimary }]}>{latestImpact?.riskLevel || 'Unknown'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: c.textSecondary }]}>Actions</Text>
                <Text style={[styles.metaValue, { color: c.textPrimary }]}>{pendingActions}</Text>
              </View>
            </View>

            <View style={styles.reportLinkRow}>
              <Text style={[styles.reportLink, { color: c.accent }]}>Open full report</Text>
              <Feather name="arrow-right" size={16} color={c.accent} />
            </View>
          </TouchableOpacity>

          <View style={styles.reportActionRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: c.surfaceContainerHigh }]}
              onPress={() => navigation.navigate('ImpactReport')}
            >
              <Text style={[styles.secondaryButtonText, { color: c.textPrimary }]}>View Report</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: c.accent }]}
              onPress={() => navigation.navigate('ActionsTab')}
            >
              <Text style={[styles.actionButtonText, { color: c.white }]}>Actions</Text>
              <Feather name="arrow-right" size={16} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderSimulationSection = () => simulationResult ? (
    <View style={styles.sectionWrapper}>
      <SectionHeader title="Latest Simulation" />
      <TouchableOpacity 
        style={[styles.simCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.successBorder }]}
        onPress={() => navigation.navigate('SimulationResult')}
      >
        <View style={styles.simHeader}>
          <Feather name="play-circle" size={24} color={c.success || '#22C55E'} />
          <Text style={[styles.simTitle, { color: c.textPrimary }]}>{simulationResult.actionTitle}</Text>
        </View>
        <Text style={[styles.simStatus, { color: c.textSecondary, fontSize: FontSizes.sm }]}>
          System state updated successfully.
        </Text>
        <Text style={[styles.simLink, { color: c.accent }]}>View detailed result</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const renderAgentTraceSection = () => {
    if (preferences.agentTransparency === 'hidden') return null;
    const logsToUse = executionLogs.length > 0 ? executionLogs : (simulationResult?.logs || []);
    if (logsToUse.length === 0) return null;
    
    return (
      <View style={styles.sectionWrapper}>
        <SectionHeader title="Recent Agent Trace Logs" />
        <View style={[styles.traceCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={styles.traceHeader}>
            <Feather name="activity" size={14} color={c.accent} />
            <Text style={[styles.traceTitleText, { color: c.textPrimary }]}>Live Agent Pipeline Pipeline Logs</Text>
          </View>
          <View style={styles.traceList}>
            {logsToUse.slice(-3).map((log, index) => (
              <View key={index} style={styles.traceRow}>
                <View style={[styles.traceDot, { backgroundColor: log.type === 'error' ? c.error : c.accent }]} />
                <Text style={[styles.traceText, { color: c.textPrimary, fontSize: FontSizes.xs }]} numberOfLines={1}>
                  {log.message}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderRecentContentSection = () => (
    <View style={styles.sectionWrapper}>
      <SectionHeader 
        title="Recent Analysis Runs" 
        rightElement={
          <TouchableOpacity onPress={() => navigation.navigate('IngestionTab')}>
            <Text style={[styles.seeAllLink, { color: c.accent }]}>See All</Text>
          </TouchableOpacity>
        }
      />
      
      <View style={styles.feedContainer}>
        {recentItems.map(item => (
          <ContentItemCard 
            key={item.id} 
            item={item} 
            onPress={handleRecentItemPress} 
          />
        ))}
      </View>
    </View>
  );

  const focusSections = preferences.homeFocus === 'action-queue'
    ? [renderReportSection, renderSimulationSection, renderRecentContentSection]
    : preferences.homeFocus === 'progress-summary'
      ? [renderSimulationSection, renderReportSection, renderRecentContentSection]
      : [renderReportSection, renderRecentContentSection, renderSimulationSection];

  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.appName, { color: c.textPrimary }]}>CognitiveKinetic</Text>
        </View>
        <TouchableOpacity style={styles.profileControl} onPress={() => navigation.navigate('ProfileTab', { screen: 'SettingsMain', params: { tab: 'account' } })}>
          <View style={styles.profileControlText}>
            <Text style={[styles.profileControlLabel, { color: c.textPrimary }]} numberOfLines={1}>{userLabel}</Text>
            <Text style={[styles.profileControlCompany, { color: c.textSecondary }]} numberOfLines={1}>
              Account settings
            </Text>
          </View>
          <View style={[styles.profileAvatar, { backgroundColor: c.accent }]}>
            <Feather name="user" size={18} color={c.white} />
          </View>
        </TouchableOpacity>
      </View>

      {renderIngestionCTA()}
      {renderRiskStatus()}

      {focusSections.map((renderSection, index) => (
        <React.Fragment key={index}>{renderSection()}</React.Fragment>
      ))}

      {renderAgentTraceSection()}
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
    maxWidth: '56%',
    paddingVertical: 6,
    paddingLeft: 10,
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
  ctaWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  ingestCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
    paddingVertical: 14,
  },
  ingestCTAText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm + 1,
  },
  sectionWrapper: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  riskCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskBadgeText: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
  },
  riskScore: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  riskDescription: {
    lineHeight: 18,
  },
  reportContainer: {
    width: '100%',
  },
  reportSummaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  reportTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextBlock: {
    flex: 1,
  },
  reportTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 22,
  },
  reportSubtitle: {
    lineHeight: 20,
    marginTop: 4,
  },
  reportMetaRow: {
    flexDirection: 'row',
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
    gap: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginTop: 4,
  },
  reportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 14,
  },
  reportLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  reportActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  simCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  simTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    flex: 1,
  },
  simStatus: {
    marginBottom: 12,
  },
  simLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  seeAllLink: {
    fontSize: FontSizes.sm,
  },
  feedContainer: {
    width: '100%',
    gap: 12,
  },
  traceCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  traceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  traceTitleText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  traceList: {
    gap: 8,
  },
  traceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  traceText: {
    flex: 1,
  },
});
