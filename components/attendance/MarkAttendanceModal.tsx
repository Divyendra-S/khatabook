import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAllUsers } from '@/hooks/queries/useUser';
import { useMarkAttendance, useUpdateAttendance } from '@/hooks/mutations/useAttendanceMutations';
import { AttendanceRecord, User } from '@/lib/types';

interface MarkAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  existingRecord?: AttendanceRecord;
  employeeId?: string;
}

export default function MarkAttendanceModal({
  visible,
  onClose,
  existingRecord,
  employeeId,
}: MarkAttendanceModalProps) {
  const { user } = useAuth();
  const { data: employees } = useAllUsers({ role: 'employee' });
  const [formData, setFormData] = useState({
    userId: employeeId || '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    notes: '',
  });
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pre-fill form if editing existing record
  useEffect(() => {
    if (existingRecord) {
      setFormData({
        userId: existingRecord.user_id,
        date: existingRecord.date,
        checkInTime: existingRecord.check_in_time
          ? new Date(existingRecord.check_in_time).toTimeString().slice(0, 5)
          : '',
        checkOutTime: existingRecord.check_out_time
          ? new Date(existingRecord.check_out_time).toTimeString().slice(0, 5)
          : '',
        notes: existingRecord.notes || '',
      });
    }
  }, [existingRecord]);

  const markMutation = useMarkAttendance(user?.id || '', {
    onSuccess: () => {
      Alert.alert('Success', 'Attendance marked successfully');
      onClose();
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    },
  });

  const updateMutation = useUpdateAttendance(formData.userId, {
    onSuccess: () => {
      Alert.alert('Success', 'Attendance updated successfully');
      onClose();
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update attendance');
    },
  });

  const resetForm = () => {
    setFormData({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      checkInTime: '',
      checkOutTime: '',
      notes: '',
    });
    setSearchTerm('');
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.userId) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please enter date');
      return;
    }
    if (!formData.checkInTime) {
      Alert.alert('Error', 'Please enter check-in time');
      return;
    }

    // Convert time to ISO format
    const checkInDateTime = `${formData.date}T${formData.checkInTime}:00`;
    const checkOutDateTime = formData.checkOutTime
      ? `${formData.date}T${formData.checkOutTime}:00`
      : undefined;

    if (existingRecord) {
      // Update existing record
      updateMutation.mutate({
        recordId: existingRecord.id,
        updates: {
          check_in_time: checkInDateTime,
          check_out_time: checkOutDateTime,
          notes: formData.notes,
        },
      });
    } else {
      // Create new record
      markMutation.mutate({
        userId: formData.userId,
        date: formData.date,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        notes: formData.notes,
      });
    }
  };

  const selectedEmployee = employees?.find((e) => e.id === formData.userId);
  const filteredEmployees = employees?.filter((e) =>
    e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = markMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {existingRecord ? 'Edit Attendance' : 'Mark Attendance'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Employee Selection */}
            {!existingRecord && !employeeId && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Employee <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                >
                  <MaterialCommunityIcons name="account-outline" size={20} color="#64748B" />
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !selectedEmployee && styles.dropdownPlaceholder,
                    ]}
                  >
                    {selectedEmployee
                      ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})`
                      : 'Select employee'}
                  </Text>
                  <Ionicons
                    name={showEmployeeDropdown ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {showEmployeeDropdown && (
                  <View style={styles.dropdown}>
                    <View style={styles.searchBox}>
                      <Ionicons name="search" size={18} color="#64748B" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                      {filteredEmployees?.map((employee) => (
                        <TouchableOpacity
                          key={employee.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormData({ ...formData, userId: employee.id });
                            setShowEmployeeDropdown(false);
                            setSearchTerm('');
                          }}
                        >
                          <Text style={styles.dropdownItemName}>{employee.full_name}</Text>
                          <Text style={styles.dropdownItemId}>{employee.employee_id}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.date}
                  onChangeText={(text) => setFormData({ ...formData, date: text })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Check-in Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Check-in Time <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="log-in-outline" size={20} color="#10B981" />
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (e.g., 09:00)"
                  value={formData.checkInTime}
                  onChangeText={(text) => setFormData({ ...formData, checkInTime: text })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Check-out Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Check-out Time</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM (e.g., 18:00)"
                  value={formData.checkOutTime}
                  onChangeText={(text) => setFormData({ ...formData, checkOutTime: text })}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <MaterialCommunityIcons
                  name="note-text-outline"
                  size={20}
                  color="#64748B"
                  style={styles.textAreaIcon}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any notes..."
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={existingRecord ? 'checkmark-circle' : 'add-circle'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>
                    {existingRecord ? 'Update Attendance' : 'Mark Attendance'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 24,
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
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownButton: {
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
  dropdownButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  dropdownPlaceholder: {
    color: '#94A3B8',
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  dropdownItemId: {
    fontSize: 13,
    color: '#64748B',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
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
