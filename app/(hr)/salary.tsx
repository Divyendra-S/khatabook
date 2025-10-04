import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

  const renderSalaryItem = ({ item }: { item: SalaryRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Employee ID: {item.user_id}</Text>
          <Text style={styles.monthYear}>{item.month_year}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.totalAmount}>{formatCurrency(item.total_salary)}</Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Base Salary</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.base_salary)}</Text>
        </View>

        {item.allowances > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Allowances</Text>
            <Text style={[styles.detailValue, styles.positive]}>
              +{formatCurrency(item.allowances)}
            </Text>
          </View>
        )}

        {item.bonus > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bonus</Text>
            <Text style={[styles.detailValue, styles.positive]}>
              +{formatCurrency(item.bonus)}
            </Text>
          </View>
        )}

        {item.deductions > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deductions</Text>
            <Text style={[styles.detailValue, styles.negative]}>
              -{formatCurrency(item.deductions)}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Days Worked</Text>
          <Text style={styles.detailValue}>{item.days_worked}</Text>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
            disabled={updateStatusMutation.isPending}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'approved' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.paidButton]}
            onPress={() => handleMarkPaid(item.id)}
            disabled={updateStatusMutation.isPending}
          >
            <Text style={styles.actionButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'paid' && item.paid_date && (
        <View style={styles.paidInfo}>
          <Text style={styles.paidText}>
            Paid on {formatDate(new Date(item.paid_date))}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : salaries && salaries.length > 0 ? (
        <FlatList
          data={salaries}
          renderItem={renderSalaryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No salary records available</Text>
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusdraft: {
    backgroundColor: '#f0f0f0',
  },
  statuspending: {
    backgroundColor: '#FFF3CD',
  },
  statusapproved: {
    backgroundColor: '#D4EDDA',
  },
  statuspaid: {
    backgroundColor: '#D1ECF1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#34C759',
  },
  detailsContainer: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  paidButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paidInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paidText: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
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
