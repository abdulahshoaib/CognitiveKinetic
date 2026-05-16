import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Colors from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function Button({ label, onPress, variant = 'primary', style }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.button, isPrimary ? styles.primary : styles.secondary, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg + 2,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  text: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  primaryText: { color: Colors.background },
  secondaryText: { color: Colors.textPrimary },
});
