import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/auth/useAuth';
import { useHRAllEmployeesAttendance } from '@/hooks/queries/useAttendance';
import { useHRPendingLeaveRequests } from '@/hooks/queries/useLeave';
import { usePendingBreakRequests } from '@/hooks/queries/useBreakRequests';
import { useAllUsers } from '@/hooks/queries/useUser';
import { formatDate, formatDateToISO } from '@/lib/utils/date.utils';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function HRDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const today = formatDateToISO(new Date());

  const {
    data: todayAttendance,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useHRAllEmployeesAttendance({ date: today });
  const {
    data: pendingLeaves,
    isLoading: loadingLeaves,
    refetch: refetchLeaves,
  } = useHRPendingLeaveRequests();
  const {
    data: pendingBreakRequests,
    isLoading: loadingBreakRequests,
    refetch: refetchBreakRequests,
  } = usePendingBreakRequests();
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
  const totalEmployees = allUsers?.length || 0;
  const leadershipCount = allUsers?.filter(u => u.role === 'hr' || u.role === 'admin').length || 0;
  const inactiveCount = allUsers?.filter(u => !u.is_active).length || 0;
  const checkedInToday = todayAttendance?.filter(a => a.check_in_time !== null).length || 0;
  const pendingLeavesCount = pendingLeaves?.length || 0;
  const pendingBreakCount = pendingBreakRequests?.length || 0;
  const totalPendingApprovals = pendingLeavesCount + pendingBreakCount;
  const yetToCheckIn = Math.max(activeEmployees - checkedInToday, 0);
  const attendancePercentage = activeEmployees > 0 ? Math.round((checkedInToday / activeEmployees) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primaryLight}
          />
        }
      >
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.heroGreeting}>{user?.full_name?.split(' ')[0]}</Text>
              <View style={styles.heroDatePill}>
                <Feather name="calendar" size={16} color={Colors.textInverse} />
                <Text style={styles.heroDateText}>{formatDate(new Date())}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.avatarButton} onPress={() => router.push('/profile')}>
              <Text style={styles.avatarLetter}>{user?.full_name?.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroMetricsRow}>
            <TouchableOpacity
              style={[styles.heroMetricCard, styles.heroMetricPrimary]}
              activeOpacity={0.85}
              onPress={() => router.push('/(hr)/employees')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>active staff</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingUsers ? '—' : activeEmployees}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingUsers ? 'Syncing…' : `${totalEmployees} total`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroMetricCard, styles.heroMetricSecondary]}
              activeOpacity={0.85}
              onPress={() => router.push('/(hr)/attendance')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="clock-check-outline" size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>pending</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingAttendance ? '—' : yetToCheckIn}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingAttendance || loadingUsers
                    ? 'Loading…'
                    : `${checkedInToday} present`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroMetricCard, styles.heroMetricPrimary]}
              activeOpacity={0.85}
              onPress={() => router.push('/(hr)/attendance')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="account-check-outline" size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>present</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingAttendance ? '—' : checkedInToday}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingUsers
                    ? 'Loading…'
                    : 'Today'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroMetricCard, styles.heroMetricSecondary]}
              activeOpacity={0.85}
              onPress={() => router.push('/(hr)/leave')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="clipboard-clock-outline" size={22} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>approvals</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingLeaves || loadingBreakRequests ? '—' : totalPendingApprovals}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingLeaves || loadingBreakRequests
                    ? 'Loading…'
                    : `L:${pendingLeavesCount} • B:${pendingBreakCount}`}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.modernSection}>
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Pending Actions</Text>
            {totalPendingApprovals > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{totalPendingApprovals}</Text>
              </View>
            )}
          </View>

          {loadingLeaves || loadingBreakRequests ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingLabel}>Loading…</Text>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(hr)/leave')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
                  <MaterialCommunityIcons name="beach" size={22} color="#f59e0b" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>Leave Requests</Text>
                  <Text style={styles.actionStatus}>
                    {pendingLeavesCount > 0 ? `${pendingLeavesCount} pending` : 'All clear'}
                  </Text>
                </View>
                {pendingLeavesCount > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{pendingLeavesCount}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(hr)/break-requests')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#cffafe' }]}>
                  <MaterialCommunityIcons name="coffee" size={22} color="#0891b2" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionLabel}>Break Requests</Text>
                  <Text style={styles.actionStatus}>
                    {pendingBreakCount > 0 ? `${pendingBreakCount} pending` : 'All clear'}
                  </Text>
                </View>
                {pendingBreakCount > 0 && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{pendingBreakCount}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.modernSection}
          onPress={() => router.push('/(hr)/attendance')}
          activeOpacity={0.7}
        >
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Attendance Health</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} />
          </View>

          {loadingAttendance ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingLabel}>Loading…</Text>
            </View>
          ) : todayAttendance && todayAttendance.length > 0 ? (
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceRow}>
                <View style={styles.attendanceItem}>
                  <View style={[styles.attendanceIconBox, { backgroundColor: '#dcfce7' }]}>
                    <MaterialCommunityIcons name="check-circle" size={22} color="#16a34a" />
                  </View>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceValue}>{checkedInToday}</Text>
                    <Text style={styles.attendanceLabel}>Present</Text>
                  </View>
                </View>

                <View style={styles.attendanceItem}>
                  <View style={[styles.attendanceIconBox, { backgroundColor: '#fed7aa' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={22} color="#ea580c" />
                  </View>
                  <View style={styles.attendanceInfo}>
                    <Text style={styles.attendanceValue}>{yetToCheckIn}</Text>
                    <Text style={styles.attendanceLabel}>Pending</Text>
                  </View>
                </View>

                <View style={styles.attendanceItem}>
                  <View style={[styles.attendanceIconBox, { backgroundColor: '#dbeafe' }]}>
                    <MaterialCommunityIcons name="chart-line" size={22} color="#2563eb" />
                  </View>
                  <View style={styles.attendanceInfo}>
                    <Text style={[styles.attendanceValue, { color: Colors.primary }]}>{attendancePercentage}%</Text>
                    <Text style={styles.attendanceLabel}>Rate</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={36} color={Colors.gray300} />
              <Text style={styles.emptyStateTitle}>No attendance yet</Text>
              <Text style={styles.emptyStateSubtitle}>Records will appear as check-ins begin</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modernSection}
          onPress={() => router.push('/(hr)/employees')}
          activeOpacity={0.7}
        >
          <View style={styles.modernSectionHeader}>
            <Text style={styles.modernSectionTitle}>Team Overview</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.textSecondary} />
          </View>

          <View style={styles.teamCard}>
            <View style={styles.teamRow}>
              <View style={styles.teamItem}>
                <View style={[styles.teamIconBox, { backgroundColor: '#e0e7ff' }]}>
                  <MaterialCommunityIcons name="account-multiple" size={22} color="#6366f1" />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamValue}>{totalEmployees}</Text>
                  <Text style={styles.teamLabel}>Total</Text>
                </View>
              </View>

              <View style={styles.teamItem}>
                <View style={[styles.teamIconBox, { backgroundColor: '#cffafe' }]}>
                  <MaterialCommunityIcons name="shield-account" size={22} color="#06b6d4" />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamValue}>{leadershipCount}</Text>
                  <Text style={styles.teamLabel}>HR</Text>
                </View>
              </View>

              <View style={styles.teamItem}>
                <View style={[styles.teamIconBox, { backgroundColor: '#fee2e2' }]}>
                  <MaterialCommunityIcons name="account-off" size={22} color="#dc2626" />
                </View>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamValue}>{inactiveCount}</Text>
                  <Text style={styles.teamLabel}>Inactive</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing['lg'],
  },
  heroSection: {
    marginHorizontal: -Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    gap: Spacing['lg'],
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing['xl'],
  },
  heroTextBlock: {
    flex: 1,
    gap: Spacing['md'],
  },
  heroGreeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  heroDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing['xs'],
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing['md'],
    paddingVertical: Spacing['xs'],
    borderRadius: BorderRadius.full,
  },
  heroDateText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  avatarButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['md'],
    marginTop: Spacing['sm'],
    marginBottom: Spacing['sm'],
  },
  heroMetricCard: {
    flex: 1,
    minWidth: 160,
    flexBasis: '48%',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing['lg'],
    paddingHorizontal: Spacing['lg'],
    gap: Spacing['sm'],
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90,
  },
  heroMetricPrimary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroMetricSecondary: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroMetricIcon: {
    width: 48,
    height: 52,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroMetricIconOverlay: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroMetricContent: {
    flex: 1,
    gap: Spacing['xs'],
  },
  heroMetricLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
    opacity: 0.72,
    letterSpacing: 0.7,
  },
  heroMetricValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  heroMetricMeta: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textInverse,
    opacity: 0.75,
  },
  sectionBlock: {
    gap: Spacing['lg'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing['xs'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing['xs'],
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing['lg'],
    ...Shadows.sm,
  },
  loadingState: {
    alignItems: 'center',
    gap: Spacing['sm'],
    paddingVertical: Spacing['xl'],
  },
  loadingLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  pendingGrid: {
    gap: Spacing['md'],
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['md'],
    paddingVertical: Spacing['md'],
    paddingHorizontal: Spacing['md'],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContent: {
    flex: 1,
    gap: Spacing['xs'],
  },
  pendingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  pendingSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  pendingBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing['md'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCount: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  pendingCheck: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceContent: {
    gap: Spacing['lg'],
  },
  attendanceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['md'],
  },
  attendanceSummaryBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
  },
  attendanceSummaryCopy: {
    flex: 1,
    gap: Spacing['xs'],
  },
  attendanceHeadline: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  attendanceSubheadline: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  attendanceProgressContainer: {
    gap: Spacing['sm'],
  },
  attendanceProgressBar: {
    height: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  attendanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['md'],
  },
  attendanceStatItem: {
    flex: 1,
    gap: Spacing['xs'],
  },
  attendanceStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  attendancePercentage: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  attendanceMeta: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  attendanceStatLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing['sm'],
    paddingVertical: Spacing['xl'],
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  emptyStateSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  teamInsightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['md'],
  },
  teamInsightCard: {
    flexBasis: '31%',
    flexGrow: 1,
    minHeight: 120,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing['md'],
    gap: Spacing['sm'],
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  teamInsightGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  teamInsightIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInsightValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  teamInsightLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  modernSection: {
    gap: Spacing['md'],
  },
  modernSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['sm'],
  },
  modernSectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: Spacing['sm'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  actionsContainer: {
    gap: Spacing['sm'],
  },
  actionCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing['md'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['md'],
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  actionStatus: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  actionBadge: {
    backgroundColor: Colors.primary,
    minWidth: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing['sm'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },

  attendanceCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing['md'],
  },
  attendanceRow: {
    flexDirection: 'row',
    gap: Spacing['sm'],
  },
  attendanceItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing['xs'],
  },
  attendanceIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceInfo: {
    alignItems: 'center',
    gap: 2,
  },
  attendanceValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  attendanceLabel: {  
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },

  teamCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing['md'],
  },
  teamRow: {
    flexDirection: 'row',
    gap: Spacing['sm'],
  },
  teamItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing['xs'],
  },
  teamIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    alignItems: 'center',
    gap: 2,
  },
  teamValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  teamLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
});
