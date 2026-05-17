import { StyleSheet, View, Text } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

export default function ProgressBar({ progress = 0, showLabel = true }) {
  const pct = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      {showLabel && <Text style={styles.label}>{Math.round(pct)}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E293B', // Slate-800 track background
    borderRadius: 999,
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3B82F6', // Solid Electric Blue from docs/DESIGN.md
    borderRadius: 999,
  },
  label: {
    color: '#94a3b8', // slate textSecondary
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    fontFamily: 'System', // fall back to clean monospaced font if needed
    minWidth: 32,
    textAlign: 'right',
  },
});
