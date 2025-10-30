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

  const metricCards = [
    {
      key: 'active-employees',
      title: 'Active employees',
      value: loadingUsers ? '—' : activeEmployees,
      caption: loadingUsers ? 'Syncing roster…' : `${totalEmployees} active staff`,
      icon: 'account-group-outline' as const,
      accent: Colors.primary,
    },
    {
      key: 'yet-to-check-in',
      title: 'Yet to check in',
      value: loadingAttendance ? '—' : yetToCheckIn,
      caption:
        loadingAttendance || loadingUsers
          ? 'Refreshing attendance…'
          : `${checkedInToday} already present`,
      icon: 'clock-check-outline' as const,
      accent: Colors.warning,
    },
    {
      key: 'pending-leave',
      title: 'Leave requests',
      value: loadingLeaves ? '—' : pendingLeavesCount,
      caption: loadingLeaves ? 'Reviewing queue…' : 'Awaiting HR decision',
      icon: 'calendar-alert' as const,
      accent: Colors.secondary,
    },
    {
      key: 'pending-break',
      title: 'Break requests',
      value: loadingBreakRequests ? '—' : pendingBreakCount,
      caption: loadingBreakRequests ? 'Checking updates…' : 'For short time off',
      icon: 'coffee-outline' as const,
      accent: Colors.info,
    },
  ];

  type HRQuickRoute = '/(hr)/attendance' | '/(hr)/employees' | '/(hr)/leave';

  const quickActions = [
    {
      key: 'attendance',
      label: 'Attendance board',
      description: 'Monitor daily presence',
      icon: 'time-outline' as const,
      route: '/(hr)/attendance',
    },
    {
      key: 'employees',
      label: 'Manage employees',
      description: 'View and edit profiles',
      icon: 'people-outline' as const,
      route: '/(hr)/employees',
    },
    {
      key: 'approvals',
      label: 'Handle approvals',
      description: 'Leave and break queue',
      icon: 'clipboard-outline' as const,
      route: '/(hr)/leave',
    },
  ] satisfies ReadonlyArray<{
    key: 'attendance' | 'employees' | 'approvals';
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    route: HRQuickRoute;
  }>;

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
              <Text style={styles.heroGreeting}>Hello, {user?.full_name?.split(' ')[0]}</Text>
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
              onPress={() => router.push('/(hr)/attendance')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="account-check-outline" size={20} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>checked in</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingAttendance ? '—' : checkedInToday}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingUsers
                    ? 'Syncing roster…'
                    : 'View board'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.heroMetricCard, styles.heroMetricSecondary]}
              activeOpacity={0.85}
              onPress={() => router.push('/(hr)/leave')}
            >
              <View style={[styles.heroMetricIcon, styles.heroMetricIconOverlay]}>
                <MaterialCommunityIcons name="clipboard-clock-outline" size={20} color={Colors.textInverse} />
              </View>
              <View style={styles.heroMetricContent}>
                <Text style={styles.heroMetricLabel}>pending approvals</Text>
                <Text style={styles.heroMetricValue}>
                  {loadingLeaves || loadingBreakRequests ? '—' : totalPendingApprovals}
                </Text>
                <Text style={styles.heroMetricMeta}>
                  {loadingLeaves || loadingBreakRequests
                    ? 'Collecting requests…'
                    : `L:${pendingLeavesCount} • B:${pendingBreakCount}`}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Key metrics</Text>
            <Text style={styles.sectionSubtitle}>Compact view of today’s highlights</Text>
          </View>
          <View style={styles.metricsGrid}>
            {metricCards.map(card => (
              <TouchableOpacity
                key={card.key}
                style={styles.metricCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (card.key === 'pending-leave') router.push('/(hr)/leave');
                  if (card.key === 'pending-break') router.push('/(hr)/break-requests');
                  if (card.key === 'active-employees') router.push('/(hr)/employees');
                  if (card.key === 'yet-to-check-in') router.push('/(hr)/attendance');
                }}
              >
                <View style={[styles.metricIconBadge, { backgroundColor: card.accent + '14' }]}>
                  <MaterialCommunityIcons name={card.icon} size={20} color={card.accent} />
                </View>
                <Text style={styles.metricTitle}>{card.title}</Text>
                <Text style={styles.metricValue}>{card.value}</Text>
                <Text style={styles.metricCaption}>{card.caption}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick actions</Text>
            <Text style={styles.sectionSubtitle}>Jump straight into frequent tasks</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.quickActionCard}
                activeOpacity={0.88}
                onPress={() => router.push(action.route)}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={20} color={Colors.primaryDark} />
                </View>
                <View style={styles.quickActionContent}>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                  <Text style={styles.quickActionDescription}>{action.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pending actions</Text>
            <Text style={styles.sectionSubtitle}>Quick snapshot of approvals</Text>
          </View>

          {loadingLeaves || loadingBreakRequests ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingLabel}>Syncing approval queue…</Text>
            </View>
          ) : (
            <View style={styles.pendingGrid}>
              <TouchableOpacity
                style={styles.pendingCard}
                onPress={() => router.push('/(hr)/leave')}
                activeOpacity={0.88}
              >
                <View style={[styles.pendingIcon, { backgroundColor: Colors.warning + '1A' }]}>
                  <MaterialCommunityIcons name="beach" size={22} color={Colors.warningDark} />
                </View>
                <View style={styles.pendingContent}>
                  <Text style={styles.pendingTitle}>Leave requests</Text>
                  <Text style={styles.pendingSubtitle}>Awaiting review</Text>
                </View>
                <View style={[styles.pendingBadge, { backgroundColor: Colors.warning }]}>
                  <Text style={styles.pendingCount}>{pendingLeavesCount}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pendingCard}
                onPress={() => router.push('/(hr)/break-requests')}
                activeOpacity={0.88}
              >
                <View style={[styles.pendingIcon, { backgroundColor: Colors.info + '1A' }]}>
                  <MaterialCommunityIcons name="coffee" size={22} color={Colors.infoDark} />
                </View>
                <View style={styles.pendingContent}>
                  <Text style={styles.pendingTitle}>Break requests</Text>
                  <Text style={styles.pendingSubtitle}>
                    {pendingBreakCount > 0 ? 'Needs attention' : 'All clear'}
                  </Text>
                </View>
                {pendingBreakCount > 0 ? (
                  <View style={[styles.pendingBadge, { backgroundColor: Colors.info }]}>
                    <Text style={styles.pendingCount}>{pendingBreakCount}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/(hr)/attendance')}
          activeOpacity={0.88}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Attendance health</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </View>

          {loadingAttendance ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingLabel}>Fetching today’s attendance…</Text>
            </View>
          ) : todayAttendance && todayAttendance.length > 0 ? (
            <View style={styles.attendanceContent}>
              <View style={styles.attendanceSummaryRow}>
                <View style={styles.attendanceSummaryBadge}>
                  <MaterialCommunityIcons name="account-clock-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.attendanceSummaryCopy}>
                  <Text style={styles.attendanceHeadline}>{checkedInToday} team members present</Text>
                  <Text style={styles.attendanceSubheadline}>
                    {yetToCheckIn > 0 ? `${yetToCheckIn} still due` : 'Everyone accounted for'}
                  </Text>
                </View>
              </View>
              <View style={styles.attendanceProgressBar}>
                <View
                  style={[
                    styles.attendanceProgressFill,
                    { width: `${activeEmployees > 0 ? (checkedInToday / activeEmployees) * 100 : 0}%` },
                  ]}
                />
              </View>
              <View style={styles.attendanceFooter}>
                <Text style={styles.attendancePercentage}>{`${attendancePercentage}% of active staff`}</Text>
                <Text style={styles.attendanceMeta}>
                  {activeEmployees > 0 ? `${checkedInToday}/${activeEmployees} checked in` : 'No active employees yet'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="calendar" size={36} color={Colors.gray300} />
              <Text style={styles.emptyStateTitle}>No attendance yet</Text>
              <Text style={styles.emptyStateSubtitle}>Records will appear as soon as check-ins begin.</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/(hr)/employees')}
          activeOpacity={0.88}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Team insights</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </View>

          <View style={styles.teamInsightGrid}>
            <View style={styles.teamInsightCard}>
              <View style={[styles.teamInsightIcon, { backgroundColor: Colors.secondary + '1A' }]}>
                <MaterialCommunityIcons name="account-multiple" size={22} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.teamInsightLabel}>Total workforce</Text>
              <Text style={styles.teamInsightValue}>{totalEmployees}</Text>
            </View>

            <View style={styles.teamInsightCard}>
              <View style={[styles.teamInsightIcon, { backgroundColor: Colors.info + '1A' }]}>
                <MaterialCommunityIcons name="shield-account" size={22} color={Colors.infoDark} />
              </View>
              <Text style={styles.teamInsightLabel}>HR & admin</Text>
              <Text style={styles.teamInsightValue}>{leadershipCount}</Text>
            </View>

            <View style={styles.teamInsightCard}>
              <View style={[styles.teamInsightIcon, { backgroundColor: Colors.error + '1A' }]}>
                <MaterialCommunityIcons name="account-off" size={22} color={Colors.errorDark} />
              </View>
              <Text style={styles.teamInsightLabel}>Inactive profiles</Text>
              <Text style={styles.teamInsightValue}>{inactiveCount}</Text>
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
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['6xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing['3xl'],
  },
  heroSection: {
    marginHorizontal: -Spacing['2xl'],
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['5xl'],
    paddingBottom: Spacing['lg'],
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
    paddingVertical: Spacing['md'],
    paddingHorizontal: 18,
    gap: Spacing['sm'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetricPrimary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroMetricSecondary: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroMetricIcon: {
    width: 44,
    height: 44,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['md'],
  },
  metricCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: Spacing['lg'],
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing['sm'],
    ...Shadows.sm,
  },
  metricIconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  metricCaption: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  quickActionsGrid: {
    gap: Spacing['md'],
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['lg'],
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing['lg'],
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
  },
  quickActionContent: {
    flex: 1,
    gap: Spacing['xs'],
  },
  quickActionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  quickActionDescription: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing['lg'],
    ...Shadows.sm,
  },
  loadingState: {
    alignItems: 'center',
    gap: Spacing['sm'],
    paddingVertical: Spacing['2xl'],
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
    gap: Spacing['lg'],
    padding: Spacing['lg'],
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
  },
  pendingIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContent: {
    flex: 1,
    gap: Spacing['xs'],
  },
  pendingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  pendingSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  pendingBadge: {
    minWidth: 36,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing['md'],
    paddingVertical: Spacing['xs'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCount: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
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
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
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
  attendanceProgressBar: {
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  attendanceProgressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  attendanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendancePercentage: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryDark,
  },
  attendanceMeta: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing['sm'],
    paddingVertical: Spacing['3xl'],
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
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['lg'],
    gap: Spacing['md'],
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  teamInsightIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInsightLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  teamInsightValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
});
