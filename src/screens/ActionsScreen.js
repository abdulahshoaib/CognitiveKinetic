import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAnalysis } from '../context/AnalysisContext';
import { usePreferences } from '../context/PreferencesContext';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import SectionHeader from '../components/common/SectionHeader';
import EmptyState from '../components/common/EmptyState';
import ActionCard from '../components/common/ActionCard';

const urgencyWeight = { 'High': 3, 'Medium': 2, 'Normal': 1, 'Low': 0 };

export default function ActionsScreen() {
  const navigation = useNavigation();
  const { analysisResult, executeSimulation } = useAnalysis();
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;

  const handleSimulate = async (action) => {
    executeSimulation(action);
    navigation.navigate('SimulationResult');
  };

  const actions = analysisResult?.recommendedActions || [];
  
  // Sort actions: High urgency first, then fallback to medium/normal
  const sortedActions = [...actions].sort((a, b) => {
    const weightA = urgencyWeight[a.urgency] || 0;
    const weightB = urgencyWeight[b.urgency] || 0;
    return weightB - weightA;
  });

  if (!analysisResult) {
    return (
      <Screen style={{ backgroundColor: c.background }}>
        <EmptyState 
          icon="activity"
          title="No Actions Calculated"
          description="Analyze an incoming updates signal first to formulate decision items."
          primaryAction={() => navigation.navigate('IngestionTab')}
          primaryActionTitle="Go to Ingestion Portal"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={true} style={{ backgroundColor: c.background }}>
      {/* Premium typographic introduction block */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: c.textPrimary, fontSize: FontSizes.xl }]}>
              Actions Queue
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary, fontSize: FontSizes.sm }]}>
              Verify proposed overrides and simulate executions to observe modified before/after system states.
            </Text>
          </View>
        </View>
        
        <View style={[styles.bulletinBox, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder }]}>
          <View style={styles.bulletinRow}>
            <View style={[styles.bulletinDot, { backgroundColor: c.accent }]} />
            <Text style={[styles.bulletinText, { color: c.textPrimary }]}>
              <Text style={{ fontWeight: FontWeights.bold }}>Context Status:</Text> Active Saved Profile Loaded
            </Text>
          </View>
          <View style={styles.bulletinRow}>
            <View style={[styles.bulletinDot, { backgroundColor: c.accent }]} />
            <Text style={[styles.bulletinText, { color: c.textPrimary }]}>
              <Text style={{ fontWeight: FontWeights.bold }}>Primary Focus:</Text> Cost Optimization & Margin Protection
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.listContainer, { paddingHorizontal: 20, gap: 12, paddingBottom: 120 }]}>
        {sortedActions.length === 0 ? (
          <EmptyState 
            icon="check-circle"
            title="All Clear"
            description="The system's active parameters are fully optimized. No outstanding recommendations."
          />
        ) : (
          sortedActions.map(action => (
            <ActionCard 
              key={action.id} 
              action={action} 
              onSimulate={handleSimulate} 
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    marginTop: 2,
    lineHeight: FontSizes.sm * 1.4,
  },
  bulletinBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  bulletinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletinText: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  listContainer: {
    marginTop: 10,
  },
});
