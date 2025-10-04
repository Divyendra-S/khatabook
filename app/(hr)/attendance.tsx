import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useHRAllEmployeesAttendance } from '@/hooks/queries/useAttendance';
import { formatDate, formatTime, formatDateToISO } from '@/lib/utils/date.utils';
import { formatHours, getAttendanceStatus } from '@/lib/utils/attendance.utils';
import { AttendanceWithUser, AttendanceRecord } from '@/lib/types';
import MarkAttendanceModal from '@/components/attendance/MarkAttendanceModal';

export default function HRAttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | undefined>(undefined);
  const targetDate = formatDateToISO(selectedDate);

  const { data: records, isLoading } = useHRAllEmployeesAttendance({
    date: targetDate,
  });

  const handleMarkAttendance = () => {
    setSelectedRecord(undefined);
    setModalVisible(true);
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const renderAttendanceItem = ({ item }: { item: AttendanceWithUser }) => {
    const status = getAttendanceStatus(item);
    const statusColors = {
      Present: { bg: '#DCFCE7', color: '#10B981', icon: 'checkmark-circle' },
      Incomplete: { bg: '#FEF3C7', color: '#F59E0B', icon: 'time-outline' },
      Absent: { bg: '#FEE2E2', color: '#EF4444', icon: 'close-circle' },
    };
    const statusConfig = statusColors[status as keyof typeof statusColors] || statusColors.Present;

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleEditAttendance(item as AttendanceRecord)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.dateIconWrapper, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon as any} size={24} color={statusConfig.color} />
            </View>
            <View>
              <Text style={styles.employeeName}>{item.user?.full_name || 'Unknown'}</Text>
              <Text style={styles.employeeId}>ID: {item.user?.employee_id}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{status}</Text>
          </View>
        </View>

        <Text style={styles.date}>{formatDate(new Date(item.date))}</Text>

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
      </TouchableOpacity>
    );
  };

  const previousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const nextDay = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate < now) {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
      });
    }
  };

  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.markButton}
          onPress={handleMarkAttendance}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.markButtonText}>Mark Attendance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={previousDay}
          style={styles.monthButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#6366F1" />
        </TouchableOpacity>

        <View style={styles.monthTextContainer}>
          <MaterialCommunityIcons name="calendar-today" size={20} color="#6366F1" />
          <Text style={styles.monthText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={nextDay}
          style={[styles.monthButton, isToday && styles.monthButtonDisabled]}
          disabled={isToday}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={isToday ? '#CBD5E1' : '#6366F1'}
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
          <Text style={styles.emptyText}>No employees found</Text>
          <Text style={styles.emptySubtext}>Add employees to track their attendance</Text>
        </View>
      )}

      <MarkAttendanceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedRecord(undefined);
        }}
        existingRecord={selectedRecord}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerActions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    marginBottom: 12,
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
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeeId: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  date: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 16,
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
