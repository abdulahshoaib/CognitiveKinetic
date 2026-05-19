import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { saveProfile } from '../services/profileService';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import ProfileForm from '../components/common/ProfileForm';
import SegmentedControl from '../components/preferences/SegmentedControl';
import ThemeSelector from '../components/preferences/ThemeSelector';
import ThemePreviewCard from '../components/preferences/ThemePreviewCard';
import SettingRow from '../components/preferences/SettingRow';
import { usePreferences } from '../context/PreferencesContext';
import Button from '../components/common/Button';
import { BRAND_NAME } from '../constants/brand';


export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { preferences, updatePreference, activeTheme } = usePreferences();
  const c = activeTheme.colors;
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [profileDataTemp, setProfileDataTemp] = useState(null);

  const handleNext = (profileData) => {
    setProfileDataTemp(profileData);
    setStep(2);
  };

  const handleCompleteSetup = async () => {
    if (!user?.uid || !profileDataTemp) return;

    setIsSaving(true);
    try {
      await saveProfile(user.uid, profileDataTemp);
      navigation.replace('Home'); // Home points to bottom tabs (Dashboard)
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.keyboardView, { backgroundColor: c.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={true}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>Welcome to {BRAND_NAME}</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {step === 1 
              ? "Set up your business profile. The agent will use this context for all future content analysis. You only need to do this once."
              : "Personalize your workspace. Tune your workspace visuals and agent behavior."}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {step === 1 ? (
            <ProfileForm 
              onSave={handleNext} 
              isSaving={isSaving} 
              submitLabel="Next: Personalization"
            />
          ) : (
            <View style={styles.personalizationContainer}>
              <ThemePreviewCard />

              <SettingRow 
                title="Theme Mode" 
                description="Choose the visual aesthetic of your workspace."
              >
                <ThemeSelector 
                  selected={preferences.themeMode}
                  onSelect={(val) => updatePreference('themeMode', val)}
                />
              </SettingRow>

              <SettingRow 
                title="Insight Style" 
                description="How agent insights are presented to you."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Simple', value: 'simple' },
                    { label: 'Detailed', value: 'detailed' },
                    { label: 'Technical', value: 'technical' }
                  ]}
                  selected={preferences.insightStyle}
                  onSelect={(val) => updatePreference('insightStyle', val)}
                />
              </SettingRow>

              <SettingRow 
                title="Motion & Feedback" 
                description="Control the speed and presence of UI animations."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Full', value: 'full' },
                    { label: 'Reduced', value: 'reduced' },
                    { label: 'Minimal', value: 'minimal' }
                  ]}
                  selected={preferences.motion}
                  onSelect={(val) => updatePreference('motion', val)}
                />
              </SettingRow>
              
              <SettingRow 
                title="Home Screen Focus" 
                description="What the dashboard prioritizes on load."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Latest Insight', value: 'latest-insight' },
                    { label: 'Action Queue', value: 'action-queue' },
                    { label: 'Progress', value: 'progress-summary' }
                  ]}
                  selected={preferences.homeFocus}
                  onSelect={(val) => updatePreference('homeFocus', val)}
                />
              </SettingRow>
              
              <SettingRow 
                title="Agent Transparency" 
                description="How much background processing is visible."
              >
                <SegmentedControl 
                  options={[
                    { label: 'Hidden', value: 'hidden' },
                    { label: 'Summary Only', value: 'summary-only' },
                    { label: 'Full Trace', value: 'full-trace' }
                  ]}
                  selected={preferences.agentTransparency}
                  onSelect={(val) => updatePreference('agentTransparency', val)}
                />
              </SettingRow>

              <Button 
                label="Complete Setup" 
                onPress={handleCompleteSetup} 
                loading={isSaving}
                style={{ marginTop: 24, marginBottom: 40 }}
              />
            </View>
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    marginBottom: 12,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  personalizationContainer: {
    marginTop: 10,
  }
});
