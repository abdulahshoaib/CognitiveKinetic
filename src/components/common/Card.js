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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  surface: {
    backgroundColor: '#0F172A', // Navy L1 surface
    borderColor: '#1E293B', // Slate 1px border
  },
  glass: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Slate-800 with 60% opacity (L2)
    borderColor: 'rgba(30, 41, 59, 0.8)',
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
