import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { Spacing } from '../../constants/layout';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function Button({ label, onPress, variant = 'primary', icon, style, labelStyle }) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : isSecondary ? styles.secondary : styles.ghost,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isPrimary ? '#ffffff' : Colors.onSurface}
            style={styles.icon}
          />
        )}
        <Text style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          labelStyle
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8, // Precision 8px from docs/DESIGN.md
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  primary: {
    backgroundColor: '#3B82F6', // Solid Electric Blue from docs/DESIGN.md
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#1E293B', // Slate-800 background from docs/DESIGN.md L2/Secondary
    borderColor: 'rgba(255, 255, 255, 0.1)', // 1px subtle border
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    fontSize: FontSizes.base - 1,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
  primaryText: { color: '#ffffff' },
  secondaryText: { color: '#e4e2e4' }, // on-surface
});
