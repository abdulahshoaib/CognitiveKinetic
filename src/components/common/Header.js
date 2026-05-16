import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

export default function Header({ title, subtitle }) {
  return (
    <View style={styles.container}>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing['3xl'] },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.extrabold,
    letterSpacing: -0.5,
  },
});
