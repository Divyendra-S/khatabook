import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useHRAllAttendanceRecords } from '@/hooks/queries/useAttendance';
import { formatDate, formatTime, getFirstDayOfMonth, getLastDayOfMonth } from '@/lib/utils/date.utils';
import { formatHours, getAttendanceStatus } from '@/lib/utils/attendance.utils';
import { AttendanceWithUser } from '@/lib/types';

export default function HRAttendanceScreen() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const startDate = getFirstDayOfMonth(selectedMonth).toISOString().split('T')[0];
  const endDate = getLastDayOfMonth(selectedMonth).toISOString().split('T')[0];

  const { data: records, isLoading } = useHRAllAttendanceRecords({
    startDate,
    endDate,
  });

  const renderAttendanceItem = ({ item }: { item: AttendanceWithUser }) => {
    const status = getAttendanceStatus(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{item.user?.full_name || 'Unknown'}</Text>
            <Text style={styles.employeeId}>ID: {item.user?.employee_id}</Text>
          </View>
          <View style={[styles.statusBadge, styles[`status${status}`]]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <Text style={styles.date}>{formatDate(new Date(item.date))}</Text>

        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Check-in</Text>
            <Text style={styles.timeValue}>
              {item.check_in_time ? formatTime(new Date(item.check_in_time)) : '-'}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Check-out</Text>
            <Text style={styles.timeValue}>
              {item.check_out_time ? formatTime(new Date(item.check_out_time)) : '-'}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Hours</Text>
            <Text style={styles.timeValue}>
              {item.total_hours ? formatHours(item.total_hours) : '-'}
            </Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
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
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.monthButton, isCurrentMonth && styles.monthButtonDisabled]}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.monthButtonText, isCurrentMonth && styles.monthButtonTextDisabled]}>
            →
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : records && records.length > 0 ? (
        <FlatList
          data={records}
          renderItem={renderAttendanceItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance records for this month</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthButton: {
    padding: 8,
    paddingHorizontal: 16,
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  monthButtonTextDisabled: {
    color: '#999',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  employeeId: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPresent: {
    backgroundColor: '#D1F2EB',
  },
  statusIncomplete: {
    backgroundColor: '#FFF3CD',
  },
  statusAbsent: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1a1a1a',
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
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
