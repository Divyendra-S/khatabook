import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAllUsers } from '@/hooks/queries/useUser';
import { useAllCurrentMonthEarnings } from '@/hooks/queries/useEarnings';
import { downloadBulkSalarySheet, getAvailableCompletedMonths } from '@/lib/utils/bulkSalarySheet.utils';

export default function HRSalaryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<{
    month: number;
    year: number;
    monthName: string;
  } | null>(null);
  const [availableMonths, setAvailableMonths] = useState<Array<{
    month: number;
    year: number;
    monthName: string;
    employeeCount: number;
  }>>([]);

  const { data: allUsers, isLoading: loadingUsers, refetch: refetchUsers } = useAllUsers({ isActive: true });
  const { data: currentMonthEarnings, isLoading: loadingEarnings, refetch: refetchEarnings } = useAllCurrentMonthEarnings();

  // Load available completed months on mount
  useEffect(() => {
    loadAvailableMonths();
  }, []);

  const loadAvailableMonths = async () => {
    try {
      const months = await getAvailableCompletedMonths();
      setAvailableMonths(months);
    } catch (error) {
      console.error('Error loading available months:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchEarnings(),
        loadAvailableMonths(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectMonth = (month: number, year: number, monthName: string) => {
    setSelectedMonth({ month, year, monthName });
    setShowMonthPicker(false);
  };

  const handleDownloadSalarySheet = async () => {
    if (!selectedMonth) return;

    setDownloading(true);
    try {
      await downloadBulkSalarySheet(selectedMonth.month, selectedMonth.year);
      Alert.alert('Success', 'Salary sheet generated successfully!', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Error downloading salary sheet:', error);
      Alert.alert('Error', 'Failed to generate salary sheet. Please try again.', [{ text: 'OK' }]);
    } finally {
      setDownloading(false);
    }
  };

  // Calculate total base salary of all active employees
  const totalBaseSalary = allUsers?.reduce((sum, user) => sum + (user.base_salary || 0), 0) || 0;

  // Calculate total earned this month
  const totalEarnedThisMonth = currentMonthEarnings?.reduce((sum: number, earning: any) => sum + (Number(earning.earned_salary) || 0), 0) || 0;

  // Create a map of user earnings
  const earningsMap = new Map(currentMonthEarnings?.map((e: any) => [e.user_id, Number(e.earned_salary) || 0]) || []);

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
                  <Text style={styles.statValue}>₹{Math.floor(totalBaseSalary).toLocaleString('en-IN')}</Text>
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
                  <Text style={styles.statValue}>₹{Math.floor(totalEarnedThisMonth).toLocaleString('en-IN')}</Text>
                  <Text style={styles.statLabel}>Total Spent This Month</Text>
                </>
              )}
            </View>
          </View>

          {/* Salary Sheet Download Section */}
          <View style={styles.downloadCard}>
            <View style={styles.downloadCardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="file-download" size={24} color="#de1f26" />
                </View>
                <Text style={styles.cardTitle}>Generate Salary Sheet</Text>
              </View>
            </View>

            <View style={styles.downloadContent}>
              {/* Month Selector */}
              <TouchableOpacity
                style={styles.monthSelector}
                onPress={() => setShowMonthPicker(true)}
                disabled={availableMonths.length === 0}
              >
                <View style={styles.monthSelectorLeft}>
                  <MaterialCommunityIcons name="calendar-month" size={20} color="#64748B" />
                  <Text style={styles.monthSelectorText}>
                    {selectedMonth ? selectedMonth.monthName : 'Select Month'}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>

              {/* Download Button */}
              <TouchableOpacity
                style={[styles.downloadButton, (!selectedMonth || downloading) && styles.downloadButtonDisabled]}
                onPress={handleDownloadSalarySheet}
                disabled={!selectedMonth || downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="download" size={20} color="#FFFFFF" />
                    <Text style={styles.downloadButtonText}>Download PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {availableMonths.length === 0 && (
              <View style={styles.noMonthsHint}>
                <MaterialCommunityIcons name="information" size={16} color="#64748B" />
                <Text style={styles.noMonthsHintText}>
                  No completed months available. Salary sheets are available after month ends.
                </Text>
              </View>
            )}
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
                            ₹{Math.floor(employee.base_salary || 0).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.earnedAmount, styles.earnedColumn]}>
                            ₹{Math.floor(earned).toLocaleString('en-IN')}
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
                    ₹{Math.floor(totalBaseSalary).toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.tableFooterAmount, styles.earnedColumn]}>
                    ₹{Math.floor(totalEarnedThisMonth).toLocaleString('en-IN')}
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

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.monthList} showsVerticalScrollIndicator={false}>
              {availableMonths.length > 0 ? (
                availableMonths.map((monthData) => {
                  const isSelected = selectedMonth?.month === monthData.month && selectedMonth?.year === monthData.year;
                  return (
                    <TouchableOpacity
                      key={`${monthData.year}-${monthData.month}`}
                      style={[styles.monthItem, isSelected && styles.monthItemSelected]}
                      onPress={() => handleSelectMonth(monthData.month, monthData.year, monthData.monthName)}
                    >
                      <View style={styles.monthItemLeft}>
                        <MaterialCommunityIcons
                          name="calendar-month"
                          size={24}
                          color={isSelected ? "#de1f26" : "#6366F1"}
                        />
                        <View style={styles.monthInfo}>
                          <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                            {monthData.monthName}
                          </Text>
                          <Text style={styles.monthEmployeeCount}>
                            {monthData.employeeCount} employee{monthData.employeeCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={20} color="#de1f26" />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyMonthsContainer}>
                  <MaterialCommunityIcons name="calendar-remove" size={48} color="#94A3B8" />
                  <Text style={styles.emptyMonthsText}>No completed months available</Text>
                  <Text style={styles.emptyMonthsSubtext}>
                    Salary sheets are only available after the month ends
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  downloadCard: {
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
  downloadCardHeader: {
    marginBottom: 16,
  },
  downloadContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  monthSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  noMonthsHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  noMonthsHintText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#de1f26',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#de1f26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthList: {
    maxHeight: 400,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthItemSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#de1f26',
    borderWidth: 2,
  },
  monthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  monthNameSelected: {
    color: '#de1f26',
  },
  monthEmployeeCount: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyMonthsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyMonthsText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyMonthsSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
