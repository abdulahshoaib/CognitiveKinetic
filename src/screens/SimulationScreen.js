import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';
import Colors from '../constants/colors';
import { Spacing } from '../constants/layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Header from '../components/common/Header';

export default function SimulationScreen({ route, navigation }) {
  const { action } = route.params || {};
  const { executeSimulation, simulationResult, executionLogs } = useAnalysis();
  const [isRunning, setIsRunning] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const logListRef = useRef(null);

  // Automatically start simulation on mount if action is valid
  useEffect(() => {
    if (action) {
      setIsRunning(true);
      const run = async () => {
        await executeSimulation(action);
        setIsRunning(false);
      };
      run();
    }
  }, [action]);

  // Scroll simulation logs to end
  useEffect(() => {
    if (logListRef.current && executionLogs.length > 0) {
      setTimeout(() => {
        logListRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [executionLogs]);

  if (!action) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="flask" size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Action Selected</Text>
          <Text style={styles.emptySubtitle}>
            Select a recommended operational strategy to run in the simulation sandbox.
          </Text>
          <Button
            label="View Recommendations"
            onPress={() => navigation.navigate('Actions')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Filter logs related to simulation and tools
  const simLogs = executionLogs.filter(
    log => log.stage === 'simulation' || log.stage === 'tool'
  );

  const renderLogItem = ({ item }) => {
    const isSuccess = item.level === 'success';
    const isTool = item.stage === 'tool';
    
    return (
      <View style={styles.logLineRow}>
        <Text style={styles.logTime}>{item.timestamp}</Text>
        <Text style={[
          styles.logMessage, 
          isSuccess && { color: Colors.successBright, fontWeight: '700' },
          isTool && { color: Colors.primary }
        ]}>
          {item.message}
        </Text>
      </View>
    );
  };

  const handleApproveAndDeploy = () => {
    navigation.navigate('Home', { showToast: true, toastMsg: 'New pricing configuration deployed live!' });
  };

  let totalBefore = 0;
  let totalAfter = 0;
  let variance = 0;

  if (simulationResult && simulationResult.beforeState && simulationResult.afterState) {
    const { beforeState, afterState } = simulationResult;
    totalBefore = beforeState.baseDeliveryFee + beforeState.longDistanceSurcharge + beforeState.peakHourSurcharge;
    totalAfter = afterState.baseDeliveryFee + afterState.longDistanceSurcharge + afterState.peakHourSurcharge;
    variance = totalAfter - totalBefore;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Test Your Action"
        subtitle="See the before and after state of applying this change."
        rightComponent={
          <Badge 
            label={isRunning ? 'Testing...' : 'Test Finished'} 
            variant={isRunning ? 'active' : 'success'} 
          />
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Simulation Scenario Objective */}
        <Card variant="surface" style={{ marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
            TESTING THIS CHANGE
          </Text>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
            {action.title}
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
            {isRunning 
              ? 'Testing the change in a safe playground environment...'
              : 'The test is complete. Below are the estimated differences in your delivery fees.'}
          </Text>
        </Card>

        {/* Execution Status Panel */}
        <Card variant="glass" style={{ marginBottom: Spacing.md }}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setShowLogs(!showLogs)}
            style={styles.panelHeaderRowToggle}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="terminal-outline" size={20} color={Colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.panelTitle}>Technical Logs</Text>
            </View>
            <Ionicons name={showLogs ? "chevron-up" : "chevron-down"} size={18} color={Colors.slateText} />
          </TouchableOpacity>
          
          {showLogs && (
            <View style={[styles.consoleCard, { marginTop: 12 }]}>
              <FlatList
                ref={logListRef}
                data={simLogs}
                renderItem={renderLogItem}
                keyExtractor={item => item.id}
                style={styles.logsList}
                contentContainerStyle={styles.logsListContent}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyLogsContainer}>
                    <Text style={styles.emptyLogsText}>Initializing isolated environment...</Text>
                  </View>
                }
              />
            </View>
          )}

          {!isRunning && (
            <View style={[styles.confidenceSection, { marginTop: showLogs ? 16 : 8 }]}>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>AI Test Accuracy</Text>
                <Badge label="High Accuracy" variant="high-impact" />
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '98.4%' }]} />
              </View>
            </View>
          )}
        </Card>

        {/* Before/After Comparison */}
        {!isRunning && simulationResult && (
          <View style={styles.comparisonContainer}>
            
            {/* Current State (Before) */}
            <Card variant="glass" style={styles.beforePanel}>
              <View style={styles.stateHeader}>
                <Text style={styles.stateTitle}>Before Change</Text>
                <Badge label="CURRENT" variant="neutral" />
              </View>
              
              <View style={styles.metricList}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Base Fee</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.baseDeliveryFee}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Long Distance Surcharge</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.longDistanceSurcharge}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Peak Hour Surcharge</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.peakHourSurcharge}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Estimated Price</Text>
                  <Text style={styles.totalVal}>Rs. {totalBefore}</Text>
                </View>
              </View>
            </Card>

            {/* Simulated State (After) */}
            <Card variant="glass" style={styles.afterPanel}>
              <View style={styles.glowOrb} />
              
              <View style={styles.stateHeader}>
                <Text style={[styles.stateTitle, { color: Colors.primary }]}>After Change</Text>
                <Badge label="NEW" variant="success" icon="sparkles" />
              </View>
              
              <View style={styles.metricList}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Base Fee</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.afterState.baseDeliveryFee}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Long Distance Surcharge</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {simulationResult.afterState.longDistanceSurcharge > simulationResult.beforeState.longDistanceSurcharge && (
                      <Ionicons name="trending-up" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[
                      styles.metricVal,
                      simulationResult.afterState.longDistanceSurcharge !== simulationResult.beforeState.longDistanceSurcharge && { color: Colors.primary }
                    ]}>
                      Rs. {simulationResult.afterState.longDistanceSurcharge}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Peak Hour Surcharge</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {simulationResult.afterState.peakHourSurcharge > simulationResult.beforeState.peakHourSurcharge && (
                      <Ionicons name="trending-up" size={12} color={Colors.primary} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[
                      styles.metricVal,
                      simulationResult.afterState.peakHourSurcharge !== simulationResult.beforeState.peakHourSurcharge && { color: Colors.primary }
                    ]}>
                      Rs. {simulationResult.afterState.peakHourSurcharge}
                    </Text>
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Estimated Price</Text>
                  <Text style={[styles.totalVal, { color: Colors.primary }]}>Rs. {totalAfter}</Text>
                </View>
              </View>
            </Card>
            
          </View>
        )}

        {/* Impact Summary & Actions */}
        {!isRunning && simulationResult && (
          <Card variant="glass" style={styles.impactSummaryPanel}>
            <View style={styles.impactHeader}>
              <View style={styles.impactIconWrap}>
                <Ionicons name="analytics" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.impactTextWrap}>
                <Text style={styles.impactTitle}>Margin Improvement</Text>
                <View style={styles.impactValueRow}>
                  <Text style={styles.impactValue}>+{((variance / totalBefore) * 100).toFixed(1)}%</Text>
                  <Ionicons name="arrow-up" size={20} color={Colors.successBright} />
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtonsRow}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => navigation.goBack()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Apply New Prices"
                  variant="primary"
                  onPress={handleApproveAndDeploy}
                  icon="checkmark-circle"
                />
              </View>
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 100,
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
    borderColor: Colors.outlineVariant,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  
  headerSection: {
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 32,
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  panelHeaderRowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  consoleCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderSubtle,
    borderRadius: 8,
    padding: Spacing.sm,
    minHeight: 120,
    maxHeight: 240,
  },
  logsList: {
    flexGrow: 0,
  },
  logsListContent: {
    paddingBottom: 4,
  },
  logLineRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  logTime: {
    color: Colors.outline,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: Spacing.xs,
    width: 65,
  },
  logMessage: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  emptyLogsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  emptyLogsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confidenceSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorderSubtle,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  confidenceLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  comparisonContainer: {
    flexDirection: 'column',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  beforePanel: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.outlineVariant,
    opacity: 0.9,
  },
  afterPanel: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primarySubtle,
  },
  stateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    zIndex: 2,
  },
  stateTitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  metricList: {
    zIndex: 2,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorderSubtle,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  metricVal: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  totalVal: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },

  impactSummaryPanel: {
    flexDirection: 'column',
    marginTop: Spacing.xs,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  impactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.surfaceBorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  impactTextWrap: {
    flex: 1,
  },
  impactTitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 2,
  },
  impactValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactValue: {
    color: Colors.successBright,
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
