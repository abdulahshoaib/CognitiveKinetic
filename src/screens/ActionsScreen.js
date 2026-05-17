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

export default function ActionsScreen({ navigation }) {
  const { analysisResult } = useAnalysis();

  if (!analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="flash-off" size={48} color={Colors.outline} />
          </View>
          <Text style={styles.emptyTitle}>No Recommendations Ready</Text>
          <Text style={styles.emptySubtitle}>
            Complete the operational impact analysis stage to see strategic recommendations.
          </Text>
          <Button
            label="Back to Ingestion Feed"
            variant="outline"
            onPress={() => navigation.navigate('Ingestion')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { recommendedActions } = analysisResult;

  const handleSelectSimulation = (action) => {
    navigation.navigate('Simulation', { action });
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === 'critical' || urgency === 'high') return 'warning';
    if (urgency === 'medium') return 'alert-circle';
    return 'information-circle';
  };
  
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'pricing_adjust': return 'pricetag-outline';
      case 'partnership': return 'people-outline';
      case 'route_shift': return 'git-network-outline';
      case 'asset_swap': return 'bicycle-outline';
      case 'policy_review': return 'document-text-outline';
      default: return 'build-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Recommended Actions"
        subtitle="The AI agent has recommended the following changes to handle the business updates. You can test each action in a safe simulation environment before choosing to run it."
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Action Grid */}
        <View style={styles.grid}>
          {recommendedActions && recommendedActions.length > 0 ? (
            recommendedActions.map((action, index) => {
              const isSimulatable = action.simulationSupported;
              
              if (isSimulatable) {
                // Primary Action Card (Spans wide, detailed)
                return (
                  <Card key={action.id || index} variant="glass" style={{ marginBottom: Spacing.md }}>
                    {/* Header */}
                    <View style={styles.primaryHeader}>
                      <View style={styles.headerInfo}>
                        <View style={styles.iconContainerPrimary}>
                          <Ionicons name={getActionIcon(action.actionType)} size={20} color={Colors.accent} />
                        </View>
                        <View>
                          <Text style={styles.actionTitlePrimary}>{action.title}</Text>
                          <View style={styles.tagsRow}>
                            <Badge label={action.targetSystem} variant="neutral" />
                            <Badge 
                              label={action.urgency === 'critical' || action.urgency === 'high' ? 'High Priority' : 'Medium Priority'}
                              variant={action.urgency === 'critical' || action.urgency === 'high' ? 'risk' : 'warning'}
                              icon={getUrgencyIcon(action.urgency)}
                            />
                          </View>
                        </View>
                      </View>
                      <Text style={styles.priorityLabel}>Option #{index + 1}</Text>
                    </View>

                    {/* Rationale */}
                    <View style={styles.rationaleBox}>
                      <Text style={styles.rationaleText}>
                        <Text style={styles.rationaleLabel}>Description: </Text>
                        {action.rationale || action.description}
                      </Text>
                    </View>

                    {/* Impact Grid */}
                    <View style={styles.impactGrid}>
                      <View style={styles.impactItem}>
                        <Ionicons name="analytics-outline" size={20} color={Colors.accent} />
                        <View style={styles.impactItemText}>
                          <Text style={styles.impactLabel}>Success Chance</Text>
                          <Text style={styles.impactValuePrimary}>{action.confidence}</Text>
                        </View>
                      </View>
                      <View style={styles.impactItem}>
                        <Ionicons name="hardware-chip-outline" size={20} color={Colors.tertiary} />
                        <View style={styles.impactItemText}>
                          <Text style={styles.impactLabel}>AI Engine</Text>
                          <Text style={styles.impactValueTertiary}>Cognitive Kinetic</Text>
                        </View>
                      </View>
                    </View>

                    {/* Footer CTA */}
                    <View style={styles.actionFooter}>
                      <Button
                        label="Test This Action"
                        icon="play"
                        variant="primary"
                        onPress={() => handleSelectSimulation(action)}
                      />
                    </View>
                  </Card>
                );
              } else {
                // Secondary Action Card
                return (
                  <Card key={action.id || index} variant="surface" style={{ marginBottom: Spacing.md }}>
                    <View style={styles.secondaryHeader}>
                      <View style={styles.headerInfo}>
                        <View style={styles.iconContainerSecondary}>
                          <Ionicons name={getActionIcon(action.actionType)} size={18} color={Colors.secondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.actionTitleSecondary}>{action.title}</Text>
                          <Text style={styles.systemTagSecondary}>{action.targetSystem}</Text>
                        </View>
                      </View>
                      <Badge 
                        label={action.urgency === 'critical' || action.urgency === 'high' ? 'High' : (action.urgency === 'medium' ? 'Med' : 'Low')}
                        variant={action.urgency === 'critical' || action.urgency === 'high' ? 'risk' : (action.urgency === 'medium' ? 'warning' : 'neutral')}
                      />
                    </View>

                    <Text style={styles.actionDescriptionSecondary}>{action.rationale || action.description}</Text>

                    <View style={styles.expectedBox}>
                      <Text style={styles.expectedLabel}>Success Chance:</Text>
                      <Text style={styles.expectedValue}>{action.confidence}</Text>
                    </View>

                    <View style={styles.secondaryFooter}>
                      <View style={styles.reviewBtn}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.reviewBtnText}>Requires Manual Review</Text>
                      </View>
                    </View>
                  </Card>
                );
              }
            })
          ) : (
            <View style={styles.emptyActionBox}>
              <Text style={styles.emptyActionText}>No actionable strategy adjustments compiled.</Text>
            </View>
          )}
        </View>
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
  grid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  // Primary Card Styles
  primaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainerPrimary: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  actionTitlePrimary: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  rationaleBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rationaleText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  rationaleLabel: {
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  impactItem: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  impactItemText: {
    flexDirection: 'column',
  },
  impactLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
    marginBottom: 2,
  },
  impactValuePrimary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
  },
  impactValueTertiary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.tertiary,
  },
  actionFooter: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  // Secondary Card Styles
  secondaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  iconContainerSecondary: {
    padding: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainer,
    marginRight: Spacing.sm,
  },
  actionTitleSecondary: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  systemTagSecondary: {
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  actionDescriptionSecondary: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  expectedBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  expectedLabel: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
  },
  expectedValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.secondary,
  },
  secondaryFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.xs,
  },
  reviewBtnText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: FontWeights.semibold,
  },
  
  // Empty State Styles
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
  emptyActionBox: {
    backgroundColor: Colors.surfaceContainer,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  emptyActionText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  }
});
