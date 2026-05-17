import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirm) {
      Alert.alert('Error', 'All fields required.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await signup(fullName, email, password);
    } catch (err) {
      Alert.alert('Signup Error', err.message);
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
                <MaterialIcons name="person-add" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.title}>Cognitive Kinetic</Text>
              <Text style={styles.subtitle}>Create your workspace account</Text>
            </View>
            
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Jane Doe" 
                    placeholderTextColor="rgba(148, 163, 184, 0.4)"
                    value={fullName} 
                    onChangeText={setFullName} 
                  />
                </View>
              </View>

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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ACCESS SECRET</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="••••••••••••" 
                    placeholderTextColor="rgba(148, 163, 184, 0.4)"
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM SECRET</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-clock" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="••••••••••••" 
                    placeholderTextColor="rgba(148, 163, 184, 0.4)"
                    value={confirm} 
                    onChangeText={setConfirm} 
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                    <MaterialIcons name={showConfirm ? "visibility-off" : "visibility"} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Sign up</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signupText}>Log in</Text>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4, paddingHorizontal: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, backgroundColor: '#0F172A', paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#ffffff', fontSize: 16 },
  eyeIcon: { padding: 4 },
  button: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', marginTop: 32, justifyContent: 'center' },
  footerText: { color: '#94a3b8', fontSize: 14 },
  signupText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 }
});
