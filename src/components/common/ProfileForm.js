import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { FontSizes, FontWeights } from '../../constants/typography';
import { usePreferences } from '../../context/PreferencesContext';

// Only import GooglePlacesAutocomplete on native platforms
let GooglePlacesAutocomplete;
if (Platform.OS !== 'web') {
  try {
    GooglePlacesAutocomplete = require('react-native-google-places-autocomplete').GooglePlacesAutocomplete;
  } catch (e) {
    console.warn('GooglePlacesAutocomplete not available');
    GooglePlacesAutocomplete = null;
  }
}


export default function ProfileForm({ initialData, onSave, isSaving, submitLabel = "Save Profile" }) {
  const { activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const spacing = 20;

  const [formData, setFormData] = useState({
    businessName: '',
    industry: '',
    locations: [],
    keyConcerns: '',
    targetAudience: '',
    primaryGoal: '',
    riskSensitivity: 'Medium',
    enableAutoSim: true,
  });

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  useEffect(() => {
    if (initialData) {
      let parsedLocations = [];
      if (initialData.locations) {
        if (Array.isArray(initialData.locations)) {
          parsedLocations = initialData.locations;
        } else if (typeof initialData.locations === 'string') {
          parsedLocations = initialData.locations.split(',').map(l => l.trim()).filter(Boolean);
        }
      }

      setFormData({
        businessName: initialData.businessName || '',
        industry: initialData.industry || '',
        locations: parsedLocations,
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

  const addLocation = (name) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    
    // Split by comma in case multiple locations are input together (e.g., Lahore, Karachi, Islamabad)
    const newLocs = cleanName.split(',').map(l => l.trim()).filter(Boolean);
    if (newLocs.length === 0) return;
    
    const currentLocs = Array.isArray(formData.locations) ? formData.locations : [];
    const updatedLocs = [...currentLocs];
    
    newLocs.forEach(loc => {
      if (!updatedLocs.some(existing => existing.toLowerCase() === loc.toLowerCase())) {
        updatedLocs.push(loc);
      }
    });
    
    handleChange('locations', updatedLocs);
    setLocationModalVisible(false);
  };

  const removeLocation = (nameToRemove) => {
    const currentLocs = Array.isArray(formData.locations) ? formData.locations : [];
    handleChange('locations', currentLocs.filter(loc => loc !== nameToRemove));
  };

  const handleSave = () => {
    const businessName = (formData.businessName || '').trim();
    const industry = (formData.industry || '').trim();
    const keyConcerns = (formData.keyConcerns || '').trim();
    const targetAudience = (formData.targetAudience || '').trim();
    const primaryGoal = (formData.primaryGoal || '').trim();
    const parsedLocations = Array.isArray(formData.locations) ? formData.locations : [];

    if (!businessName) {
      Alert.alert('Required Field', 'Business Name is required.');
      return;
    }
    if (!industry) {
      Alert.alert('Required Field', 'Industry / Domain is required.');
      return;
    }
    if (parsedLocations.length === 0) {
      Alert.alert('Required Field', 'Operating Locations is required. Please select or add at least one.');
      return;
    }
    if (!keyConcerns) {
      Alert.alert('Required Field', 'Key Concerns is required.');
      return;
    }
    if (!targetAudience) {
      Alert.alert('Required Field', 'Target Audience is required.');
      return;
    }
    if (!primaryGoal) {
      Alert.alert('Required Field', 'Primary Goal is required.');
      return;
    }

    onSave({
      ...formData,
      businessName,
      industry,
      locations: parsedLocations,
      keyConcerns,
      targetAudience,
      primaryGoal,
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

  const renderLocationsSelector = () => {
    const currentLocs = Array.isArray(formData.locations) ? formData.locations : [];

    return (
      <View style={[styles.inputGroup, { marginBottom: spacing, zIndex: 100 }]}>
        <Text style={[styles.label, { color: c.textPrimary }]}>Operating Locations</Text>
        
        {/* Selected Location Chips */}
        {currentLocs.length > 0 && (
          <View style={styles.chipsContainer}>
            {currentLocs.map(loc => (
              <View key={loc} style={[styles.chip, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
                <Text style={[styles.chipText, { color: c.textPrimary }]}>{loc}</Text>
                <TouchableOpacity onPress={() => removeLocation(loc)} style={styles.chipRemoveBtn}>
                  <Feather name="x" size={14} color={c.accent} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.locationPickerButton, { backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder }]}
          onPress={() => setLocationModalVisible(true)}
        >
          <Text style={[styles.locationPickerText, { color: c.textSecondary }]}>
            Search or enter any global location...
          </Text>
          <Feather name="search" size={18} color={c.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={locationModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setLocationModalVisible(false)}
        >
          <View style={[styles.locationModal, { backgroundColor: c.background }]}>
            <View style={[styles.locationModalHeader, { borderBottomColor: c.surfaceBorder }]}>
              <Text style={[styles.locationModalTitle, { color: c.textPrimary }]}>Add Operating Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.locationCloseButton}>
                <Feather name="x" size={22} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Manual entry fallback option */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.label, { color: c.textPrimary, marginBottom: 8 }]}>Enter Location Manually</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, backgroundColor: c.surfaceContainerLowest, borderColor: c.surfaceBorder, color: c.textPrimary, height: 48, paddingVertical: 0 }
                  ]}
                  value={manualLocation}
                  onChangeText={setManualLocation}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  placeholderTextColor={c.placeholder}
                  onSubmitEditing={() => {
                    if (manualLocation.trim()) {
                      addLocation(manualLocation.trim());
                      setManualLocation('');
                    }
                  }}
                />
                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 0, paddingHorizontal: 20, paddingVertical: 0, justifyContent: 'center', height: 48, borderRadius: 8 }]}
                  onPress={() => {
                    if (manualLocation.trim()) {
                      addLocation(manualLocation.trim());
                      setManualLocation('');
                    }
                  }}
                >
                  <Text style={{ color: c.white, fontWeight: 'bold' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ borderBottomWidth: 1, borderBottomColor: c.surfaceBorder, marginVertical: 16 }} />

            {GooglePlacesAutocomplete && Platform.OS !== 'web' && (
              <>
                <Text style={[styles.label, { color: c.textPrimary, marginBottom: 8 }]}>Search Google Places</Text>
                <GooglePlacesAutocomplete
                  placeholder="Search city, region, or country"
                  onPress={(data) => addLocation(data.description)}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '',
                    language: 'en',
                    types: 'geocode',
                  }}
                  enablePoweredByContainer={false}
                  fetchDetails={false}
                  keyboardShouldPersistTaps="handled"
                  textInputProps={{
                    placeholderTextColor: c.placeholder,
                    returnKeyType: 'search',
                  }}
                  styles={{
                    container: styles.placesContainer,
                    textInput: [
                      styles.autocompleteInput,
                      {
                        backgroundColor: c.surfaceContainerLowest,
                        borderColor: c.surfaceBorder,
                        color: c.textPrimary,
                      },
                    ],
                    listView: [
                      styles.placesList,
                      {
                        backgroundColor: c.surfaceContainerLowest,
                        borderColor: c.surfaceBorder,
                      },
                    ],
                    row: [styles.autocompleteRow, { borderBottomColor: c.surfaceBorder }],
                    description: { color: c.textPrimary, fontSize: FontSizes.sm },
                  }}
                />
              </>
            )}
            {Platform.OS === 'web' && (
              <Text style={[styles.label, { color: c.textSecondary, fontSize: FontSizes.xs, marginTop: 8 }]}>
                (Enter multiple locations separated by commas)
              </Text>
            )}
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerLow, borderColor: c.surfaceBorder, padding: 16 }]}>
      {renderInput('Business Name', 'businessName', 'e.g. Apex Delivery')}
      {renderInput('Industry / Domain', 'industry', 'e.g. Logistics')}
      
      {/* Dynamic Search Combobox locations selector */}
      {renderLocationsSelector()}
      
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
  selectButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
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
  
  // Custom Locations Selector Combobox Styles
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
  chipRemoveBtn: {
    marginLeft: 6,
    padding: 2,
  },
  autocompleteContainer: {
    width: '100%',
    zIndex: 1000,
  },
  locationPickerButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationPickerText: {
    flex: 1,
    fontSize: FontSizes.md,
  },
  locationModal: {
    flex: 1,
    padding: 16,
  },
  locationModalHeader: {
    minHeight: 52,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  locationCloseButton: {
    padding: 8,
  },
  placesContainer: {
    flex: 0,
    width: '100%',
  },
  autocompleteInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: FontSizes.md,
  },
  placesList: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  autocompleteList: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 2000,
    maxHeight: 200,
  },
  autocompleteRow: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionMain: {
    flex: 1,
    paddingRight: 12,
  },
  suggestionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  suggestionMeta: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
});
