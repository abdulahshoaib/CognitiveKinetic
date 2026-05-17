import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';

export default function EmptyState({ icon = 'document-text-outline', title, description, primaryAction, primaryActionTitle }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={Colors.primaryFixedDim} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      
      {primaryAction && primaryActionTitle && (
        <TouchableOpacity style={styles.button} onPress={primaryAction}>
          <Text style={styles.buttonText}>{primaryActionTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
  },
});
