import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { getProfile } from '../services/profileService';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import ContentItemCard from '../components/common/ContentItemCard';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const { feedItems, analysisResult, simulationResult, analyzeContent } = useAnalysis();
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
  const locationsLabel = Array.isArray(profile.locations)
    ? profile.locations.join(', ')
    : profile.locations || 'No locations set';
  const userLabel = user?.displayName || user?.email || 'Profile';

  const handleRecentItemPress = (item) => {
    if (!profile) return;

    const contentToAnalyze = `${item.title}\n\n${item.body}`;
    analyzeContent(contentToAnalyze, profile, item.id);
    navigation.navigate('AnalysisRun');
  };

  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.appName, { color: c.textPrimary }]}>CognitiveKinetic</Text>
        </View>
        <TouchableOpacity style={styles.profileControl} onPress={() => navigation.navigate('UserPreferences')}>
          <View style={styles.profileControlText}>
            <Text style={[styles.profileControlLabel, { color: c.textPrimary }]} numberOfLines={1}>{userLabel}</Text>
            <Text style={[styles.profileControlCompany, { color: c.textSecondary }]} numberOfLines={1}>
              User preferences
            </Text>
          </View>
          <View style={[styles.profileAvatar, { backgroundColor: c.accent }]}>
            <Ionicons name="person" size={18} color={c.white} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.profileSummary, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.profileHeader}>
          <Text style={[styles.profileName, { color: c.textPrimary }]}>{profile.businessName || 'Business Profile'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
            <Text style={[styles.editLink, { color: c.accent }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.profileDetail, { color: c.textSecondary }]}>{profile.industry || 'Industry not set'} • {locationsLabel}</Text>
      </View>

      <SectionHeader title="Latest Report" />
      {!analysisResult ? (
        <EmptyState 
          icon="analytics-outline"
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
                <Ionicons name="document-text-outline" size={20} color={c.accent} />
              </View>
              <View style={styles.reportTextBlock}>
                <Text style={[styles.reportTitle, { color: c.textPrimary }]}>{latestInsight?.title || 'Impact report ready'}</Text>
                <Text style={[styles.reportSubtitle, { color: c.textSecondary }]} numberOfLines={2}>
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
              <Ionicons name="arrow-forward" size={16} color={c.accent} />
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
              <Ionicons name="arrow-forward" size={16} color={c.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {simulationResult && (
        <>
          <SectionHeader title="Latest Simulation" />
          <TouchableOpacity 
            style={[styles.simCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.successBorder }]}
            onPress={() => navigation.navigate('SimulationResult')}
          >
            <View style={styles.simHeader}>
              <Ionicons name="play-circle" size={24} color={c.success} />
              <Text style={[styles.simTitle, { color: c.textPrimary }]}>{simulationResult.actionTitle}</Text>
            </View>
            <Text style={[styles.simStatus, { color: c.textSecondary }]}>System state updated successfully.</Text>
            <Text style={[styles.simLink, { color: c.accent }]}>View detailed result</Text>
          </TouchableOpacity>
        </>
      )}

      <SectionHeader 
        title="Recent Content" 
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  appName: {
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  profileControlCompany: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  profileAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  editLink: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
  },
  profileDetail: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  reportContainer: {
    marginHorizontal: 20,
  },
  reportSummaryCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: Colors.accentSoft,
  },
  reportTextBlock: {
    flex: 1,
  },
  reportTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 22,
  },
  reportSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  reportMetaRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
    gap: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: Colors.textPrimary,
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
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  reportActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  simCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    padding: 16,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  simTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    flex: 1,
  },
  simStatus: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: 12,
  },
  simLink: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  seeAllLink: {
    color: Colors.accent,
    fontSize: FontSizes.sm,
  },
  feedContainer: {
    paddingHorizontal: 20,
  },
});
