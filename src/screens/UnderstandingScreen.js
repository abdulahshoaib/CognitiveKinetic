import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysis } from '../context/AnalysisContext';

// Import Reusable Design System Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';
import Header from '../components/common/Header';
import Colors from '../constants/colors';

const PIPELINE_STAGES = [
  { key: 'loading_profile', label: 'Loading Saved Profile', desc: 'Reading your custom settings.', icon: 'shield-checkmark' },
  { key: 'ingesting', label: 'Reading News Content', desc: 'Loading target news article.', icon: 'cloud-download' },
  { key: 'signals', label: 'Finding Key Facts', desc: 'Extracting important names, numbers, and facts.', icon: 'hardware-chip' },
  { key: 'relevance', label: 'Checking Relevance', desc: 'Checking if this affects your business.', icon: 'git-compare' },
  { key: 'insights', label: 'Generating Insights', desc: 'Figuring out what this means for your daily work.', icon: 'bulb' },
  { key: 'impact', label: 'Analyzing Impact', desc: 'Calculating specific business changes.', icon: 'analytics' },
  { key: 'actions', label: 'Recommending Actions', desc: 'Creating step-by-step suggestions.', icon: 'flash' }
];

export default function UnderstandingScreen({ navigation }) {
  const { currentStage, executionLogs, isAnalyzing } = useAnalysis();
  const logListRef = useRef(null);
  const [showLogs, setShowLogs] = React.useState(false);

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
      if (level === 'success') return Colors.success; // emerald-500
      if (level === 'error') return Colors.error; // error
      if (level === 'warning') return Colors.warning; // warning
      if (level === 'important') return Colors.primary; // primary-fixed-dim
      return Colors.textPrimary; // on-surface
    };
    
    const getLevelIcon = (level) => {
      if (level === 'success') return 'checkmark-circle';
      if (level === 'error') return 'close-circle';
      if (level === 'warning') return 'warning';
      if (level === 'important') return 'flash';
      return 'information-circle';
    };

    const isImportant = item.level === 'important';

    return (
      <View style={[
        styles.logLineRow,
        isImportant && styles.logLineImportant
      ]}>
        <Text style={styles.logTime}>{item.timestamp}</Text>
        <Ionicons 
          name={getLevelIcon(item.level)} 
          size={16} 
          color={getLevelColor(item.level)} 
          style={{ marginRight: 8, marginTop: 1 }}
        />
        <Text style={[styles.logMessage, { color: getLevelColor(item.level), fontWeight: isImportant ? '700' : '400' }]}>
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Analyzing Updates"
        subtitle="The AI agent is finding matches and calculating business impact..."
      />
      
      {/* Progress Track Section */}
      <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressTitle}>Analysis Steps</Text>
          <Text style={styles.progressSubtitle}>Cognitive Kinetic is running your custom analysis workflow.</Text>
        </View>

        {/* Vertical Stages List */}
        <View style={styles.stagesContainer}>
          {/* Vertical Line Background */}
          <View style={styles.absoluteVerticalLine} />
          
          {PIPELINE_STAGES.map((stage, idx) => {
            const status = getStageStatus(idx);
            return (
              <View 
                key={stage.key} 
                style={[
                  styles.stageRow,
                  status === 'pending' && { opacity: 0.5 }
                ]}
              >
                <View style={styles.stageIndicatorCol}>
                  <View style={[
                    styles.stageBullet,
                    status === 'completed' && styles.bulletCompleted,
                    status === 'active' && styles.bulletActive
                  ]}>
                    {status === 'completed' ? (
                      <Ionicons name="checkmark" size={16} color={Colors.accent} />
                    ) : status === 'active' ? (
                      <ActivityIndicator size="small" color={Colors.accent} style={{ transform: [{ scale: 0.7 }] }} />
                    ) : (
                      <Ionicons name={stage.icon} size={14} color={Colors.textSecondary} />
                    )}
                  </View>
                </View>
                
                <View style={styles.stageTextContainer}>
                  <Text style={[
                    styles.stageLabelText,
                    status === 'completed' && styles.textCompleted,
                    status === 'active' && styles.textActive
                  ]}>
                    {stage.label}
                  </Text>
                  <Text style={styles.stageDescText}>{stage.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Terminal Log Console */}
      {!showLogs ? (
        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.toggleLogsButton}
          onPress={() => setShowLogs(true)}
        >
          <Ionicons name="terminal-outline" size={16} color={Colors.slateText} style={{ marginRight: 8 }} />
          <Text style={styles.toggleLogsText}>Show Technical Logs</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.slateText} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      ) : (
        <View style={styles.consoleCard}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setShowLogs(false)}
            style={styles.consoleHeader}
          >
            <View style={styles.consoleHeaderLeft}>
              <Ionicons name="terminal" size={16} color={Colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.consoleHeaderText}>LIVE AGENT TRACE</Text>
            </View>
            <View style={styles.liveIndicator}>
              <Ionicons name="chevron-up" size={16} color={Colors.slateText} style={{ marginRight: 8 }} />
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </TouchableOpacity>
          
          <FlatList
            ref={logListRef}
            data={executionLogs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            style={styles.logsList}
            contentContainerStyle={styles.logsListContent}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={
              <View style={styles.emptyLogsContainer}>
                <Text style={styles.emptyLogsText}>Initializing log stream...</Text>
              </View>
            }
          />
          
          {/* Fake Gradient overlay at bottom to suggest scrolling */}
          <View style={styles.consoleBottomGradient} />
        </View>
      )}

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
    backgroundColor: Colors.background,
    padding: 16,
  },
  headerSpacer: {
    height: 8,
  },
  progressHeaderRow: {
    flexDirection: 'column',
    marginBottom: 20,
    backgroundColor: Colors.surfaceBorder,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  progressTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  progressSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  stagesContainer: {
    paddingLeft: 8,
    position: 'relative',
  },
  absoluteVerticalLine: {
    position: 'absolute',
    left: 23,
    top: 16,
    bottom: 24,
    width: 2,
    backgroundColor: Colors.surfaceBorder, // Outline variant
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    zIndex: 10,
  },
  stageIndicatorCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  stageBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant, // Outline variant
    backgroundColor: Colors.primaryContainer, // Surface
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulletCompleted: {
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.primaryContainer,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bulletActive: {
    borderColor: Colors.accent, // Primary
    backgroundColor: Colors.surfaceBorder, // Primary container approx
    borderWidth: 2,
  },
  stageTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  stageLabelText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stageDescText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  textCompleted: {
    color: Colors.textPrimary,
  },
  textActive: {
    color: Colors.accent,
  },
  consoleCard: {
    flex: 1,
    minHeight: 300,
    backgroundColor: Colors.surfaceContainerLowest, // Slightly darker than surface for terminal
    borderWidth: 1,
    borderColor: Colors.surfaceBorder, // Outline variant
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadowSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  consoleHeader: {
    height: 44,
    backgroundColor: Colors.surfaceContainerLowTranslucent, // Surface container low
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  consoleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consoleHeaderText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success, // Emerald 500
    marginRight: 6,
  },
  liveText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logsList: {
    flex: 1,
    padding: 12,
  },
  logsListContent: {
    paddingBottom: 40,
  },
  logLineRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    padding: 4,
    borderRadius: 4,
  },
  logLineImportant: {
    backgroundColor: Colors.accentSoft,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent, // Primary
    paddingLeft: 8,
  },
  logTime: {
    color: Colors.outline, // Outline
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 12,
    width: 75,
  },
  logMessage: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 18,
  },
  consoleBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: Colors.transparent,
    // We would use a LinearGradient here ideally, but for now we'll just omit it or use a translucent view
    backgroundColor: Colors.terminalOverlay,
  },
  emptyLogsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyLogsText: {
    color: Colors.outline,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  toggleLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  toggleLogsText: {
    color: Colors.slateText,
    fontSize: 14,
    fontWeight: '600',
  },
});
