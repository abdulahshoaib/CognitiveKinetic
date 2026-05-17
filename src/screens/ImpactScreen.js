import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
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

export default function ImpactScreen({ navigation }) {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title="Impact Analysis"
          subtitle="Projected operational consequences and timeline shifts based on insights."
        />
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.outline} />
          </View>
          <Text style={styles.emptyTitle}>No Impact Assessment Available</Text>
          <Text style={styles.emptySubtitle}>
            Complete the signal understanding and semantic relevance stage first.
          </Text>
          <Button
            label="Back to Content Ingest"
            variant="ghost"
            onPress={() => navigation.navigate('Ingestion')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { impact } = analysisResult;
  const riskVal = impact.riskLevel ? impact.riskLevel.toLowerCase() : 'medium';
  
  // Matrix Coordinates Mapping
  // activeX - 0: Low, 1: Med, 2: High
  // activeY - 0: High, 1: Med, 2: Low
  let activeX = 1;
  let activeY = 1;

  if (riskVal === 'critical' || riskVal === 'high') {
    activeX = 2;
    activeY = 0;
  } else if (riskVal === 'medium') {
    activeX = 1;
    activeY = 1;
  } else {
    activeX = 0;
    activeY = 2;
  }

  const matrixData = [
    { row: 'SEV-H', cells: [{ prob: 'L' }, { prob: 'M' }, { prob: 'H' }] },
    { row: 'SEV-M', cells: [{ prob: 'L' }, { prob: 'M' }, { prob: 'H' }] },
    { row: 'SEV-L', cells: [{ prob: 'L' }, { prob: 'M' }, { prob: 'H' }] }
  ];

  const getRiskVariant = (lvl) => {
    if (lvl === 'critical' || lvl === 'high') return 'risk';
    if (lvl === 'medium') return 'active';
    return 'neutral';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Impact Analysis"
        subtitle="Projected operational consequences and timeline shifts based on insights."
        rightComponent={
          <Badge 
            label={`${riskVal.toUpperCase()} RISK`} 
            variant={getRiskVariant(riskVal)} 
            icon="nuclear-outline" 
          />
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Dynamic Threat Heatmap - This makes the screen completely different & premium */}
        <Card variant="glass" style={styles.heatmapCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="analytics" size={18} color={Colors.accent} />
            <Text style={styles.heatmapTitle}>Operational Threat Matrix</Text>
          </View>
          <Text style={styles.heatmapSubtitle}>
            Autonomous severity mapping: Impact Severity (Y) vs. Probability (X).
          </Text>
          
          <View style={styles.matrixContainer}>
            {/* Y Axis Indicator Label */}
            <View style={styles.yAxisContainer}>
              <Text style={styles.yAxisLabel}>I</Text>
              <Text style={styles.yAxisLabel}>M</Text>
              <Text style={styles.yAxisLabel}>P</Text>
              <Text style={styles.yAxisLabel}>A</Text>
              <Text style={styles.yAxisLabel}>C</Text>
              <Text style={styles.yAxisLabel}>T</Text>
            </View>

            {/* 3x3 Grid */}
            <View style={styles.grid}>
              {matrixData.map((rowData, yIdx) => (
                <View key={yIdx} style={styles.row}>
                  <Text style={styles.rowHeader}>{rowData.row}</Text>
                  {rowData.cells.map((cell, xIdx) => {
                    const isActive = xIdx === activeX && yIdx === activeY;
                    let cellBg = Colors.surfaceContainerLowest;
                    let cellBorder = Colors.l1Border;
                    let glowColor = Colors.accentBorder;
                    
                    if (isActive) {
                      if (riskVal === 'critical' || riskVal === 'high') {
                        cellBorder = Colors.danger;
                        cellBg = Colors.dangerSoft;
                        glowColor = Colors.danger;
                      } else if (riskVal === 'medium') {
                        cellBorder = Colors.warning;
                        cellBg = Colors.warningSoft;
                        glowColor = Colors.warning;
                      } else {
                        cellBorder = Colors.success;
                        cellBg = Colors.successSoft;
                        glowColor = Colors.success;
                      }
                    }
                    
                    return (
                      <View 
                        key={xIdx} 
                        style={[
                          styles.cell, 
                          { backgroundColor: cellBg, borderColor: cellBorder },
                          isActive && {
                            shadowColor: glowColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.6,
                            shadowRadius: 10,
                            elevation: 8,
                          }
                        ]}
                      >
                        {isActive ? (
                          <View style={[
                            styles.activeDot, 
                            { backgroundColor: riskVal === 'critical' || riskVal === 'high' ? Colors.danger : (riskVal === 'medium' ? Colors.warning : Colors.success) }
                          ]} />
                        ) : (
                          <Text style={styles.cellText}>
                            {yIdx === 0 ? 'CRIT' : yIdx === 1 ? 'MOD' : 'LOW'}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
              
              {/* X Axis Labels */}
              <View style={styles.xAxisRow}>
                <View style={styles.emptyCorner} />
                <Text style={styles.xAxisLabel}>PROB-L</Text>
                <Text style={styles.xAxisLabel}>PROB-M</Text>
                <Text style={styles.xAxisLabel}>PROB-H</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Narrative Impact Analysis */}
        <Card variant="surface" style={styles.narrativeCard}>
          <View style={styles.narrativeHeader}>
            <Ionicons name="document-text-outline" size={20} color={Colors.tertiary} />
            <Text style={styles.narrativeTitle}>Risk Exposure Summary</Text>
          </View>
          <Text style={styles.narrativeText}>
            {impact.explanation || "Comprehensive assessment of critical threat vectors on infrastructure and logistics chains."}
          </Text>
        </Card>

        {/* Details Breakdown */}
        <View style={styles.detailsRow}>
          <Card variant="glass" style={styles.detailHalfCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="flash-outline" size={18} color={Colors.danger} />
              <Text style={styles.detailTitle}>Short-Term Friction</Text>
            </View>
            <Text style={styles.detailText}>{impact.shortTerm || "Immediate operational challenges."}</Text>
          </Card>

          <Card variant="glass" style={styles.detailHalfCard}>
            <View style={styles.detailHeader}>
              <Ionicons name="time-outline" size={18} color={Colors.warning} />
              <Text style={styles.detailTitle}>Medium-Term Drift</Text>
            </View>
            <Text style={styles.detailText}>{impact.mediumTerm || "Projected systemic consequences."}</Text>
          </Card>
        </View>

        {/* Dynamic Flow Progression Timeline */}
        <Card variant="surface" style={styles.flowCard}>
          <Text style={styles.flowCardTitle}>Action Integration Flow</Text>
          <View style={styles.flowSteps}>
            <View style={styles.flowStep}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.flowStepText}>Telemetry Parse</Text>
            </View>
            <View style={styles.flowDividerActive} />
            <View style={styles.flowStep}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.flowStepText}>Impact Modeled</Text>
            </View>
            <View style={styles.flowDivider} />
            <View style={styles.flowStep}>
              <Ionicons name="ellipse-outline" size={18} color={Colors.accent} />
              <Text style={[styles.flowStepText, { color: Colors.accent }]}>Strategy Draft</Text>
            </View>
          </View>
        </Card>

        {/* Strategic Next Step CTA */}
        <Button
          label="Draft Strategic Recommendations"
          icon="arrow-forward"
          variant="primary"
          onPress={() => navigation.navigate('Actions')}
          style={styles.ctaButton}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  // Heatmap styles
  heatmapCard: {
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  heatmapTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  heatmapSubtitle: {
    color: Colors.slateText,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  matrixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  yAxisContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    width: 12,
    gap: 2,
  },
  yAxisLabel: {
    color: Colors.slateMuted,
    fontSize: FontSizes.xs - 2,
    fontWeight: FontWeights.bold,
  },
  grid: {
    flex: 1,
    maxWidth: 280,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  rowHeader: {
    width: 44,
    color: Colors.slateText,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    fontFamily: 'System',
  },
  cell: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cellText: {
    color: Colors.slateMuted,
    fontSize: FontSizes.xs - 3,
    fontWeight: FontWeights.semibold,
  },
  xAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  emptyCorner: {
    width: 44,
  },
  xAxisLabel: {
    flex: 1,
    color: Colors.slateText,
    fontSize: FontSizes.xs - 2,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    fontFamily: 'System',
  },
  // Narrative summary styles
  narrativeCard: {
    marginBottom: Spacing.md,
  },
  narrativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  narrativeTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  narrativeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  // Details row
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailHalfCard: {
    flex: 1,
    marginBottom: 0,
    padding: Spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  // Flow timeline
  flowCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  flowCardTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  flowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowStepText: {
    color: Colors.slateText,
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.semibold,
  },
  flowDividerActive: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.success,
    marginHorizontal: 4,
  },
  flowDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.l1Border,
    marginHorizontal: 4,
  },
  ctaButton: {
    marginTop: Spacing.sm,
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 60,
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
});
