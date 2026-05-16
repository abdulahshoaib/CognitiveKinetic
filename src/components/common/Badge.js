import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function Badge({ label, color = Colors.success }) {
  return (
    <View style={[styles.badge, { borderColor: `${color}50`, backgroundColor: `${color}15` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
});
