import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTodayAttendance, useMonthlyAttendanceSummary } from '@/hooks/queries/useAttendance';
import { useLatestSalary } from '@/hooks/queries/useSalary';
import { useCheckIn, useCheckOut } from '@/hooks/mutations/useAttendanceMutations';
import { formatDate, formatTime } from '@/lib/utils/date.utils';
import { formatCurrency } from '@/lib/utils/salary.utils';
import { formatHours } from '@/lib/utils/attendance.utils';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const userId = user?.id || '';

  const { data: todayAttendance, isLoading: loadingToday } = useTodayAttendance(userId);
  const { data: monthlySummary, isLoading: loadingMonthly } = useMonthlyAttendanceSummary(
    userId,
    new Date().getMonth(),
    new Date().getFullYear()
  );
  const { data: latestSalary, isLoading: loadingSalary } = useLatestSalary(userId);

  const checkInMutation = useCheckIn(userId);
  const checkOutMutation = useCheckOut(userId);

  const handleCheckIn = () => {
    checkInMutation.mutate({ notes: 'Self check-in' });
  };

  const handleCheckOut = () => {
    if (todayAttendance?.id) {
      checkOutMutation.mutate({ recordId: todayAttendance.id, notes: 'Self check-out' });
    }
  };

  const isCheckedIn = todayAttendance && !todayAttendance.check_out_time;
  const canCheckIn = !todayAttendance;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0]}</Text>
              <Text style={styles.date}>{formatDate(new Date())}</Text>
            </View>
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Cards */}
        <View style={styles.content}>
          {/* Attendance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
              </View>
              {todayAttendance && !todayAttendance.check_out_time && (
                <View style={styles.liveBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveText}>Active</Text>
                </View>
              )}
            </View>

            {loadingToday ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <>
                {todayAttendance ? (
                  <View style={styles.attendanceInfo}>
                    <View style={styles.timeCard}>
                      <Ionicons name="log-in-outline" size={20} color="#10B981" />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Check In</Text>
                        <Text style={styles.timeCardValue}>
                          {formatTime(new Date(todayAttendance.check_in_time))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeCard}>
                      <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Check Out</Text>
                        <Text style={styles.timeCardValue}>
                          {todayAttendance.check_out_time
                            ? formatTime(new Date(todayAttendance.check_out_time))
                            : '--:--'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeCard}>
                      <Ionicons name="timer-outline" size={20} color="#6366F1" />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Total Hours</Text>
                        <Text style={[styles.timeCardValue, styles.hoursValue]}>
                          {formatHours(todayAttendance.total_hours || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Feather name="calendar" size={40} color="#94A3B8" />
                    <Text style={styles.emptyStateText}>No attendance recorded today</Text>
                  </View>
                )}

                {canCheckIn && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    style={styles.primaryButton}
                  >
                    {checkInMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Check In Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {isCheckedIn && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                    style={styles.checkOutButton}
                  >
                    {checkOutMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.checkOutButtonText}>Check Out</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Monthly Stats */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="chart-box-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>This Month's Summary</Text>
              </View>
            </View>

            {loadingMonthly ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <View style={styles.statsContainer}>
                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgGreen}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color="#10B981" />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Days Present</Text>
                    <Text style={styles.statItemValue}>{monthlySummary?.totalDays || 0} days</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgBlue}>
                      <MaterialCommunityIcons name="check-circle-outline" size={24} color="#3B82F6" />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Valid Days</Text>
                    <Text style={styles.statItemValue}>{monthlySummary?.validDays || 0} days</Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgPurple}>
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#8B5CF6" />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Total Hours</Text>
                    <Text style={styles.statItemValue}>{Math.round(monthlySummary?.totalHours || 0)} hrs</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Latest Salary */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Latest Salary</Text>
              </View>
            </View>

            {loadingSalary ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : latestSalary ? (
              <View style={styles.salaryContent}>
                <View style={styles.salaryAmountContainer}>
                  <Text style={styles.salaryAmountLabel}>Total Amount</Text>
                  <Text style={styles.salaryAmount}>
                    {formatCurrency(latestSalary.total_salary)}
                  </Text>
                </View>

                <View style={styles.salaryDetails}>
                  <View style={styles.salaryRow}>
                    <View style={styles.salaryRowLeft}>
                      <MaterialCommunityIcons name="calendar-month" size={18} color="#64748B" />
                      <Text style={styles.salaryLabel}>Month</Text>
                    </View>
                    <Text style={styles.salaryValue}>{latestSalary.month_year}</Text>
                  </View>

                  <View style={styles.salaryRow}>
                    <View style={styles.salaryRowLeft}>
                      <MaterialCommunityIcons name="information-outline" size={18} color="#64748B" />
                      <Text style={styles.salaryLabel}>Status</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        latestSalary.status === 'paid'
                          ? styles.statusPaid
                          : latestSalary.status === 'approved'
                          ? styles.statusApproved
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>{latestSalary.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="receipt-text-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateText}>No salary records available</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  attendanceInfo: {
    gap: 12,
    marginBottom: 20,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  timeCardContent: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeCardValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  hoursValue: {
    color: '#6366F1',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkOutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    gap: 0,
  },
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconBgGreen: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconBgBlue: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconBgPurple: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    gap: 4,
  },
  statItemLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  salaryContent: {
    gap: 20,
  },
  salaryAmountContainer: {
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  salaryAmountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  salaryDetails: {
    gap: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  salaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusApproved: {
    backgroundColor: '#DBEAFE',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#0F172A',
  },
});
