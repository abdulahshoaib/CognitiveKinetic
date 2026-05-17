import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Header from '../components/common/Header';
import { useAnalysis } from '../context/AnalysisContext';

export default function InsightsScreen({ navigation }) {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="analytics" size={48} color={Colors.outline} />
          </View>
          <Text style={styles.emptyTitle}>No Active Analysis Session</Text>
          <Text style={styles.emptySubtitle}>
            Please select or ingest new content from the Content Feed to run the autonomous pipeline.
          </Text>
          <Button
            label="Go to Content Input"
            icon="add"
            variant="primary"
            onPress={() => navigation.navigate('Ingestion')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { relevanceScore, isRelevant, signals, insights } = analysisResult;

  const getSeverityColor = (severity) => {
    if (severity === 'high' || severity === 'critical') return Colors.error;
    if (severity === 'medium') return Colors.warning;
    return Colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Insight & Impact Report"
        subtitle="Executive summary of extracted intelligence and projected business impact."
        rightComponent={<Badge label="Analysis Complete" variant="success" icon="checkmark-circle" />}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Core Insight (Hero Card) */}
        {insights && insights.length > 0 && (
          <Card variant="surface" style={{ marginBottom: Spacing.md, overflow: 'hidden' }}>
            <View style={styles.gradientLine} />
            <View style={styles.coreInsightHeader}>
              <View style={styles.titleContainer}>
                <Ionicons name="bulb" size={20} color={Colors.accent} style={styles.titleIcon} />
                <Text style={styles.cardTitle}>Core Insight</Text>
              </View>
              <Badge label="Confidence 94%" variant="outline" />
            </View>
            <Text style={styles.coreInsightDescription}>
              {insights[0].description}
            </Text>
          </Card>
        )}

        {/* Extracted Signals */}
        <Card variant="glass" style={{ marginBottom: Spacing.md }}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="radar-outline" size={20} color={Colors.tertiary} style={styles.titleIcon} />
              <Text style={styles.cardTitle}>Extracted Signals</Text>
            </View>
          </View>
          
          {signals && signals.length > 0 ? (
            <View style={styles.signalsList}>
              {signals.map((sig, index) => (
                <View key={sig.id} style={[styles.signalItem, index < signals.length - 1 && styles.signalItemBorder]}>
                  <Ionicons 
                    name={sig.severity === 'high' ? 'trending-up' : sig.severity === 'medium' ? 'warning' : 'megaphone'} 
                    size={18} 
                    color={getSeverityColor(sig.severity)} 
                    style={styles.signalIcon}
                  />
                  <View style={styles.signalContent}>
                    <Text style={styles.signalMetric}>{sig.label}</Text>
                    <Text style={styles.signalEvidence}>{sig.evidence}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySubCard}>
              <Text style={styles.emptySubCardText}>No metric signals parsed from input.</Text>
            </View>
          )}
        </Card>

        {/* Profile Relevance */}
        <Card variant="glass" style={{ marginBottom: Spacing.md }}>
          <View style={styles.cardHeaderBorderless}>
            <View style={styles.titleContainer}>
              <Ionicons name="locate-outline" size={20} color={Colors.secondary} style={styles.titleIcon} />
              <Text style={styles.cardTitle}>Profile Relevance</Text>
            </View>
          </View>
          
          <Text style={styles.relevanceLabel}>
            Alignment with active operational profile: <Text style={styles.relevancePrimary}>Q3 Margin Protection</Text>
          </Text>
          
          <View style={styles.relevanceSummaryRow}>
            <Text style={styles.relevanceStatusText}>
              {isRelevant 
                ? 'Your current logistics contracts are insulated from the fuel price spike for another 45 days. This creates a temporary competitive moat against competitors exposed supply lines.' 
                : 'Insufficient profile match. Context-to-action bypass triggered.'
              }
            </Text>
          </View>
        </Card>

        {/* Action Button to Next Step */}
        <Button
          label="Model Operational Impacts"
          icon="arrow-forward"
          variant="primary"
          onPress={() => navigation.navigate('Impact')}
          style={{ marginTop: Spacing.sm }}
        />
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  gradientLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accent,
  },
  coreInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: Spacing.xs,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  coreInsightDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  cardHeaderBorderless: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  signalsList: {
    flexDirection: 'column',
  },
  signalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  signalItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  signalIcon: {
    marginTop: 2,
    marginRight: Spacing.sm,
  },
  signalContent: {
    flex: 1,
  },
  signalMetric: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  signalEvidence: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  relevanceLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  relevancePrimary: {
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
  },
  relevanceSummaryRow: {
    backgroundColor: Colors.surfaceContainerLow,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  relevanceStatusText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  emptySubCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  emptySubCardText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
});
