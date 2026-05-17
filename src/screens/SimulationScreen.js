import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Platform
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
          isSuccess && { color: '#81c995', fontWeight: '700' },
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Badge 
            label={isRunning ? 'SIMULATION RUNNING' : 'SIMULATION COMPLETE'} 
            variant={isRunning ? 'active' : 'success'} 
            icon={isRunning ? 'pulse-outline' : 'checkmark-circle'}
            style={{ marginBottom: Spacing.sm }}
          />
          <Text style={styles.headerTitle}>{action.title}</Text>
          <Text style={styles.headerSubtitle}>
            {isRunning 
              ? 'The agent is currently simulating the updated dynamic model within the sandbox.'
              : 'The agent has successfully simulated the updated dynamic model. Projected margin recovery calculated based on real-time data.'}
          </Text>
        </View>

        {/* Execution Status Panel */}
        <Card variant="glass" style={{ marginBottom: Spacing.md }}>
          <View style={styles.panelHeaderRow}>
            <Ionicons name="hardware-chip-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.panelTitle}>Execution Trace</Text>
          </View>
          
          <View style={styles.consoleCard}>
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

          {!isRunning && (
            <View style={styles.confidenceSection}>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>Confidence Score</Text>
                <Badge label="98.4%" variant="high-impact" />
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
                <Text style={styles.stateTitle}>Current Model</Text>
                <Badge label="BASELINE" variant="neutral" />
              </View>
              
              <View style={styles.metricList}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Base Fee</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.baseDeliveryFee}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Long Dist.</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.longDistanceSurcharge}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Peak Hour</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.beforeState.peakHourSurcharge}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Est.</Text>
                  <Text style={styles.totalVal}>Rs. {totalBefore}</Text>
                </View>
              </View>
            </Card>

            {/* Simulated State (After) */}
            <Card variant="glass" style={styles.afterPanel}>
              <View style={styles.glowOrb} />
              
              <View style={styles.stateHeader}>
                <Text style={[styles.stateTitle, { color: Colors.primary }]}>Simulated Model</Text>
                <Badge label="OPTIMIZED" variant="success" icon="sparkles" />
              </View>
              
              <View style={styles.metricList}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Base Fee</Text>
                  <Text style={styles.metricVal}>Rs. {simulationResult.afterState.baseDeliveryFee}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Long Dist.</Text>
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
                  <Text style={styles.metricLabel}>Peak Hour</Text>
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
                  <Text style={styles.totalLabel}>Total Est.</Text>
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
                <Ionicons name="analytics" size={24} color="#b9c7e0" />
              </View>
              <View style={styles.impactTextWrap}>
                <Text style={styles.impactTitle}>Projected Margin Recovery</Text>
                <View style={styles.impactValueRow}>
                  <Text style={styles.impactValue}>+{((variance / totalBefore) * 100).toFixed(1)}%</Text>
                  <Ionicons name="arrow-up" size={20} color="#81c995" />
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtonsRow}>
              <View style={{ flex: 1 }}>
                <Button
                  label="Discard"
                  variant="outline"
                  onPress={() => navigation.goBack()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Deploy Model"
                  variant="primary"
                  onPress={handleApproveAndDeploy}
                  icon="rocket"
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
  panelTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  consoleCard: {
    backgroundColor: '#0e0e10',
    borderWidth: 1,
    borderColor: 'rgba(144, 144, 151, 0.2)',
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
    borderTopColor: 'rgba(144, 144, 151, 0.2)',
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
    backgroundColor: 'rgba(190, 198, 224, 0.08)',
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
    borderBottomColor: 'rgba(144, 144, 151, 0.2)',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  metricVal: {
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
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
    borderColor: 'rgba(144, 144, 151, 0.2)',
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
    color: '#81c995',
    fontSize: 24,
    fontWeight: '700',
    marginRight: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
