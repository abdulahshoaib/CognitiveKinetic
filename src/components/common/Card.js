import { StyleSheet, View } from 'react-native';
import Colors from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/layout';

export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
});
