import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAllUsers } from '@/hooks/queries/useUser';
import { useAllCurrentMonthEarnings } from '@/hooks/queries/useEarnings';

export default function HRSalaryScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: allUsers, isLoading: loadingUsers, refetch: refetchUsers } = useAllUsers({ isActive: true });
  const { data: currentMonthEarnings, isLoading: loadingEarnings, refetch: refetchEarnings } = useAllCurrentMonthEarnings();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchEarnings(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate total base salary of all active employees
  const totalBaseSalary = allUsers?.reduce((sum, user) => sum + (user.base_salary || 0), 0) || 0;

  // Calculate total earned this month
  const totalEarnedThisMonth = currentMonthEarnings?.reduce((sum, earning) => sum + (earning.earned_salary || 0), 0) || 0;

  // Create a map of user earnings
  const earningsMap = new Map(currentMonthEarnings?.map(e => [e.user_id, e.earned_salary || 0]) || []);

  // Filter only employees (not HR/Admin)
  const employees = allUsers?.filter(u => u.role === 'employee') || [];

  const isLoading = loadingUsers || loadingEarnings;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <View style={styles.statIconBgBlue}>
                    <MaterialCommunityIcons name="cash-multiple" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.statValue}>₹{totalBaseSalary.toLocaleString('en-IN')}</Text>
                  <Text style={styles.statLabel}>Total Base Salary</Text>
                </>
              )}
            </View>

            <View style={styles.statCard}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <View style={styles.statIconBgGreen}>
                    <MaterialCommunityIcons name="currency-inr" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.statValue}>₹{totalEarnedThisMonth.toLocaleString('en-IN')}</Text>
                  <Text style={styles.statLabel}>Total Spent This Month</Text>
                </>
              )}
            </View>
          </View>

          {/* Employee Breakdown Table */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="table" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Employee Breakdown</Text>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : employees.length > 0 ? (
              <View>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.employeeNameColumn]}>Employee</Text>
                  <Text style={[styles.tableHeaderText, styles.salaryColumn]}>Base Salary</Text>
                  <Text style={[styles.tableHeaderText, styles.earnedColumn]}>Earned</Text>
                </View>

                {/* Table Rows */}
                <View style={styles.tableBody}>
                  {employees.map((employee, index) => {
                    const earned = earningsMap.get(employee.id) || 0;
                    return (
                      <View key={employee.id}>
                        <View style={styles.tableRow}>
                          <Text style={[styles.employeeName, styles.employeeNameColumn]} numberOfLines={1}>
                            {employee.full_name}
                          </Text>
                          <Text style={[styles.baseSalary, styles.salaryColumn]}>
                            ₹{(employee.base_salary || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.earnedAmount, styles.earnedColumn]}>
                            ₹{earned.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        {index < employees.length - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>

                {/* Table Footer with Totals */}
                <View style={styles.tableFooter}>
                  <Text style={[styles.tableFooterText, styles.employeeNameColumn]}>
                    Total ({employees.length} employees)
                  </Text>
                  <Text style={[styles.tableFooterAmount, styles.salaryColumn]}>
                    ₹{totalBaseSalary.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.tableFooterAmount, styles.earnedColumn]}>
                    ₹{totalEarnedThisMonth.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons name="account-off" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateText}>No employees found</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 20,
  },
  content: {
    paddingHorizontal: 20,
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
  statIconBgBlue: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconBgGreen: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
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
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableBody: {
    gap: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  employeeNameColumn: {
    flex: 2,
  },
  salaryColumn: {
    flex: 1.2,
    textAlign: 'right',
  },
  earnedColumn: {
    flex: 1.2,
    textAlign: 'right',
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  baseSalary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  earnedAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  tableFooter: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  tableFooterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableFooterAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
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
});
