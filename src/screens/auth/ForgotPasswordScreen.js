import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Email required.');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email);
      Alert.alert('Success', 'Password reset email sent. Check your inbox.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <MaterialIcons name="lock-reset" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.title}>Cognitive Kinetic</Text>
              <Text style={styles.subtitle}>Reset your access secret</Text>
            </View>
            
            <View style={styles.form}>
              <Text style={styles.desc}>Enter your workspace email address and we'll send you a link to reset your password.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WORKSPACE EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="name@company.com" 
                    placeholderTextColor="rgba(148, 163, 184, 0.4)"
                    value={email} 
                    onChangeText={setEmail} 
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={20} color="#ffffff" style={styles.backIcon} />
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 32, paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 56, height: 56, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  form: { width: '100%', maxWidth: 420 },
  desc: { textAlign: 'center', marginBottom: 24, color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4, paddingHorizontal: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, backgroundColor: '#0F172A', paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 16 },
  button: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  footer: { marginTop: 32, alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backIcon: { marginRight: 8 },
  backText: { color: '#ffffff', fontWeight: '500', fontSize: 14 }
});
