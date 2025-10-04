import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useHRAllSalaries } from '@/hooks/queries/useSalary';
import { useUpdateSalaryStatus } from '@/hooks/mutations/useSalaryMutations';
import { useAuth } from '@/hooks/auth/useAuth';
import { formatCurrency } from '@/lib/utils/salary.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { SalaryRecord } from '@/lib/types';

export default function HRSalaryScreen() {
  const { user } = useAuth();
  const { data: salaries, isLoading } = useHRAllSalaries();

  const updateStatusMutation = useUpdateSalaryStatus({
    onSuccess: () => {
      Alert.alert('Success', 'Salary status updated');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleApprove = (recordId: string) => {
    Alert.alert(
      'Approve Salary',
      'Are you sure you want to approve this salary record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () =>
            updateStatusMutation.mutate({
              recordId,
              status: 'approved',
              approvedBy: user?.id,
            }),
        },
      ]
    );
  };

  const handleMarkPaid = (recordId: string) => {
    Alert.alert(
      'Mark as Paid',
      'Are you sure you want to mark this salary as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: () =>
            updateStatusMutation.mutate({
              recordId,
              status: 'paid',
            }),
        },
      ]
    );
  };

  const renderSalaryItem = ({ item }: { item: SalaryRecord }) => {
    const statusConfig = {
      paid: { bg: '#DCFCE7', color: '#10B981', icon: 'check-circle' },
      approved: { bg: '#DBEAFE', color: '#3B82F6', icon: 'shield-check' },
      pending: { bg: '#FEF3C7', color: '#F59E0B', icon: 'clock-outline' },
      draft: { bg: '#F1F5F9', color: '#64748B', icon: 'file-document-outline' },
    };
    const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
              <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
            </View>
            <View>
              <Text style={styles.monthYear}>{item.month_year}</Text>
              <Text style={styles.cardSubtext}>
                {(item as any).users?.full_name || 'Unknown Employee'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatCurrency(item.total_salary)}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <MaterialCommunityIcons name="cash" size={18} color="#64748B" />
              <Text style={styles.detailLabel}>Base Salary</Text>
            </View>
            <Text style={styles.detailValue}>{formatCurrency(item.base_salary)}</Text>
          </View>

          {item.allowances > 0 && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailRowLeft}>
                  <MaterialCommunityIcons name="gift-outline" size={18} color="#64748B" />
                  <Text style={styles.detailLabel}>Allowances</Text>
                </View>
                <Text style={[styles.detailValue, styles.positive]}>
                  +{formatCurrency(item.allowances)}
                </Text>
              </View>
            </>
          )}

          {item.bonus > 0 && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailRowLeft}>
                  <MaterialCommunityIcons name="star-outline" size={18} color="#64748B" />
                  <Text style={styles.detailLabel}>Bonus</Text>
                </View>
                <Text style={[styles.detailValue, styles.positive]}>
                  +{formatCurrency(item.bonus)}
                </Text>
              </View>
            </>
          )}

          {item.deductions > 0 && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.detailRowLeft}>
                  <MaterialCommunityIcons name="minus-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.detailLabel}>Deductions</Text>
                </View>
                <Text style={[styles.detailValue, styles.negative]}>
                  -{formatCurrency(item.deductions)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <MaterialCommunityIcons name="calendar-range" size={18} color="#64748B" />
              <Text style={styles.detailLabel}>Days Worked</Text>
            </View>
            <Text style={styles.detailValue}>{item.days_worked} days</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprove(item.id)}
            disabled={updateStatusMutation.isPending}
            activeOpacity={0.7}
          >
            {updateStatusMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.paidButton}
            onPress={() => handleMarkPaid(item.id)}
            disabled={updateStatusMutation.isPending}
            activeOpacity={0.7}
          >
            {updateStatusMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="cash-check" size={20} color="#FFFFFF" />
                <Text style={styles.paidButtonText}>Mark as Paid</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.status === 'paid' && item.paid_date && (
          <View style={styles.paidInfo}>
            <View style={styles.paidInfoHeader}>
              <MaterialCommunityIcons name="calendar-check" size={18} color="#10B981" />
              <Text style={styles.paidLabel}>Paid On</Text>
            </View>
            <Text style={styles.paidText}>{formatDate(new Date(item.paid_date))}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : salaries && salaries.length > 0 ? (
        <FlatList
          data={salaries}
          renderItem={renderSalaryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No salary records available</Text>
          <Text style={styles.emptySubtext}>Salary records will appear here</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtext: {
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
  amountContainer: {
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  detailsContainer: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  approveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paidButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paidInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  paidInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paidLabel: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paidText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
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
