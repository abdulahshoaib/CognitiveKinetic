import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/colors';

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
                <MaterialIcons name="lock-reset" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.title}>Cognitive Kinetic</Text>
              <Text style={styles.subtitle}>Reset your access secret</Text>
            </View>
            
            <View style={styles.form}>
              <Text style={styles.desc}>Enter your workspace email address and we'll send you a link to reset your password.</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WORKSPACE EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="mail" size={20} color={Colors.slateText} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="name@company.com" 
                    placeholderTextColor={Colors.placeholder}
                    value={email} 
                    onChangeText={setEmail} 
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              
              <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={20} color={Colors.white} style={styles.backIcon} />
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
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { paddingHorizontal: 32, paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 56, height: 56, backgroundColor: Colors.l1Surface, borderWidth: 1, borderColor: Colors.l1Border, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.white, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.slateText },
  form: { width: '100%', maxWidth: 420 },
  desc: { textAlign: 'center', marginBottom: 24, color: Colors.slateText, fontSize: 14, lineHeight: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: Colors.slateText, letterSpacing: 0.5, marginBottom: 4, paddingHorizontal: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.l1Border, borderRadius: 12, backgroundColor: Colors.l1Surface, paddingHorizontal: 16, height: 48 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.white, fontSize: 16 },
  button: { backgroundColor: Colors.accent, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  footer: { marginTop: 32, alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  backIcon: { marginRight: 8 },
  backText: { color: Colors.white, fontWeight: '500', fontSize: 14 }
});
