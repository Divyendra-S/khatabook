import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCurrentMonthEarnings } from '@/hooks/queries/useEarnings';
import { formatCurrency } from '@/lib/utils/salary.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function SalaryScreen() {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [refreshing, setRefreshing] = useState(false);

  const { data: currentEarnings, isLoading, refetch } = useCurrentMonthEarnings(userId);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const baseSalary = user?.base_salary || 0;
  const hourlyRate = user?.hourly_rate || 0;
  const earnedSalary = currentEarnings?.earned_salary || 0;
  const totalHoursWorked = currentEarnings?.total_hours_worked || 0;
  const expectedHours = currentEarnings?.expected_hours || 0;

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salary Overview</Text>
        <Text style={styles.headerSubtitle}>{currentMonth}</Text>
      </View>

      {/* Monthly Base Salary Card */}
      <View style={styles.card}>
        <View style={styles.cardIconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.primary + '15' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={28} color={Colors.primary} />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>Monthly Base Salary</Text>
          <Text style={[styles.cardValue, { color: Colors.primary }]}>
            {formatCurrency(baseSalary)}
          </Text>
          <Text style={styles.cardSubtext}>Fixed monthly compensation</Text>
        </View>
      </View>

      {/* Hourly Rate Card */}
      <View style={styles.card}>
        <View style={styles.cardIconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.secondary + '15' }]}>
            <Ionicons name="time-outline" size={28} color={Colors.secondary} />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>Hourly Rate</Text>
          <Text style={[styles.cardValue, { color: Colors.secondary }]}>
            {formatCurrency(hourlyRate)}/hr
          </Text>
          <Text style={styles.cardSubtext}>Current month rate</Text>
        </View>
      </View>

      {/* Earned Salary Till Now Card */}
      <View style={styles.card}>
        <View style={styles.cardIconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.success + '15' }]}>
            <MaterialCommunityIcons name="wallet-outline" size={28} color={Colors.success} />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>Earned This Month</Text>
          <Text style={[styles.cardValue, { color: Colors.success }]}>
            {formatCurrency(earnedSalary)}
          </Text>
          <View style={styles.progressInfo}>
            <Text style={styles.cardSubtext}>
              {totalHoursWorked.toFixed(1)} hrs worked
              {expectedHours > 0 && ` of ${expectedHours.toFixed(1)} hrs expected`}
            </Text>
          </View>
          {expectedHours > 0 && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min((totalHoursWorked / expectedHours) * 100, 100)}%`,
                      backgroundColor: Colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round((totalHoursWorked / expectedHours) * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
        <Text style={styles.infoText}>
          Your earned salary is calculated based on hours worked and your hourly rate. The final
          salary will be processed at the end of the month.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  card: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadows.md,
  },
  cardIconWrapper: {
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  cardSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.regular,
  },
  progressInfo: {
    marginTop: Spacing.xs,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressPercentage: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    minWidth: 40,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '10',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing['2xl'],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },
});