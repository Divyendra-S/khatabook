import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useAllBreaksByMonth,
  useBreaksByDate,
} from '@/hooks/queries/useBreakRequests';
import { useRemoveBreak } from '@/hooks/mutations/useBreakRequestMutations';
import { useAllUsers } from '@/hooks/queries/useUser';
import { useAuth } from '@/hooks/auth/useAuth';
import { BreakRequest } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils/date.utils';
import AddBreakForEmployeeModal from '@/components/attendance/AddBreakForEmployeeModal';

export default function HRBreaksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<'month' | 'date'>('month');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const dateString = selectedDate.toISOString().split('T')[0];

  // Employee list query
  const { data: allUsers } = useAllUsers();
  // Filter to get only employees (not HR or admin)
  const employees = allUsers?.filter(
    (user) => user.role !== 'hr' && user.role !== 'admin'
  );

  // Queries
  const {
    data: monthBreaks,
    isLoading: isMonthLoading,
    refetch: refetchMonth,
    isFetching: isMonthFetching,
  } = useAllBreaksByMonth(currentMonth, currentYear, {
    enabled: dateFilterMode === 'month',
  } as any);

  const {
    data: dateBreaks,
    isLoading: isDateLoading,
    refetch: refetchDate,
    isFetching: isDateFetching,
  } = useBreaksByDate(dateString, {
    enabled: dateFilterMode === 'date',
  } as any);

  // Mutations
  const removeBreakMutation = useRemoveBreak(user?.id || '', {
    onSuccess: () => {
      Alert.alert('Success', 'Break removed successfully');
      if (dateFilterMode === 'month') {
        refetchMonth();
      } else {
        refetchDate();
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to remove break');
    },
  });

  // Filter breaks by selected employee
  const allBreaks = dateFilterMode === 'month' ? monthBreaks : dateBreaks;
  const breaks = useMemo(() => {
    if (!allBreaks) return allBreaks;
    if (selectedEmployeeId === 'all') return allBreaks;
    return allBreaks.filter((br: any) => br.user_id === selectedEmployeeId);
  }, [allBreaks, selectedEmployeeId]);

  const isLoading = dateFilterMode === 'month' ? isMonthLoading : isDateLoading;
  const isFetching =
    dateFilterMode === 'month' ? isMonthFetching : isDateFetching;
  const refetch = dateFilterMode === 'month' ? refetchMonth : refetchDate;

  // Calculate statistics
  const stats = useMemo(() => {
    if (!breaks) return null;

    const totalBreaks = breaks.length;
    const totalMinutes = breaks
      .filter((b) => b.status === 'approved')
      .reduce((sum, b) => sum + (b.duration_minutes || 0), 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      totalBreaks,
      totalMinutes,
      hours,
      minutes,
    };
  }, [breaks]);

  // Date picker handlers
  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowDatePicker(false);
  };

  const handleMonthChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowMonthPicker(false);
  };

  const handlePreviousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  const handleClearDateFilter = () => {
    setDateFilterMode('month');
    setSelectedDate(new Date());
  };

  const handleRemoveBreak = (breakRequest: BreakRequest) => {
    Alert.alert(
      'Remove Break',
      'Are you sure you want to remove this break? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeBreakMutation.mutate({
              breakRequestId: breakRequest.id,
              userId: breakRequest.user_id,
              requestDate: breakRequest.request_date,
            });
          },
        },
      ]
    );
  };

  const renderBreakCard = (item: BreakRequest & {
    user?: { full_name: string; employee_id: string };
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending':
          return '#F59E0B';
        case 'approved':
          return '#10B981';
        case 'rejected':
          return '#EF4444';
        default:
          return '#64748B';
      }
    };

    const hours = item.duration_minutes
      ? Math.floor(item.duration_minutes / 60)
      : 0;
    const minutes = item.duration_minutes ? item.duration_minutes % 60 : 0;

    return (
      <View key={item.id} style={styles.breakCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <View style={styles.employeeAvatar}>
              <Ionicons name="person" size={18} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.employeeName}>
                {item.user?.full_name || 'Unknown'}
              </Text>
              <Text style={styles.employeeId}>
                ID: {item.user?.employee_id || 'N/A'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}15` },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text style={styles.cardLabel}>Date:</Text>
          <Text style={styles.cardValue}>
            {formatDate(new Date(item.request_date))}
          </Text>
        </View>

        {/* Time */}
        {item.approved_start_time && item.approved_end_time && (
          <>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons name="coffee" size={14} color="#64748B" />
              <Text style={styles.cardLabel}>Time:</Text>
              <Text style={styles.cardValue}>
                {formatTime(new Date(item.approved_start_time))} -{' '}
                {formatTime(new Date(item.approved_end_time))}
              </Text>
            </View>

            <View style={styles.cardRow}>
              <Ionicons name="timer-outline" size={14} color="#64748B" />
              <Text style={styles.cardLabel}>Duration:</Text>
              <Text style={styles.cardValue}>
                {hours > 0 && `${hours}h `}
                {minutes}m
              </Text>
            </View>
          </>
        )}

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        {/* Actions */}
        {item.status === 'approved' && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveBreak(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: 'Breaks Management',
            headerShown: false,
          }}
        />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading breaks...</Text>
      </View>
    );
  }

  const selectedEmployee = employees?.find((emp) => emp.id === selectedEmployeeId);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Breaks',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '700',
            color: '#0F172A',
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Mode Toggle */}
      <View style={styles.filterModeContainer}>
        <TouchableOpacity
          style={[
            styles.filterModeButton,
            dateFilterMode === 'month' && styles.filterModeButtonActive,
          ]}
          onPress={() => {
            setDateFilterMode('month');
            setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }}
        >
          <MaterialCommunityIcons
            name="calendar-month"
            size={18}
            color={dateFilterMode === 'month' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.filterModeText,
              dateFilterMode === 'month' && styles.filterModeTextActive,
            ]}
          >
            Month View
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterModeButton,
            dateFilterMode === 'date' && styles.filterModeButtonActive,
          ]}
          onPress={() => setDateFilterMode('date')}
        >
          <MaterialCommunityIcons
            name="calendar-today"
            size={18}
            color={dateFilterMode === 'date' ? '#FFFFFF' : '#64748B'}
          />
          <Text
            style={[
              styles.filterModeText,
              dateFilterMode === 'date' && styles.filterModeTextActive,
            ]}
          >
            Date View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Employee Filter */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.employeeFilter}
          onPress={() => setShowEmployeePicker(!showEmployeePicker)}
        >
          <View style={styles.employeeFilterContent}>
            <Ionicons name="people" size={18} color="#6366F1" />
            <Text style={styles.employeeFilterText}>
              {selectedEmployeeId === 'all'
                ? 'All Employees'
                : selectedEmployee?.full_name || 'Unknown'}
            </Text>
          </View>
          <Ionicons
            name={showEmployeePicker ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6366F1"
          />
        </TouchableOpacity>
      </View>

      {/* Employee Picker Dropdown */}
      {showEmployeePicker && (
        <View style={styles.employeePickerDropdown}>
          <TouchableOpacity
            style={[
              styles.employeePickerItem,
              selectedEmployeeId === 'all' && styles.employeePickerItemActive,
            ]}
            onPress={() => {
              setSelectedEmployeeId('all');
              setShowEmployeePicker(false);
            }}
          >
            <Ionicons
              name="people"
              size={18}
              color={selectedEmployeeId === 'all' ? '#6366F1' : '#64748B'}
            />
            <Text
              style={[
                styles.employeePickerItemText,
                selectedEmployeeId === 'all' && styles.employeePickerItemTextActive,
              ]}
            >
              All Employees
            </Text>
            {selectedEmployeeId === 'all' && (
              <Ionicons name="checkmark" size={20} color="#6366F1" />
            )}
          </TouchableOpacity>

          <ScrollView style={styles.employeePickerScroll} nestedScrollEnabled>
            {employees?.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.employeePickerItem,
                  selectedEmployeeId === emp.id && styles.employeePickerItemActive,
                ]}
                onPress={() => {
                  setSelectedEmployeeId(emp.id);
                  setShowEmployeePicker(false);
                }}
              >
                <View style={styles.employeePickerAvatar}>
                  <Ionicons name="person" size={16} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.employeePickerItemText,
                      selectedEmployeeId === emp.id &&
                        styles.employeePickerItemTextActive,
                    ]}
                  >
                    {emp.full_name}
                  </Text>
                  <Text style={styles.employeePickerItemSubtext}>
                    ID: {emp.employee_id}
                  </Text>
                </View>
                {selectedEmployeeId === emp.id && (
                  <Ionicons name="checkmark" size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Date Navigation */}
      {dateFilterMode === 'month' ? (
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#6366F1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6366F1" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#6366F1" />
            <Text style={styles.datePickerText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={handleClearDateFilter}
          >
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Month Picker Modal */}
      {showMonthPicker && (
        <Modal
          visible={showMonthPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMonthPicker(false)}
          >
            <View style={styles.monthPickerModal}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.monthPickerHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDate(
                        new Date(selectedDate.getFullYear() - 1, selectedDate.getMonth(), 1)
                      );
                    }}
                    style={styles.yearButton}
                  >
                    <Ionicons name="chevron-back" size={20} color="#6366F1" />
                  </TouchableOpacity>

                  <Text style={styles.monthPickerYear}>{selectedDate.getFullYear()}</Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDate(
                        new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), 1)
                      );
                    }}
                    style={styles.yearButton}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.monthsGrid}>
                  {[
                    'Jan',
                    'Feb',
                    'Mar',
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ].map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthButton,
                        selectedDate.getMonth() === index && styles.monthButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedDate(
                          new Date(selectedDate.getFullYear(), index, 1)
                        );
                        setShowMonthPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          selectedDate.getMonth() === index &&
                            styles.monthButtonTextActive,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MaterialCommunityIcons name="coffee" size={24} color="#6366F1" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.totalBreaks}</Text>
              <Text style={styles.statLabel}>Total Breaks</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="timer-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {stats.hours}h {stats.minutes}m
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>
        </View>
      )}

      {/* Add Break Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAssignModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Break</Text>
        </TouchableOpacity>
      </View>

      {/* Breaks List */}
      {breaks && breaks.length > 0 ? (
        breaks.map((item: any) => renderBreakCard(item))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="coffee-off-outline"
            size={64}
            color="#CBD5E1"
          />
          <Text style={styles.emptyTitle}>No breaks found</Text>
          <Text style={styles.emptySubtitle}>
            {dateFilterMode === 'month'
              ? 'No breaks recorded for this month'
              : 'No breaks recorded for this date'}
          </Text>
        </View>
      )}
      </ScrollView>

      {/* Add Break Modal */}
      {showAssignModal && (
        <AddBreakForEmployeeModal
          visible={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            refetch();
          }}
          preSelectedDate={selectedDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  topControls: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  employeeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  employeeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  employeeFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  employeePickerDropdown: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  employeePickerScroll: {
    maxHeight: 250,
  },
  employeePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  employeePickerItemActive: {
    backgroundColor: '#EEF2FF',
  },
  employeePickerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeePickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  employeePickerItemTextActive: {
    color: '#6366F1',
  },
  employeePickerItemSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  filterModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  filterModeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterModeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  filterModeTextActive: {
    color: '#FFFFFF',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  actionBar: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  breakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  employeeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeeId: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cardValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  notesSection: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  monthPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  monthPickerYear: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  yearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthButton: {
    width: '30%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  monthButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  monthButtonTextActive: {
    color: '#FFFFFF',
  },
});
