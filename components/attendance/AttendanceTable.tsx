import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AttendanceWithUser, AttendanceRecord } from '@/lib/types';
import { formatTime } from '@/lib/utils/date.utils';
import {
  formatHours,
  calculateApprovedBreakHours
} from '@/lib/utils/attendance.utils';

interface AttendanceTableProps {
  data: AttendanceWithUser[];
  onEdit: (record: AttendanceRecord) => void;
  sortField: SortField;
  sortOrder: SortOrder;
}

export type SortField = 'name' | 'checkIn' | 'checkOut' | 'hours';
export type SortOrder = 'asc' | 'desc';

export default function AttendanceTable({ data, onEdit, sortField, sortOrder }: AttendanceTableProps) {

  const sortedData = [...data].sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortField) {
      case 'name':
        compareA = a.user?.full_name?.toLowerCase() || '';
        compareB = b.user?.full_name?.toLowerCase() || '';
        break;
      case 'checkIn':
        compareA = a.check_in_time || '';
        compareB = b.check_in_time || '';
        break;
      case 'checkOut':
        compareA = a.check_out_time || '';
        compareB = b.check_out_time || '';
        break;
      case 'hours':
        compareA = a.total_hours || 0;
        compareB = b.total_hours || 0;
        break;
    }

    if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <View style={styles.container}>
      <View style={styles.tableContent}>
        {sortedData.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.tableRow,
              index % 2 === 0 && styles.tableRowEven,
            ]}
            onPress={() => onEdit(item as AttendanceRecord)}
            activeOpacity={0.7}
          >
            {/* Name */}
            <View style={[styles.cell, styles.nameCell]}>
              <Text style={styles.employeeName} numberOfLines={1}>
                {item.user?.full_name || 'Unknown'}
              </Text>
            </View>

            {/* Check-in */}
            <View style={[styles.cell, styles.timeCell]}>
              <Text style={styles.timeText}>
                {item.check_in_time ? formatTime(new Date(item.check_in_time)) : '--:--'}
              </Text>
            </View>

            {/* Check-out */}
            <View style={[styles.cell, styles.timeCell]}>
              <Text style={styles.timeText}>
                {item.check_out_time ? formatTime(new Date(item.check_out_time)) : '--:--'}
              </Text>
            </View>

            {/* Hours */}
            <View style={[styles.cell, styles.hoursCell]}>
              {item.total_hours ? (
                (() => {
                  const breakRequests = item.break_requests || [];
                  const approvedBreakHours = calculateApprovedBreakHours(breakRequests);
                  const hasApprovedBreaks = approvedBreakHours > 0;

                  if (hasApprovedBreaks) {
                    // total_hours already has breaks deducted by database
                    return (
                      <View style={styles.hoursWithBreakContainer}>
                        <View style={styles.hoursRow}>
                          <Text style={styles.hoursText}>
                            {formatHours(item.total_hours)}
                          </Text>
                          <MaterialCommunityIcons name="coffee-outline" size={12} color="#F59E0B" />
                        </View>
                        <Text style={styles.breakSubtext}>
                          -{formatHours(approvedBreakHours)}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <Text style={styles.hoursText}>
                      {formatHours(item.total_hours)}
                    </Text>
                  );
                })()
              ) : (
                <Text style={styles.hoursText}>--</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Export header as a separate component
export function AttendanceTableHeader({
  sortField,
  sortOrder,
  onSort,
}: {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <Ionicons name="swap-vertical" size={14} color="#94A3B8" />;
    }
    return (
      <Ionicons
        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
        size={14}
        color="#6366F1"
      />
    );
  };

  return (
    <View style={styles.tableHeader}>
      <TouchableOpacity
        style={[styles.headerCell, styles.nameCell]}
        onPress={() => onSort('name')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Name</Text>
        <SortIcon field="name" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.headerCell, styles.timeCell]}
        onPress={() => onSort('checkIn')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>In</Text>
        <SortIcon field="checkIn" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.headerCell, styles.timeCell]}
        onPress={() => onSort('checkOut')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Out</Text>
        <SortIcon field="checkOut" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.headerCell, styles.hoursCell]}
        onPress={() => onSort('hours')}
        activeOpacity={0.7}
      >
        <Text style={styles.headerText}>Hours</Text>
        <SortIcon field="hours" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tableContent: {
    paddingBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  tableRowEven: {
    backgroundColor: '#FAFBFC',
  },
  cell: {
    justifyContent: 'center',
  },
  nameCell: {
    flex: 2,
    paddingRight: 8,
    justifyContent: 'flex-start',
  },
  timeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  hoursText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  hoursWithBreakContainer: {
    alignItems: 'center',
    gap: 2,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breakSubtext: {
    fontSize: 9,
    fontWeight: '600',
    color: '#F59E0B',
  },
});
