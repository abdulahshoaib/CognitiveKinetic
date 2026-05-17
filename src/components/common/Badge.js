import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function Badge({ label, variant = 'neutral', style }) {
  let bgColor = 'rgba(148, 163, 184, 0.1)'; // default gray
  let borderColor = 'rgba(148, 163, 184, 0.2)';
  let textColor = '#94a3b8';
  let iconName = null;

  if (variant === 'success') {
    bgColor = 'rgba(16, 185, 129, 0.1)'; // emerald green opacity
    borderColor = 'rgba(16, 185, 129, 0.3)';
    textColor = '#10b981';
    iconName = 'checkmark-circle-outline';
  } else if (variant === 'risk') {
    bgColor = 'rgba(245, 158, 11, 0.1)'; // amber opacity
    borderColor = 'rgba(245, 158, 11, 0.3)';
    textColor = '#f59e0b';
    iconName = 'warning-outline';
  } else if (variant === 'active') {
    bgColor = 'rgba(59, 130, 246, 0.1)'; // electric blue opacity
    borderColor = 'rgba(59, 130, 246, 0.4)';
    textColor = '#3b82f6';
    iconName = 'pulse-outline';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }, style]}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={14}
          color={textColor}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 9999, // Pill shape from docs/DESIGN.md
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
