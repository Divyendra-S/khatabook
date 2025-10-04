import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useHRTodayAttendance } from '@/hooks/queries/useAttendance';
import { useHRPendingSalaries } from '@/hooks/queries/useSalary';
import { useHRPendingLeaveRequests } from '@/hooks/queries/useLeave';
import { useAllUsers } from '@/hooks/queries/useUser';
import { formatDate } from '@/lib/utils/date.utils';

export default function HRDashboard() {
  const { data: todayAttendance, isLoading: loadingAttendance } = useHRTodayAttendance();
  const { data: pendingSalaries, isLoading: loadingSalaries } = useHRPendingSalaries();
  const { data: pendingLeaves, isLoading: loadingLeaves } = useHRPendingLeaveRequests();
  const { data: allUsers, isLoading: loadingUsers } = useAllUsers();

  const activeEmployees = allUsers?.filter(u => u.is_active && u.role === 'employee').length || 0;
  const checkedInToday = todayAttendance?.length || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>HR Dashboard</Text>
        <Text style={styles.date}>{formatDate(new Date())}</Text>
      </View>

      {/* Overview Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          {loadingUsers ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Text style={styles.statValue}>{activeEmployees}</Text>
              <Text style={styles.statLabel}>Active Employees</Text>
            </>
          )}
        </View>

        <View style={styles.statCard}>
          {loadingAttendance ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Text style={styles.statValue}>{checkedInToday}</Text>
              <Text style={styles.statLabel}>Present Today</Text>
            </>
          )}
        </View>
      </View>

      {/* Pending Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Actions</Text>

        {loadingLeaves || loadingSalaries ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <View style={styles.pendingList}>
            <View style={styles.pendingItem}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingCount}>{pendingLeaves?.length || 0}</Text>
              </View>
              <Text style={styles.pendingText}>Leave Requests</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.pendingItem}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingCount}>{pendingSalaries?.length || 0}</Text>
              </View>
              <Text style={styles.pendingText}>Salary Approvals</Text>
            </View>
          </View>
        )}
      </View>

      {/* Today's Attendance Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>

        {loadingAttendance ? (
          <ActivityIndicator size="small" color="#007AFF" />
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
          <Text style={styles.emptyText}>No attendance records for today</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Stats</Text>

        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Total Employees</Text>
            <Text style={styles.quickStatValue}>{allUsers?.length || 0}</Text>
          </View>

          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>HR Staff</Text>
            <Text style={styles.quickStatValue}>
              {allUsers?.filter(u => u.role === 'hr' || u.role === 'admin').length || 0}
            </Text>
          </View>

          <View style={styles.quickStat}>
            <Text style={styles.quickStatLabel}>Inactive</Text>
            <Text style={styles.quickStatValue}>
              {allUsers?.filter(u => !u.is_active).length || 0}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  pendingList: {
    gap: 0,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  pendingBadge: {
    backgroundColor: '#FF3B30',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pendingText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  attendanceSummary: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
