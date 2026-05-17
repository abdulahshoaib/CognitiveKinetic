import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function Badge({ label, variant = 'neutral', style, icon }) {
  let bgColor = Colors.accentSoft;
  let borderColor = Colors.controlBorder;
  let textColor = Colors.slateText;
  let iconName = icon || null;

  if (variant === 'success') {
    bgColor = Colors.successSoft;
    borderColor = Colors.successBorder;
    textColor = Colors.success;
    iconName = icon || 'checkmark-circle-outline';
  } else if (variant === 'risk') {
    bgColor = Colors.warningSoft;
    borderColor = Colors.warningBorder;
    textColor = Colors.warning;
    iconName = icon || 'warning-outline';
  } else if (variant === 'active') {
    bgColor = Colors.accentSoft;
    borderColor = Colors.accentBorder;
    textColor = Colors.accent;
    iconName = icon || 'pulse-outline';
  } else if (variant === 'relevant') {
    bgColor = Colors.secondaryContainer;
    borderColor = Colors.secondaryBorderSubtle;
    textColor = Colors.onSecondaryContainer;
  } else if (variant === 'ignored') {
    bgColor = Colors.surfaceDim;
    borderColor = Colors.outlineVariantMedium;
    textColor = Colors.onSurfaceVariant;
    iconName = icon || 'eye-off-outline';
  } else if (variant === 'high-impact') {
    bgColor = Colors.primaryContainer;
    borderColor = Colors.primaryBorderSubtle;
    textColor = Colors.onPrimaryContainer;
    iconName = icon || 'flash-outline';
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
