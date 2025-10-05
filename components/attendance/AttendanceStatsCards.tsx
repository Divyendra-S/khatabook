import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AttendanceStatsCardsProps {
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  averageHours: number;
}

export default function AttendanceStatsCards({
  totalEmployees,
  presentCount,
  absentCount,
  averageHours,
}: AttendanceStatsCardsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        {/* Total Employees */}
        <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#6366F1' }]}>
            <MaterialCommunityIcons name="account-group" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.statValue}>{totalEmployees}</Text>
          <Text style={styles.statLabel}>Total Employees</Text>
        </View>

        {/* Present Today */}
        <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present Today</Text>
        </View>

        {/* Absent Today */}
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{absentCount}</Text>
          <Text style={styles.statLabel}>Absent Today</Text>
        </View>

        {/* Average Hours */}
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="timer" size={20} color="#FFFFFF" />
          </View>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {averageHours.toFixed(1)}h
          </Text>
          <Text style={styles.statLabel}>Avg Hours</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
