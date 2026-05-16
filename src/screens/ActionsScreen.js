import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 5: Action Recommendation
 * - Domain-relevant recommended actions
 * - Ranked by priority and expected effectiveness
 * - Explanations for each recommendation
 */
export default function ActionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Recommended Actions</Text>
        <Text style={styles.subtitle}>Actions ranked by priority</Text>
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
