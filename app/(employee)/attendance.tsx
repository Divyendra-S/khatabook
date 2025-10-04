import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useAttendanceByDateRange } from '@/hooks/queries/useAttendance';
import { formatDate, formatTime, getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date.utils';
import { formatHours, getAttendanceStatus } from '@/lib/utils/attendance.utils';
import { AttendanceRecord } from '@/lib/types';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const startDate = getFirstDayOfMonth(selectedMonth).toISOString().split('T')[0];
  const endDate = getLastDayOfMonth(selectedMonth).toISOString().split('T')[0];

  const { data: records, isLoading } = useAttendanceByDateRange(userId, startDate, endDate);

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
    const status = getAttendanceStatus(item);
    const statusColors = {
      Present: { bg: '#DCFCE7', color: '#10B981', icon: 'checkmark-circle' },
      Incomplete: { bg: '#FEF3C7', color: '#F59E0B', icon: 'time-outline' },
      Absent: { bg: '#FEE2E2', color: '#EF4444', icon: 'close-circle' },
    };
    const statusConfig = statusColors[status as keyof typeof statusColors] || statusColors.Present;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.dateIconWrapper, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
            </View>
            <View>
              <Text style={styles.date}>{formatDate(new Date(item.date))}</Text>
              <Text style={styles.dateSubtext}>
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{status}</Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeCard}>
            <Ionicons name="log-in-outline" size={20} color="#10B981" />
            <View style={styles.timeCardContent}>
              <Text style={styles.timeLabel}>Check-in</Text>
              <Text style={styles.timeValue}>
                {item.check_in_time ? formatTime(new Date(item.check_in_time)) : '--:--'}
              </Text>
            </View>
          </View>

          <View style={styles.timeCard}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <View style={styles.timeCardContent}>
              <Text style={styles.timeLabel}>Check-out</Text>
              <Text style={styles.timeValue}>
                {item.check_out_time ? formatTime(new Date(item.check_out_time)) : '--:--'}
              </Text>
            </View>
          </View>

          <View style={styles.timeCard}>
            <Ionicons name="timer-outline" size={20} color="#6366F1" />
            <View style={styles.timeCardContent}>
              <Text style={styles.timeLabel}>Total Hours</Text>
              <Text style={[styles.timeValue, styles.hoursValue]}>
                {item.total_hours ? formatHours(item.total_hours) : '--'}
              </Text>
            </View>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Feather name="file-text" size={16} color="#64748B" />
              <Text style={styles.notesLabel}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const previousMonth = () => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    const now = new Date();
    if (selectedMonth.getMonth() < now.getMonth() || selectedMonth.getFullYear() < now.getFullYear()) {
      setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    }
  };

  const isCurrentMonth =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={previousMonth}
          style={styles.monthButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#6366F1" />
        </TouchableOpacity>

        <View style={styles.monthTextContainer}>
          <MaterialCommunityIcons name="calendar-month" size={20} color="#6366F1" />
          <Text style={styles.monthText}>
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.monthButton, isCurrentMonth && styles.monthButtonDisabled]}
          disabled={isCurrentMonth}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isCurrentMonth ? '#CBD5E1' : '#6366F1'}
          />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : records && records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderAttendanceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No attendance records for this month</Text>
          <Text style={styles.emptySubtext}>Records will appear here once you check in</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  monthTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dateIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeContainer: {
    gap: 12,
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
  timeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  hoursValue: {
    color: '#6366F1',
  },
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
