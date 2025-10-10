import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useHRAllEmployeesAttendance } from '@/hooks/queries/useAttendance';
import { useHRPendingLeaveRequests } from '@/hooks/queries/useLeave';
import { usePendingBreakRequests } from '@/hooks/queries/useBreakRequests';
import { useAllUsers } from '@/hooks/queries/useUser';
import { formatDate, formatDateToISO } from '@/lib/utils/date.utils';
import { useRouter } from 'expo-router';

export default function HRDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const today = formatDateToISO(new Date());

  const { data: todayAttendance, isLoading: loadingAttendance, refetch: refetchAttendance } = useHRAllEmployeesAttendance({ date: today });
  const { data: pendingLeaves, isLoading: loadingLeaves, refetch: refetchLeaves } = useHRPendingLeaveRequests();
  const { data: pendingBreakRequests, isLoading: loadingBreakRequests, refetch: refetchBreakRequests } = usePendingBreakRequests();
  const { data: allUsers, isLoading: loadingUsers, refetch: refetchUsers } = useAllUsers();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAttendance(),
        refetchLeaves(),
        refetchBreakRequests(),
        refetchUsers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const activeEmployees = allUsers?.filter(u => u.is_active && u.role === 'employee').length || 0;
  const checkedInToday = todayAttendance?.filter(a => a.check_in_time !== null).length || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0]}</Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        {/* Content Cards */}
        <View style={styles.content}>
          {/* Overview Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/(hr)/employees')}
              activeOpacity={0.7}
            >
              {loadingUsers ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <View style={styles.statIconBgGreen}>
                    <MaterialCommunityIcons name="account-group" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>{activeEmployees}</Text>
                  <Text style={styles.statLabel}>Active Employees</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/(hr)/attendance')}
              activeOpacity={0.7}
            >
              {loadingAttendance ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <View style={styles.statIconBgBlue}>
                    <MaterialCommunityIcons name="calendar-check" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statValue}>{checkedInToday}</Text>
                  <Text style={styles.statLabel}>Present Today</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Pending Actions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="bell-alert" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Pending Actions</Text>
              </View>
            </View>

            {(loadingLeaves || loadingBreakRequests) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <View style={styles.pendingList}>
                <TouchableOpacity
                  style={styles.pendingItem}
                  onPress={() => router.push('/(hr)/leave')}
                  activeOpacity={0.7}
                >
                  <View style={styles.pendingIconWrapper}>
                    <View style={styles.pendingIconBg}>
                      <MaterialCommunityIcons name="beach" size={24} color="#F59E0B" />
                    </View>
                  </View>
                  <View style={styles.pendingContent}>
                    <Text style={styles.pendingText}>Leave Requests</Text>
                    <Text style={styles.pendingSubtext}>Pending approval</Text>
                  </View>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingCount}>{pendingLeaves?.length || 0}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.pendingItem}
                  onPress={() => router.push('/(hr)/break-requests')}
                  activeOpacity={0.7}
                >
                  <View style={styles.pendingIconWrapper}>
                    <View style={styles.pendingIconBgBreak}>
                      <MaterialCommunityIcons name="coffee" size={24} color="#8B5CF6" />
                    </View>
                  </View>
                  <View style={styles.pendingContent}>
                    <Text style={styles.pendingText}>Break Requests</Text>
                    <Text style={styles.pendingSubtext}>
                      {(pendingBreakRequests && pendingBreakRequests.length > 0)
                        ? 'Pending approval'
                        : 'No pending requests'}
                    </Text>
                  </View>
                  {(pendingBreakRequests && pendingBreakRequests.length > 0) ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingCount}>{pendingBreakRequests.length}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Today's Attendance Summary */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/(hr)/attendance')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
              </View>
            </View>

            {loadingAttendance ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : todayAttendance && todayAttendance.length > 0 ? (
              <View>
                <Text style={styles.attendanceSummary}>
                  {checkedInToday} employees checked in today
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${activeEmployees > 0 ? (checkedInToday / activeEmployees) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {activeEmployees > 0
                    ? `${Math.round((checkedInToday / activeEmployees) * 100)}% attendance`
                    : '0% attendance'}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Feather name="calendar" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateText}>No attendance records for today</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Stats */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push('/(hr)/employees')}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="chart-box-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Quick Stats</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItemRow}>
                <View style={styles.statIconWrapper}>
                  <View style={styles.statIconBgPurple}>
                    <MaterialCommunityIcons name="account-multiple" size={24} color="#8B5CF6" />
                  </View>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statItemLabel}>Total Employees</Text>
                  <Text style={styles.statItemValue}>{allUsers?.length || 0}</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItemRow}>
                <View style={styles.statIconWrapper}>
                  <View style={styles.statIconBgBlue}>
                    <MaterialCommunityIcons name="shield-account" size={24} color="#3B82F6" />
                  </View>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statItemLabel}>HR Staff</Text>
                  <Text style={styles.statItemValue}>
                    {allUsers?.filter(u => u.role === 'hr' || u.role === 'admin').length || 0}
                  </Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItemRow}>
                <View style={styles.statIconWrapper}>
                  <View style={styles.statIconBgRed}>
                    <MaterialCommunityIcons name="account-off" size={24} color="#EF4444" />
                  </View>
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statItemLabel}>Inactive</Text>
                  <Text style={styles.statItemValue}>
                    {allUsers?.filter(u => !u.is_active).length || 0}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    gap: 12,
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
  statIconBgRed: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
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
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  pendingList: {
    gap: 0,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pendingIconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIconBgSalary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContent: {
    flex: 1,
    gap: 4,
  },
  pendingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  pendingSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pendingCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  attendanceSummary: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
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
  pendingIconBgBreak: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakRequestsScroll: {
    maxHeight: 200,
  },
});
