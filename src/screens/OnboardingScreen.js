import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSizes, FontWeights } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/layout';
import Colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { saveProfile } from '../services/profileService';
import Button from '../components/common/Button';

export default function OnboardingScreen({ navigation }) {
  const { user } = useAuth();
  
  // Profile Form State
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [locations, setLocations] = useState('');
  const [customers, setCustomers] = useState('');
  const [goals, setGoals] = useState('');
  const [concerns, setConcerns] = useState('');
  const [risks, setRisks] = useState('');
  const [riskSensitivity, setRiskSensitivity] = useState('balanced'); // conservative, balanced, aggressive
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveProfile(user.uid, {
        businessName,
        industry,
        locations,
        customers,
        goals,
        concerns,
        risks,
        riskSensitivity,
      });
      navigation.replace('Home'); // Replace so user can't go back to onboarding
    } catch (error) {
      console.error('Failed to save profile:', error);
      // In a real app, handle error display here
    } finally {
      setIsSaving(false);
    }
  };

  const OptionCard = ({ value, icon, title, description }) => {
    const isSelected = riskSensitivity === value;
    const isAggressive = value === 'aggressive';
    const isConservative = value === 'conservative';

    let iconColor = Colors.textSecondary;
    let titleColor = Colors.textPrimary;
    let borderColor = Colors.surfaceBorder;
    let bgColor = Colors.surfaceContainerLow;

    if (isSelected) {
      if (isAggressive) {
        iconColor = Colors.error;
        titleColor = Colors.error;
        borderColor = Colors.error;
        bgColor = Colors.dangerSoft;
      } else if (isConservative) {
        iconColor = Colors.accent;
        titleColor = Colors.accent;
        borderColor = Colors.accent;
        bgColor = Colors.accentSoft;
      } else {
        iconColor = Colors.accent;
        titleColor = Colors.accent;
        borderColor = Colors.accent;
        bgColor = Colors.accentSoft;
      }
    }

    return (
      <TouchableOpacity 
        style={[styles.radioCard, { borderColor, backgroundColor: bgColor }]}
        onPress={() => setRiskSensitivity(value)}
      >
        <Ionicons name={icon} size={24} color={iconColor} style={{ marginBottom: 8 }} />
        <Text style={[styles.radioTitle, { color: titleColor }]}>{title}</Text>
        <Text style={styles.radioDesc}>{description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={24} color={Colors.accent} />
            <Text style={styles.headerBrand}>Cognitive Kinetic</Text>
          </View>
          <Text style={styles.headerStep}>Step 1 of 1</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Context Initialization</Text>
            <Text style={styles.subtitle}>
              Please provide the foundational parameters for your agent. This one-time setup establishes the operational context, risk thresholds, and strategic objectives required for autonomous execution.
            </Text>
          </View>

          {/* Section: Identity & Scope */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Identity & Scope</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>BUSINESS ENTITY NAME</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g., Nexus Dynamics Corp" 
                    placeholderTextColor={Colors.outlineVariant}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>

              <View style={styles.inputContainerHalf}>
                <Text style={styles.label}>PRIMARY INDUSTRY</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="construct-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g., Manufacturing" 
                    placeholderTextColor={Colors.outlineVariant}
                    value={industry}
                    onChangeText={setIndustry}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>OPERATING JURISDICTIONS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="globe-outline" size={18} color={Colors.textSecondary} style={[styles.inputIcon, { top: 12, transform: [{ translateY: 0 }] }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="List key regions or countries of operation..." 
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={2}
                  value={locations}
                  onChangeText={setLocations}
                />
              </View>
            </View>
          </View>

          {/* Section: Strategic Parameters */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Strategic Parameters</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>TARGET DEMOGRAPHIC</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="people-outline" size={18} color={Colors.textSecondary} style={[styles.inputIcon, { top: 12, transform: [{ translateY: 0 }] }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Define primary customer segments or B2B profiles..." 
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={2}
                  value={customers}
                  onChangeText={setCustomers}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PRIMARY OBJECTIVES</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flag-outline" size={18} color={Colors.textSecondary} style={[styles.inputIcon, { top: 12, transform: [{ translateY: 0 }] }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Detail the immediate and long-term goals for agent optimization..." 
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={3}
                  value={goals}
                  onChangeText={setGoals}
                />
              </View>
            </View>
          </View>

          {/* Section: Risk & Constraints */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Risk & Constraints</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>OPERATIONAL CONCERNS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="warning-outline" size={18} color={Colors.textSecondary} style={[styles.inputIcon, { top: 12, transform: [{ translateY: 0 }] }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Identify immediate operational hurdles or bottlenecks..." 
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={2}
                  value={concerns}
                  onChangeText={setConcerns}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CRITICAL COSTS & RISKS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="trending-down-outline" size={18} color={Colors.textSecondary} style={[styles.inputIcon, { top: 12, transform: [{ translateY: 0 }] }]} />
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  placeholder="Outline specific financial or compliance risks..." 
                  placeholderTextColor={Colors.outlineVariant}
                  multiline
                  numberOfLines={2}
                  value={risks}
                  onChangeText={setRisks}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, { marginTop: Spacing.sm }]}>
              <Text style={styles.label}>AGENT AUTONOMY / RISK THRESHOLD</Text>
              <View style={styles.radioGroup}>
                <OptionCard 
                  value="conservative" 
                  icon="shield-checkmark-outline" 
                  title="Conservative" 
                  description="Requires explicit approval for execution." 
                />
                <OptionCard 
                  value="balanced" 
                  icon="scale-outline" 
                  title="Balanced" 
                  description="Autonomous within established parameters." 
                />
                <OptionCard 
                  value="aggressive" 
                  icon="flash-outline" 
                  title="Aggressive" 
                  description="Prioritizes speed; auto-executes high-variance tasks." 
                />
              </View>
            </View>
          </View>

          {/* Action Area */}
          <View style={styles.footer}>
            <Button
              label="Initialize Context"
              onPress={handleSave}
              variant="primary"
              icon="save-outline"
              style={isSaving ? { opacity: 0.7 } : {}}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceContainerLow,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrand: {
    color: Colors.accent,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginLeft: Spacing.sm,
    letterSpacing: -0.5,
  },
  headerStep: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100, // extra padding for scrolling
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.accent,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputContainerHalf: {
    width: '48%',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: Spacing.md,
    top: '50%',
    transform: [{ translateY: -9 }],
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    paddingVertical: Spacing.sm + 2,
    paddingRight: Spacing.sm,
    paddingLeft: 40,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'column',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  radioCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  radioTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  radioDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    alignItems: 'flex-end',
  },
});
