import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { Spacing } from '../../constants/layout';

export default function Header({ title, subtitle, rightComponent, style }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContent}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {rightComponent && (
        <View style={styles.rightContent}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  subtitle: {
    color: Colors.slateText,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.white,
    fontSize: FontSizes['2xl'] + 2,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
});
