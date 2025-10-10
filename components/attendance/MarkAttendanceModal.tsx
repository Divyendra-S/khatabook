import { useState, useEffect, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAllUsers } from '@/hooks/queries/useUser';
import { useMarkAttendance, useUpdateAttendance } from '@/hooks/mutations/useAttendanceMutations';
import { useBreakRequestsByAttendance } from '@/hooks/queries/useBreakRequests';
import { AttendanceRecord, User } from '@/lib/types';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import { useQueryClient } from '@tanstack/react-query';
import { isWorkingDay, getWeekdayShortName } from '@/lib/utils/workingDays.utils';
import {
  calculateApprovedBreakHours,
  formatBreakDurationFromRequests
} from '@/lib/utils/attendance.utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: employees } = useAllUsers({ role: 'employee' });
  const queryClient = useQueryClient();

  // Fetch break requests for existing record
  const { data: breakRequests } = useBreakRequestsByAttendance(
    existingRecord?.id || '',
    { enabled: !!existingRecord?.id }
  );

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    userId: '',
    date: getTodayDate(),
    checkInTime: '',
    checkOutTime: '',
    checkOutDate: getTodayDate(), // Separate date for check-out
    useSeparateCheckOutDate: false, // Toggle for different check-out date
    notes: '',
  });
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset and pre-fill form when modal opens or props change
  useEffect(() => {
    if (visible) {
      if (existingRecord) {
        // Editing existing record
        const checkInDate = existingRecord.check_in_time
          ? new Date(existingRecord.check_in_time).toISOString().split('T')[0]
          : existingRecord.date;
        const checkOutDate = existingRecord.check_out_time
          ? new Date(existingRecord.check_out_time).toISOString().split('T')[0]
          : checkInDate;

        setFormData({
          userId: existingRecord.user_id,
          date: getTodayDate(), // Default to latest date (today)
          checkInTime: existingRecord.check_in_time
            ? new Date(existingRecord.check_in_time).toTimeString().slice(0, 5)
            : '',
          checkOutTime: existingRecord.check_out_time
            ? new Date(existingRecord.check_out_time).toTimeString().slice(0, 5)
            : '',
          checkOutDate: getTodayDate(), // Default to latest date (today)
          useSeparateCheckOutDate: checkInDate !== checkOutDate,
          notes: existingRecord.notes || '',
        });
      } else if (employeeId) {
        // Creating new record with pre-selected employee
        setFormData({
          userId: employeeId,
          date: getTodayDate(),
          checkInTime: '',
          checkOutTime: '',
          checkOutDate: getTodayDate(),
          useSeparateCheckOutDate: false,
          notes: '',
        });
      } else {
        // Creating new record without pre-selection
        resetForm();
      }
      setShowEmployeeDropdown(false);
      setSearchTerm('');
    }
  }, [visible, existingRecord, employeeId]);

  const markMutation = useMarkAttendance(user?.id || '', {
    onSuccess: async () => {
      // Force refetch all attendance queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active',
      });
      Alert.alert('Success', 'Attendance marked successfully');
      onClose();
      resetForm();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    },
  });

  const updateMutation = useUpdateAttendance(formData.userId, {
    onSuccess: async () => {
      // Force refetch all attendance queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active',
      });
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
      date: getTodayDate(),
      checkInTime: '',
      checkOutTime: '',
      checkOutDate: getTodayDate(),
      useSeparateCheckOutDate: false,
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

    // Validate check-out time is not in the future
    if (formData.checkOutTime) {
      const checkOutDateToUse = formData.useSeparateCheckOutDate
        ? formData.checkOutDate
        : formData.date;

      const [checkOutHour, checkOutMinute] = formData.checkOutTime.split(':').map(Number);
      const checkOutDateTime = new Date(checkOutDateToUse);
      checkOutDateTime.setHours(checkOutHour, checkOutMinute, 0, 0);

      const now = new Date();

      if (checkOutDateTime > now) {
        Alert.alert('Invalid Time', 'Check-out time cannot be in the future');
        return;
      }
    }

    // Block attendance marking on off days
    if (!isSelectedDateWorkingDay) {
      Alert.alert(
        'Cannot Mark Attendance',
        'The selected date is not a working day for this employee. Attendance cannot be marked on off days.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Check for negative duration
    if (hoursPreview !== null && hoursPreview < 0) {
      Alert.alert('Invalid Time', 'Check-out time cannot be before check-in time');
      return;
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = () => {
    // Convert local time to UTC ISO format
    const [checkInHour, checkInMinute] = formData.checkInTime.split(':');
    const checkInDate = new Date(formData.date);
    checkInDate.setHours(parseInt(checkInHour), parseInt(checkInMinute), 0, 0);
    const checkInDateTime = checkInDate.toISOString();

    let checkOutDateTime: string | undefined;
    if (formData.checkOutTime) {
      const [checkOutHour, checkOutMinute] = formData.checkOutTime.split(':');
      // Use separate check-out date if enabled, otherwise use check-in date
      const checkOutDateToUse = formData.useSeparateCheckOutDate
        ? formData.checkOutDate
        : formData.date;
      const checkOutDate = new Date(checkOutDateToUse);
      checkOutDate.setHours(parseInt(checkOutHour), parseInt(checkOutMinute), 0, 0);
      checkOutDateTime = checkOutDate.toISOString();
    }

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

  // Check if selected date is a working day
  const isSelectedDateWorkingDay = useMemo(() => {
    if (!selectedEmployee || !formData.date) return true;
    const workingDays = selectedEmployee.working_days || [];
    const selectedDate = new Date(formData.date);
    return isWorkingDay(selectedDate, workingDays);
  }, [selectedEmployee, formData.date]);

  // Calculate hours preview
  const hoursPreview = useMemo(() => {
    if (!formData.checkInTime || !formData.checkOutTime) return null;

    const [checkInHour, checkInMinute] = formData.checkInTime.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = formData.checkOutTime.split(':').map(Number);

    const checkInDate = new Date(formData.date);
    checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

    // Use separate check-out date if enabled
    const checkOutDateToUse = formData.useSeparateCheckOutDate
      ? formData.checkOutDate
      : formData.date;
    const checkOutDate = new Date(checkOutDateToUse);
    checkOutDate.setHours(checkOutHour, checkOutMinute, 0, 0);

    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    return hours;
  }, [formData.checkInTime, formData.checkOutTime, formData.date, formData.checkOutDate, formData.useSeparateCheckOutDate]);

  // Calculate break hours info (database handles the actual deduction)
  const breakHoursData = useMemo(() => {
    if (!breakRequests || breakRequests.length === 0) {
      return { hasBreaks: false, breakHours: 0 };
    }

    const breakHours = calculateApprovedBreakHours(breakRequests);

    return {
      hasBreaks: breakHours > 0,
      breakHours,
      breakSummary: formatBreakDurationFromRequests(breakRequests)
    };
  }, [breakRequests]);

  const isLoading = markMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {existingRecord ? 'Edit Attendance' : 'Mark Attendance'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Employee Selection */}
            {!existingRecord && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Employee <Text style={styles.required}>*</Text>
                </Text>
                {employeeId ? (
                  // Read-only display when employee is pre-selected
                  <View style={[styles.dropdownButton, styles.dropdownButtonDisabled]}>
                    <MaterialCommunityIcons name="account-outline" size={20} color="#64748B" />
                    <Text style={styles.dropdownButtonText}>
                      {selectedEmployee
                        ? `${selectedEmployee.full_name} (${selectedEmployee.employee_id})`
                        : 'Loading...'}
                    </Text>
                  </View>
                ) : (
                  <>
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
                  </>
                )}
              </View>
            )}

            {/* Date */}
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date })}
              label="Date"
              required
              maximumDate={new Date()}
            />

            {/* Check-in Time */}
            <TimePicker
              value={formData.checkInTime}
              onChange={(time) => setFormData({ ...formData, checkInTime: time })}
              label="Check-in Time"
              required
              iconName="log-in-outline"
              iconColor="#10B981"
            />

            {/* Check-out Time */}
            <TimePicker
              value={formData.checkOutTime}
              onChange={(time) => setFormData({ ...formData, checkOutTime: time })}
              label="Check-out Time"
              iconName="log-out-outline"
              iconColor="#EF4444"
            />

            {/* Different Check-out Date Toggle */}
            {formData.checkOutTime && (
              <TouchableOpacity
                style={styles.checkOutDateToggle}
                onPress={() => setFormData({
                  ...formData,
                  useSeparateCheckOutDate: !formData.useSeparateCheckOutDate,
                  checkOutDate: formData.useSeparateCheckOutDate ? formData.date : formData.checkOutDate
                })}
                activeOpacity={0.7}
              >
                <View style={styles.toggleLeft}>
                  <MaterialCommunityIcons
                    name={formData.useSeparateCheckOutDate ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={22}
                    color={formData.useSeparateCheckOutDate ? "#6366F1" : "#94A3B8"}
                  />
                  <Text style={styles.toggleText}>
                    Different check-out date
                  </Text>
                </View>
                <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Check-out Date (shown only if toggle is enabled) */}
            {formData.checkOutTime && formData.useSeparateCheckOutDate && (
              <DatePicker
                value={formData.checkOutDate}
                onChange={(date) => setFormData({ ...formData, checkOutDate: date })}
                label="Check-out Date"
                required
                maximumDate={new Date()}
              />
            )}

            {/* Hours Preview with Break Information */}
            {hoursPreview !== null && (
              <View style={styles.hoursBreakdownContainer}>
                <View style={[
                  styles.previewCard,
                  hoursPreview < 0 ? styles.previewCardError : styles.previewCardSuccess
                ]}>
                  <Ionicons
                    name={hoursPreview < 0 ? "alert-circle" : "time"}
                    size={20}
                    color={hoursPreview < 0 ? "#EF4444" : "#6366F1"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.previewLabel}>Total Hours</Text>
                    <Text style={[
                      styles.previewValue,
                      hoursPreview < 0 && styles.previewValueError
                    ]}>
                      {hoursPreview < 0 ? 'Invalid time range' : `${hoursPreview.toFixed(2)} hours`}
                    </Text>
                  </View>
                </View>

                {/* Break Information - Only show if there are approved breaks */}
                {breakHoursData.hasBreaks && hoursPreview > 0 && (
                  <View style={styles.breakInfoCard}>
                    <MaterialCommunityIcons
                      name="coffee-outline"
                      size={20}
                      color="#F59E0B"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewLabel}>Break Duration (will be deducted)</Text>
                      <Text style={styles.breakValue}>
                        {breakHoursData.breakSummary}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Working Days Info & Warning */}
            {selectedEmployee && (
              <View style={styles.workingDaysInfo}>
                <View style={styles.workingDaysHeader}>
                  <MaterialCommunityIcons name="calendar-week" size={16} color="#64748B" />
                  <Text style={styles.workingDaysLabel}>Working Days:</Text>
                </View>
                <View style={styles.workingDaysList}>
                  {selectedEmployee.working_days?.map((day) => (
                    <View key={day} style={styles.workingDayChip}>
                      <Text style={styles.workingDayText}>
                        {getWeekdayShortName(day)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Off Day Error */}
            {!isSelectedDateWorkingDay && selectedEmployee && (
              <View style={styles.errorCard}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Off Day - Cannot Mark Attendance</Text>
                  <Text style={styles.errorText}>
                    This is not a working day for this employee. Please select a valid working day.
                  </Text>
                </View>
              </View>
            )}

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
              style={[
                styles.submitButton,
                (isLoading || !isSelectedDateWorkingDay) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !isSelectedDateWorkingDay}
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
      </KeyboardAvoidingView>
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
    height: '85%',
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
    flex: 1,
  },
  modalContentContainer: {
    padding: 24,
    paddingBottom: 100,
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
  dropdownButtonDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
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
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewCardSuccess: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  previewCardError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366F1',
  },
  previewValueError: {
    color: '#EF4444',
  },
  hoursBreakdownContainer: {
    marginBottom: 20,
    gap: 12,
  },
  breakInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  breakValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  workingDaysInfo: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  workingDaysHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  workingDaysLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  workingDaysList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  workingDayChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workingDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: '#78350F',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  checkOutDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
});
