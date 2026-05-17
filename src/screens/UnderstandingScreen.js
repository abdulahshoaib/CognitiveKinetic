import React, { useRef, useEffect } from 'react';
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

// Import Reusable Design System Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';

const PIPELINE_STAGES = [
  { key: 'loading_profile', label: 'Load Saved Context', icon: 'shield' },
  { key: 'ingesting', label: 'Ingest Content Source', icon: 'cloud-upload' },
  { key: 'signals', label: 'Extract Threat Signals', icon: 'finger-print' },
  { key: 'relevance', label: 'Evaluate Saved Relevance', icon: 'git-compare' },
  { key: 'insights', label: 'Formulate Core Insights', icon: 'bulb' },
  { key: 'impact', label: 'Model Operational Impacts', icon: 'trending-down' },
  { key: 'actions', label: 'Design Strategy Actions', icon: 'flash' }
];

export default function UnderstandingScreen({ navigation }) {
  const { currentStage, executionLogs, isAnalyzing } = useAnalysis();
  const logListRef = useRef(null);

  // Automatically scroll logs to end
  useEffect(() => {
    if (logListRef.current && executionLogs.length > 0) {
      setTimeout(() => {
        logListRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [executionLogs]);

  const getStageIndex = (stageKey) => {
    if (stageKey === 'completed') return PIPELINE_STAGES.length;
    if (stageKey === 'idle') return -1;
    return PIPELINE_STAGES.findIndex(s => s.key === stageKey);
  };

  const currentStageIndex = getStageIndex(currentStage);

  const getStageStatus = (index) => {
    if (currentStage === 'completed') return 'completed';
    if (index < currentStageIndex) return 'completed';
    if (index === currentStageIndex) return 'active';
    return 'pending';
  };

  const renderLogItem = ({ item }) => {
    const getLevelColor = (level) => {
      if (level === 'success') return '#10b981';
      if (level === 'error') return '#ef4444';
      if (level === 'warning') return '#F59E0B';
      return '#ffffff';
    };

    return (
      <View style={styles.logLineRow}>
        <Text style={styles.logTime}>{item.timestamp}</Text>
        <Text style={[styles.logMessage, { color: getLevelColor(item.level) }]}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSpacer} />
      
      {/* Progress Track Section */}
      <Card variant="surface" style={{ marginBottom: 16 }}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Pipeline Orchestrator</Text>
          {isAnalyzing ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          )}
        </View>
        
        {/* Simple Progress Bar */}
        <View style={{ marginBottom: 20 }}>
          <ProgressBar 
            progress={Math.round(Math.max(10, ((currentStageIndex + 1) / PIPELINE_STAGES.length) * 100))} 
            showLabel={true}
          />
        </View>

        {/* Vertical Stages List */}
        <View style={styles.stagesContainer}>
          {PIPELINE_STAGES.map((stage, idx) => {
            const status = getStageStatus(idx);
            return (
              <View key={stage.key} style={styles.stageRow}>
                <View style={styles.stageIndicatorCol}>
                  <View style={[
                    styles.stageBullet,
                    status === 'completed' && styles.bulletCompleted,
                    status === 'active' && styles.bulletActive
                  ]}>
                    {status === 'completed' ? (
                      <Ionicons name="checkmark" size={12} color="#131315" />
                    ) : status === 'active' ? (
                      <View style={styles.pulseDot} />
                    ) : null}
                  </View>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <View style={[
                      styles.stageLine,
                      status === 'completed' && styles.lineCompleted
                    ]} />
                  )}
                </View>
                
                <Ionicons 
                  name={stage.icon} 
                  size={16} 
                  color={status === 'completed' ? '#10b981' : status === 'active' ? '#3B82F6' : '#909097'} 
                  style={{ marginHorizontal: 10 }}
                />
                
                <Text style={[
                  styles.stageLabelText,
                  status === 'completed' && styles.textCompleted,
                  status === 'active' && styles.textActive
                ]}>
                  {stage.label}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Terminal Log Console */}
      <View style={styles.consoleCard}>
        <View style={styles.consoleHeader}>
          <View style={styles.terminalControls}>
            <View style={[styles.controlDot, { backgroundColor: '#FF5F56' }]} />
            <View style={[styles.controlDot, { backgroundColor: '#FFBD2E' }]} />
            <View style={[styles.controlDot, { backgroundColor: '#27C93F' }]} />
          </View>
          <Text style={styles.consoleHeaderText}>agent-trace-logs.log</Text>
        </View>
        
        <FlatList
          ref={logListRef}
          data={executionLogs}
          renderItem={renderLogItem}
          keyExtractor={item => item.id}
          style={styles.logsList}
          contentContainerStyle={styles.logsListContent}
          ListEmptyComponent={
            <View style={styles.emptyLogsContainer}>
              <Text style={styles.emptyLogsText}>Initializing log stream...</Text>
            </View>
          }
        />
      </View>

      {/* Footer Navigation Trigger */}
      {currentStage === 'completed' && (
        <Button
          label="Proceed to Insight & Impact Report"
          onPress={() => navigation.navigate('Insights')}
          variant="primary"
          icon="arrow-forward"
          style={{ marginTop: 16 }}
        />
      )}
      
      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
  },
  headerSpacer: {
    height: 8,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stagesContainer: {
    paddingLeft: 8,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  stageIndicatorCol: {
    alignItems: 'center',
    width: 20,
    height: '100%',
    justifyContent: 'center',
  },
  stageBullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#909097', // Colors.outline
    backgroundColor: '#0F172A', // Colors.surface (Navy L1)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bulletCompleted: {
    borderColor: '#10b981', // Colors.success
    backgroundColor: '#10b981',
  },
  bulletActive: {
    borderColor: '#3B82F6', // Colors.primary
    backgroundColor: '#0F172A',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  stageLine: {
    position: 'absolute',
    top: 26,
    width: 2,
    height: 24,
    backgroundColor: '#1E293B', // Slate 1px border
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#10b981',
  },
  stageLabelText: {
    color: '#909097',
    fontSize: 13,
    fontWeight: '500',
  },
  textCompleted: {
    color: '#ffffff',
    fontWeight: '600',
  },
  textActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  consoleCard: {
    flex: 1,
    backgroundColor: '#020617', // Deep Navy L0
    borderWidth: 1,
    borderColor: '#1E293B', // Slate border
    borderRadius: 12,
    overflow: 'hidden',
  },
  consoleHeader: {
    height: 32,
    backgroundColor: '#0F172A', // Navy L1 surface
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
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  emptyLogsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    color: '#909097',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
