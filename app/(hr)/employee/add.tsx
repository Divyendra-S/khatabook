import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateEmployee } from '@/hooks/mutations/useOrganizationMutations';
import { useCurrentOrganization } from '@/hooks/queries/useOrganization';
import { UserRole } from '@/lib/types';
import DatePicker from '@/components/ui/DatePicker';

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const { data: organization } = useCurrentOrganization();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    phone: '',
    password: '',
    role: 'employee' as UserRole,
    department: '',
    designation: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });

  const createEmployeeMutation = useCreateEmployee(organization?.id || '', {
    onSuccess: () => {
      Alert.alert('Success', 'Employee added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to add employee');
    },
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.fullName.trim()) {
      Alert.alert('Error', 'Please enter employee name');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter email');
      return;
    }
    if (!formData.employeeId.trim()) {
      Alert.alert('Error', 'Please enter employee ID');
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!organization?.id) {
      Alert.alert('Error', 'Organization not found');
      return;
    }

    createEmployeeMutation.mutate({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      fullName: formData.fullName.trim(),
      employeeId: formData.employeeId.trim(),
      phone: formData.phone.trim() || undefined,
      department: formData.department.trim() || undefined,
      designation: formData.designation.trim() || undefined,
      role: formData.role,
      dateOfJoining: formData.dateOfJoining,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Employee</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter password (min 6 characters)"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
                placeholderTextColor="#94A3B8"
              />
            </View>
            <Text style={styles.helperText}>
              This password will be used for login
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Employee ID <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="badge-account-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter employee ID"
                value={formData.employeeId}
                onChangeText={(text) => setFormData({ ...formData, employeeId: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role & Department</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Role <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'employee' && styles.roleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'employee' })}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={formData.role === 'employee' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'employee' && styles.roleButtonTextActive,
                  ]}
                >
                  Employee
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.role === 'hr' && styles.roleButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'hr' })}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="shield-account"
                  size={20}
                  color={formData.role === 'hr' ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    formData.role === 'hr' && styles.roleButtonTextActive,
                  ]}
                >
                  HR
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="office-building-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter department"
                value={formData.department}
                onChangeText={(text) => setFormData({ ...formData, department: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Designation</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account-tie-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter designation"
                value={formData.designation}
                onChangeText={(text) => setFormData({ ...formData, designation: text })}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <DatePicker
            value={formData.dateOfJoining}
            onChange={(date) => setFormData({ ...formData, dateOfJoining: date })}
            label="Date of Joining"
            maximumDate={new Date()}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, createEmployeeMutation.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={createEmployeeMutation.isPending}
          activeOpacity={0.8}
        >
          {createEmployeeMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Add Employee</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    marginLeft: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
