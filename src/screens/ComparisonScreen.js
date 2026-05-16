import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import Colors from '../constants/colors';

/**
 * Feature 7: Before vs After State
 * - System state before action
 * - Updated state after simulation
 * - Visual diff (old price vs new price, etc.)
 * - Comparison dashboard
 */
export default function ComparisonScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Before vs After</Text>
        <Text style={styles.subtitle}>State comparison dashboard</Text>
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
