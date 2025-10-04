import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSignUp } from '@/hooks/mutations/useAuthMutations';

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    employeeId: '',
    phone: '',
    role: 'employee' as 'employee' | 'hr',
  });

  const signUpMutation = useSignUp({
    onSuccess: () => {
      Alert.alert(
        'Success',
        'Account created successfully! Please login.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    },
    onError: (error: any) => {
      console.error('===== SIGNUP ERROR IN UI =====');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('==============================');

      const errorMessage = error?.message || 'An unknown error occurred';
      const errorDetails = error?.status ? `\n\nStatus: ${error.status}` : '';

      Alert.alert('Signup Failed', errorMessage + errorDetails);
    },
  });

  const handleSignup = () => {
    if (!formData.email || !formData.password || !formData.fullName || !formData.employeeId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    signUpMutation.mutate({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      employeeId: formData.employeeId,
      phone: formData.phone || undefined,
      role: formData.role,
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our team</Text>

          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleSectionTitle}>Select Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'employee' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'employee' }))}
                  disabled={signUpMutation.isPending}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={32}
                    color={formData.role === 'employee' ? '#6366F1' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'employee' && styles.roleButtonTextActive,
                    ]}
                  >
                    Employee
                  </Text>
                  {formData.role === 'employee' && (
                    <View style={styles.roleCheckmark}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#6366F1" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.role === 'hr' && styles.roleButtonActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, role: 'hr' }))}
                  disabled={signUpMutation.isPending}
                >
                  <MaterialCommunityIcons
                    name="shield-account"
                    size={32}
                    color={formData.role === 'hr' ? '#6366F1' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      formData.role === 'hr' && styles.roleButtonTextActive,
                    ]}
                  >
                    HR / Admin
                  </Text>
                  {formData.role === 'hr' && (
                    <View style={styles.roleCheckmark}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#6366F1" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              editable={!signUpMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Employee ID *"
              value={formData.employeeId}
              onChangeText={(value) => updateField('employeeId', value)}
              editable={!signUpMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!signUpMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              editable={!signUpMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Password *"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              editable={!signUpMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              editable={!signUpMutation.isPending}
            />

            <TouchableOpacity
              style={[styles.button, signUpMutation.isPending && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={signUpMutation.isPending}
            >
              <Text style={styles.buttonText}>
                {signUpMutation.isPending ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
              disabled={signUpMutation.isPending}
            >
              <Text style={styles.linkText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#64748B',
  },
  form: {
    width: '100%',
  },
  roleSection: {
    marginBottom: 24,
  },
  roleSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  roleButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  roleButtonTextActive: {
    color: '#6366F1',
  },
  roleCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
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
});
