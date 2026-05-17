import React, { useState } from 'react';
import { StyleSheet, View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { saveProfile } from '../services/profileService';
import Colors from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';
import Screen from '../components/common/Screen';
import ProfileForm from '../components/common/ProfileForm';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (profileData) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await saveProfile(user.uid, profileData);
      navigation.replace('Home'); // Home points to bottom tabs (Dashboard)
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardView} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll={true}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to CognitiveKinetic</Text>
          <Text style={styles.subtitle}>
            Set up your business profile. The agent will use this context for all future content analysis. You only need to do this once.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ProfileForm onSave={handleSaveProfile} isSaving={isSaving} />
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
  },
});
