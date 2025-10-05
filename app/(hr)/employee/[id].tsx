import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserById } from '@/hooks/queries/useUser';
import { useAttendanceByDateRange, useCurrentWeekAttendance } from '@/hooks/queries/useAttendance';
import { useSalaryRecords } from '@/hooks/queries/useSalary';
import { useCurrentMonthEarnings } from '@/hooks/queries/useEarnings';
import { useDeleteEmployee } from '@/hooks/mutations/useUserMutations';
import { formatDate } from '@/lib/utils/date.utils';
import { formatCurrency } from '@/lib/utils/salary.utils';
import { formatWorkingDays } from '@/lib/utils/workingDays.utils';
import SalaryProgressCard from '@/components/salary/SalaryProgressCard';

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const employeeId = id || '';
  const insets = useSafeAreaInsets();

  const { data: employee, isLoading: loadingEmployee } = useUserById(employeeId);
  const deleteEmployee = useDeleteEmployee({
    onSuccess: () => {
      console.log('✅ [EmployeeDetail] Delete success callback triggered');
      Alert.alert('Success', 'Employee deleted successfully', [
        {
          text: 'OK',
          onPress: () => {
            console.log('✅ [EmployeeDetail] Navigating back...');
            router.back();
          },
        },
      ]);
    },
    onError: (error) => {
      console.error('❌ [EmployeeDetail] Delete error callback triggered');
      console.error('❌ [EmployeeDetail] Error:', error);
      Alert.alert('Error', `Failed to delete employee: ${error.message}`);
    },
  });

  // Get current month attendance
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const { data: attendance, isLoading: loadingAttendance } = useAttendanceByDateRange(
    employeeId,
    startDate,
    endDate
  );

  const { data: weeklyAttendance } = useCurrentWeekAttendance(employeeId);
  const { data: currentMonthEarnings } = useCurrentMonthEarnings(employeeId);
  const { data: salaries, isLoading: loadingSalaries } = useSalaryRecords(employeeId);

  const handleDeleteEmployee = () => {
    console.log('🗑️ [EmployeeDetail] Delete button clicked');
    console.log('🗑️ [EmployeeDetail] Employee:', employee);
    console.log('🗑️ [EmployeeDetail] Employee ID:', employeeId);

    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete ${employee?.full_name}? This will permanently delete all their data including attendance, salary records, and leave requests. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('🗑️ [EmployeeDetail] Delete cancelled'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('🗑️ [EmployeeDetail] Delete confirmed, calling mutation...');
            deleteEmployee.mutate(employeeId);
          },
        },
      ]
    );
  };

  if (loadingEmployee) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employee Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              disabled={true}
            >
              <Ionicons name="trash-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Employee Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              disabled={true}
            >
              <Ionicons name="trash-outline" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#CBD5E1" />
          <Text style={styles.errorText}>Employee not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteEmployee}
            disabled={deleteEmployee.isPending}
            activeOpacity={0.7}
          >
            {deleteEmployee.isPending ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {employee.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{employee.full_name}</Text>
          <Text style={styles.employeeId}>ID: {employee.employee_id}</Text>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, employee.is_active ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, employee.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={styles.statusText}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name={employee.role === 'hr' || employee.role === 'admin' ? 'shield-account' : 'account'}
                size={14}
                color="#6366F1"
              />
              <Text style={styles.roleText}>{employee.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="mail-outline" size={18} color="#64748B" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{employee.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="call-outline" size={18} color="#64748B" />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{employee.phone || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="office-building-outline" size={18} color="#64748B" />
                <Text style={styles.infoLabel}>Department</Text>
              </View>
              <Text style={styles.infoValue}>{employee.department || 'Not assigned'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <MaterialCommunityIcons name="account-tie-outline" size={18} color="#64748B" />
                <Text style={styles.infoLabel}>Designation</Text>
              </View>
              <Text style={styles.infoValue}>{employee.designation || 'Not assigned'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="calendar-outline" size={18} color="#64748B" />
                <Text style={styles.infoLabel}>Date of Joining</Text>
              </View>
              <Text style={styles.infoValue}>
                {employee.date_of_joining ? formatDate(new Date(employee.date_of_joining)) : 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Attendance Summary (Current Month)</Text>
          </View>

          {loadingAttendance ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          ) : (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="calendar" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{attendance?.length || 0}</Text>
                <Text style={styles.statLabel}>Days Present</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>
                  {attendance?.filter(a => a.is_valid_day).length || 0}
                </Text>
                <Text style={styles.statLabel}>Valid Days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="timer-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>
                  {attendance?.reduce((sum, a) => sum + (a.total_hours || 0), 0).toFixed(1) || 0}
                </Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Salary Configuration</Text>
          </View>

          {employee.base_salary && Number(employee.base_salary) > 0 ? (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="cash" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Base Salary</Text>
                </View>
                <Text style={styles.infoValue}>{formatCurrency(Number(employee.base_salary))}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="cash-clock" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Hourly Rate</Text>
                </View>
                <Text style={styles.infoValue}>
                  {employee.hourly_rate ? `${formatCurrency(Number(employee.hourly_rate))}/h` : 'N/A'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="calendar-check" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Working Days</Text>
                </View>
                <Text style={styles.infoValue}>
                  {employee.working_days && employee.working_days.length > 0
                    ? formatWorkingDays(employee.working_days as any)
                    : 'Not set'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                  <Text style={styles.infoLabel}>Daily Hours</Text>
                </View>
                <Text style={styles.infoValue}>
                  {employee.daily_working_hours ? `${employee.daily_working_hours}h` : 'Not set'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="cash-off" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No salary configuration</Text>
            </View>
          )}
        </View>

        {employee.base_salary && Number(employee.base_salary) > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#6366F1" />
              <Text style={styles.sectionTitle}>Current Month Earnings</Text>
            </View>

            <View style={styles.salaryCard}>
              <SalaryProgressCard
                earnedSalary={Number(currentMonthEarnings?.earned_salary || 0)}
                baseSalary={Number(employee.base_salary || 0)}
                hoursWorked={Number(currentMonthEarnings?.total_hours_worked || 0)}
                expectedHours={Number(currentMonthEarnings?.expected_hours || 0)}
                hourlyRate={Number(employee.hourly_rate || 0)}
                daysWorkedThisWeek={weeklyAttendance?.length || 0}
                compact={false}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#6366F1" />
            <Text style={styles.sectionTitle}>Salary Payment History</Text>
          </View>

          {loadingSalaries ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          ) : salaries && salaries.length > 0 ? (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#EEF2FF' }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.statValue}>{salaries.length}</Text>
                <Text style={styles.statLabel}>Total Records</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>
                  {salaries.filter(s => s.status === 'paid').length}
                </Text>
                <Text style={styles.statLabel}>Paid</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="time-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>
                  {salaries.filter(s => s.status === 'pending').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No payment records</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 8,
    borderBottomColor: '#F8FAFC',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  salaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
});
