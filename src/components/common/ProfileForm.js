import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

export default function ProfileForm({ initialData, onSave, isSaving, submitLabel = "Save Profile" }) {
  const { activeTheme, preferences } = usePreferences();
  const c = activeTheme.colors;
  const spacing = 20;

  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    locations: '',
    keyConcerns: '',
    targetAudience: '',
    primaryGoal: '',
    riskSensitivity: 'Medium',
    enableAutoSim: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        businessName: initialData.businessName || '',
        industry: initialData.industry || '',
        locations: initialData.locations ? initialData.locations.join(', ') : '',
        keyConcerns: initialData.keyConcerns || '',
        targetAudience: initialData.targetAudience || '',
        primaryGoal: initialData.primaryGoal || '',
        riskSensitivity: initialData.riskSensitivity || 'Medium',
        enableAutoSim: initialData.enableAutoSim ?? true,
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      ...formData,
      locations: formData.locations.split(',').map(l => l.trim()).filter(Boolean),
    });
  };

  const renderInput = (label, field, placeholder, multiline = false) => (
    <View style={[styles.inputGroup, { marginBottom: spacing }]}>
      <Text style={[styles.label, { color: c.textPrimary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary },
          multiline && styles.inputMultiline,
        ]}
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        placeholder={placeholder}
        placeholderTextColor={c.placeholder}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: 16 }]}>
      {renderInput('Business Name', 'businessName', 'e.g. Apex Delivery')}
      {renderInput('Industry / Domain', 'industry', 'e.g. Logistics')}
      {renderInput('Operating Locations', 'locations', 'e.g. Lahore, Karachi (comma separated)')}
      {renderInput('Key Concerns', 'keyConcerns', 'e.g. High fuel costs, delivery margins', true)}
      {renderInput('Target Audience', 'targetAudience', 'e.g. E-commerce platforms, individual senders')}
      {renderInput('Primary Goal', 'primaryGoal', 'e.g. Reduce churn, improve delivery time')}
      
      <View style={[styles.inputGroup, { marginBottom: spacing }]}>
        <Text style={[styles.label, { color: c.textPrimary }]}>Risk Sensitivity</Text>
        <View style={styles.buttonGroup}>
          {['Low', 'Medium', 'High'].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.selectButton,
                { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder },
                formData.riskSensitivity === level && { backgroundColor: c.accentSoft, borderColor: c.accent },
              ]}
              onPress={() => handleChange('riskSensitivity', level)}
            >
              <Text style={[
                styles.selectButtonText,
                { color: formData.riskSensitivity === level ? c.accent : c.textSecondary },
              ]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.inputGroup, styles.switchRow, { marginBottom: spacing }]}>
        <View style={styles.switchTextContainer}>
          <Text style={[styles.label, { color: c.textPrimary }]}>Auto-Simulation</Text>
          <Text style={[styles.helpText, { color: c.textSecondary }]}>Allow agent to simulate actions automatically</Text>
        </View>
        <Switch
          value={formData.enableAutoSim}
          onValueChange={(val) => handleChange('enableAutoSim', val)}
          trackColor={{ false: c.surfaceVariant, true: c.accentSoft }}
          thumbColor={formData.enableAutoSim ? c.accent : c.textSecondary}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: c.accent }, isSaving && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color={c.white} size="small" />
        ) : (
          <>
            <Feather name="save" size={20} color={c.white} />
            <Text style={[styles.saveButtonText, { color: c.white }]}>{submitLabel}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: 8,
  },
  helpText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectButton: {
    flexGrow: 1,
    flexBasis: 88,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: 8,
  },
  selectButtonActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  selectButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  selectButtonTextActive: {
    color: Colors.accent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
