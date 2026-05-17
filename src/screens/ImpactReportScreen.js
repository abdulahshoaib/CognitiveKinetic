import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import InsightCard from '../components/common/InsightCard';
import ImpactSummaryCard from '../components/common/ImpactSummaryCard';
import StatusPill from '../components/common/StatusPill';

export default function ImpactReportScreen() {
  const navigation = useNavigation();
  const { analysisResult } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  if (!analysisResult) {
    return (
      <Screen>
        <EmptyState
          icon="analytics-outline"
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

  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.accent }]}>Impact Report</Text>
        <Text style={[styles.title, { color: c.textPrimary }]}>Content-to-action analysis</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          Generated against the saved profile automatically.
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.scoreBlock}>
          <Text style={[styles.scoreLabel, { color: c.textSecondary }]}>Relevance</Text>
          <Text style={[styles.scoreValue, { color: c.textPrimary }]}>{analysisResult.relevanceScore}%</Text>
        </View>
        <StatusPill label={relevanceStatus} status={analysisResult.isRelevant ? 'success' : 'warning'} />
      </View>

      <SectionHeader title="Extracted Signals" />
      <View style={styles.sectionBody}>
        {signals.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.textSecondary, backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>No signals extracted.</Text>
        ) : (
          signals.map(signal => (
            <View key={signal.id} style={[styles.signalRow, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
              <View style={[styles.signalIcon, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="pulse-outline" size={16} color={c.accent} />
              </View>
              <View style={styles.signalText}>
                <Text style={[styles.signalTitle, { color: c.textPrimary }]}>{signal.label}</Text>
                <Text style={[styles.signalEvidence, { color: c.textSecondary }]}>{signal.evidence}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <SectionHeader title="Insights" />
      <View style={styles.sectionBody}>
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} style={styles.cardSpacing} />
        ))}
      </View>

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

      <View style={[styles.actionPanel, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
        <View style={styles.actionCopy}>
          <Text style={[styles.actionTitle, { color: c.textPrimary }]}>
            {actions.length === 0 ? 'No actions recommended' : 'Recommended actions'}
          </Text>
          <Text style={[styles.actionSubtitle, { color: c.textSecondary }]}>
            {actions.length === 0
              ? 'No follow-up action is needed from this report. Return to the dashboard to review other content.'
              : `${actions.length} action${actions.length === 1 ? '' : 's'} ready for review and simulation.`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: actions.length === 0 ? c.surfaceContainerHigh : c.accent }]}
          onPress={() => {
            if (actions.length === 0) {
              navigation.navigate('Home', { screen: 'Dashboard' });
            } else {
              navigation.navigate('ReportActions');
            }
          }}
        >
          <Text style={[styles.actionButtonText, { color: c.white }]}>
            {actions.length === 0 ? 'Go to Dashboard' : 'View Actions'}
          </Text>
          <Ionicons
            name={actions.length === 0 ? 'grid-outline' : 'arrow-forward'}
            size={16}
            color={c.white}
          />
        </TouchableOpacity>
      </View>
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
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: 30,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 6,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  scoreBlock: {
    flex: 1,
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  sectionBody: {
    paddingHorizontal: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 14,
    marginBottom: 10,
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentSoft,
  },
  signalText: {
    flex: 1,
  },
  signalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    lineHeight: 20,
  },
  signalEvidence: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  explanationCard: {
    marginTop: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
  },
  explanationLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  explanationText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  actionPanel: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    gap: 16,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  dashboardButton: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
