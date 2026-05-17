import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';

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
            <Ionicons name="flask" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>No Action Selected</Text>
          <Text style={styles.emptySubtitle}>
            Select a recommended operational strategy to run in the simulation sandbox.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Actions')}
          >
            <Text style={styles.emptyButtonText}>View Recommendations</Text>
          </TouchableOpacity>
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
          isSuccess && { color: '#10b981', fontWeight: '700' },
          isTool && { color: '#3B82F6' }
        ]}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Stage Header */}
      <View style={styles.stageIndicatorRow}>
        <Text style={styles.stageTitle}>Ingestion → Insights → Impact → Actions → </Text>
        <Text style={styles.stageTitleActive}>Simulation Sandbox</Text>
      </View>

      {/* Action Target Details */}
      <View style={styles.actionDetailsCard}>
        <View style={styles.actionHeader}>
          <Text style={styles.targetLabel}>SANDBOX TARGET ENVIRONMENT</Text>
          <Text style={styles.targetVal}>{action.targetSystem}</Text>
        </View>
        
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionDesc}>{action.description}</Text>
      </View>

      {/* Live Sandbox Execution Status */}
      <View style={styles.sandboxCard}>
        <View style={styles.sandboxHeader}>
          <Text style={styles.sandboxTitle}>Sandbox Dispatch Engine</Text>
          <View style={styles.statusRow}>
            {isRunning ? (
              <>
                <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 6 }} />
                <Text style={[styles.statusText, { color: '#3B82F6' }]}>Executing Code Hooks...</Text>
              </>
            ) : (
              <>
                <View style={[styles.pulseDot, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.statusText, { color: '#10b981' }]}>Simulation Finalized</Text>
              </>
            )}
          </View>
        </View>
        
        {/* Terminal Screen */}
        <View style={styles.consoleCard}>
          <View style={styles.consoleHeader}>
            <View style={styles.terminalControls}>
              <View style={[styles.controlDot, { backgroundColor: '#FF5F56' }]} />
              <View style={[styles.controlDot, { backgroundColor: '#FFBD2E' }]} />
              <View style={[styles.controlDot, { backgroundColor: '#27C93F' }]} />
            </View>
            <Text style={styles.consoleHeaderText}>sandbox-execution.sh</Text>
          </View>
          
          <FlatList
            ref={logListRef}
            data={simLogs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            style={styles.logsList}
            contentContainerStyle={styles.logsListContent}
            ListEmptyComponent={
              <View style={styles.emptyLogsContainer}>
                <Text style={styles.emptyLogsText}>Initializing isolated environment...</Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Completion & Comparison Forward CTA */}
      {!isRunning && simulationResult && (
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => navigation.navigate('Comparison')}
        >
          <Text style={styles.compareButtonText}>Compare Before vs After State</Text>
          <Ionicons name="git-compare" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      )}

      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Base canvas L0
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F172A', // Navy L1 surface
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B', // Slate border
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6', // Solid Electric Blue
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stageIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stageTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  stageTitleActive: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  actionDetailsCard: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetVal: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '700',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionDesc: {
    color: '#c6c6cd',
    fontSize: 13,
    lineHeight: 18,
  },
  sandboxCard: {
    flex: 1,
    backgroundColor: '#0F172A', // Navy L1 surface
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sandboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sandboxTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  consoleCard: {
    flex: 1,
    backgroundColor: '#020617', // Deep Navy L0
    borderWidth: 1,
    borderColor: '#1E293B', // Slate border
    borderRadius: 8,
    overflow: 'hidden',
  },
  consoleHeader: {
    height: 32,
    backgroundColor: '#0F172A', // Navy L1 Surface
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  terminalControls: {
    flexDirection: 'row',
    marginRight: 16,
  },
  controlDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  consoleHeaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logsList: {
    flex: 1,
    padding: 12,
  },
  logsListContent: {
    paddingBottom: 24,
  },
  logLineRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  logTime: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 8,
    width: 65,
  },
  logMessage: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  emptyLogsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  compareButton: {
    backgroundColor: '#3B82F6', // Solid Electric Blue
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  compareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
