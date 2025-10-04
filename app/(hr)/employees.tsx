import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAllUsers } from '@/hooks/queries/useUser';
import { User } from '@/lib/types';

export default function EmployeesScreen() {
  const { data: users, isLoading } = useAllUsers();

  const renderEmployeeItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(hr)/employee/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{item.full_name}</Text>
          <Text style={styles.employeeId}>ID: {item.employee_id}</Text>
          {item.department && (
            <View style={styles.departmentRow}>
              <MaterialCommunityIcons name="office-building" size={14} color="#64748B" />
              <Text style={styles.employeeDept}>{item.department}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
          <View style={[styles.statusDot, item.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
          <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.roleBadge}>
          <MaterialCommunityIcons
            name={item.role === 'hr' || item.role === 'admin' ? 'shield-account' : 'account'}
            size={14}
            color="#6366F1"
          />
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
        {item.designation && (
          <View style={styles.designationWrapper}>
            <MaterialCommunityIcons name="account-tie" size={14} color="#64748B" />
            <Text style={styles.designation}>{item.designation}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : users && users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderEmployeeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No employees found</Text>
          <Text style={styles.emptySubtext}>Employees will appear here</Text>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  employeeInfo: {
    flex: 1,
    gap: 4,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  employeeId: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  employeeDept: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  designationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  designation: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
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
