import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 9: Agent Trace Viewer
 * - Autonomous workflow steps
 * - Workplan, task breakdown, extracted facts
 * - Generated insights, reasoning, execution result
 * - Full transparency for evaluation
 */
export default function AgentTraceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Agent Trace</Text>
        <Text style={styles.subtitle}>Workflow steps and reasoning</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center' },
});
