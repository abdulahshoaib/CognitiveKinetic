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
      {showLabel && <Text style={styles.label}>{pct}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 4,
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
});
