import { StyleSheet, View } from 'react-native';
import Colors from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/layout';

export default function Card({ children, style, variant = 'surface', active = false }) {
  return (
    <View style={[
      styles.card,
      variant === 'glass' ? styles.glass : styles.surface,
      active && styles.activeGlow,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, // Exact 12px from docs/DESIGN.md
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: Colors.shadowSolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  surface: {
    backgroundColor: Colors.l1Surface,
    borderColor: Colors.l1Border,
  },
  glass: {
    backgroundColor: Colors.l2Surface,
    borderColor: Colors.l2Border,
  },
  activeGlow: {
    borderColor: Colors.accent, // Electric Blue active ring
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
