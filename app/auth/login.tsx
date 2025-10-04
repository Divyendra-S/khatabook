import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useSignIn } from '@/hooks/mutations/useAuthMutations';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signInMutation = useSignIn({
    onSuccess: () => {
      // Navigation is handled by root layout based on user role
    },
    onError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    signInMutation.mutate({ email, password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="clipboard-text" size={48} color="#6366F1" />
          </View>
          <Text style={styles.title}>Salary Book</Text>
          <Text style={styles.subtitle}>Attendance & Salary Management</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!signInMutation.isPending}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!signInMutation.isPending}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, signInMutation.isPending && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={signInMutation.isPending}
          >
            <Text style={styles.buttonText}>
              {signInMutation.isPending ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          <Link href="/auth/signup" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <MaterialCommunityIcons name="account-plus-outline" size={20} color="#6366F1" />
              <Text style={styles.secondaryButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: '#0F172A',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});
