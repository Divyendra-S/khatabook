import SalaryProgressCard from "@/components/salary/SalaryProgressCard";
import CollapsibleCard from "@/components/ui/CollapsibleCard";
import { useDeleteEmployee } from "@/hooks/mutations/useUserMutations";
import { useCurrentWeekAttendanceForAll } from "@/hooks/queries/useAttendance";
import { useAllCurrentMonthEarnings } from "@/hooks/queries/useEarnings";
import { useAllUsers } from "@/hooks/queries/useUser";
import { User } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/salary.utils";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployeesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const { data: allUsers, isLoading, refetch: refetchUsers } = useAllUsers();
  const { data: earnings, refetch: refetchEarnings } =
    useAllCurrentMonthEarnings();
  const { data: weeklyAttendance, refetch: refetchWeeklyAttendance } =
    useCurrentWeekAttendanceForAll();

  // Filter out HR and admin users to show only employees
  const users = allUsers?.filter(
    (user) => user.role !== "hr" && user.role !== "admin"
  );

  const deleteEmployee = useDeleteEmployee({
    onSuccess: () => {
      console.log("✅ [EmployeesList] Delete success callback triggered");
      setDeletingUserId(null);
      Alert.alert("Success", "Employee deleted successfully");
    },
    onError: (error) => {
      console.error("❌ [EmployeesList] Delete error callback triggered");
      console.error("❌ [EmployeesList] Error:", error);
      setDeletingUserId(null);
      Alert.alert("Error", `Failed to delete employee: ${error.message}`);
    },
  });

  // Create a map for quick earnings lookup
  const earningsMap =
    earnings?.reduce((acc, earning) => {
      acc[earning.user_id] = earning;
      return acc;
    }, {} as Record<string, (typeof earnings)[0]>) || {};

  // Weekly attendance is already a map of userId -> days count
  const weeklyAttendanceMap = weeklyAttendance || {};

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchEarnings(),
        refetchWeeklyAttendance(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteEmployee = (employee: User) => {
    console.log("🗑️ [EmployeesList] Delete button clicked");
    console.log("🗑️ [EmployeesList] Employee:", employee);
    console.log("🗑️ [EmployeesList] Employee ID:", employee.id);

    Alert.alert(
      "Delete Employee",
      `Are you sure you want to delete ${employee.full_name}? This will permanently delete all their data including attendance, salary records, and leave requests. This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("🗑️ [EmployeesList] Delete cancelled"),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log(
              "🗑️ [EmployeesList] Delete confirmed, calling mutation..."
            );
            console.log(
              "🗑️ [EmployeesList] Setting deletingUserId to:",
              employee.id
            );
            setDeletingUserId(employee.id);
            deleteEmployee.mutate(employee.id);
          },
        },
      ]
    );
  };

  const renderEmployeeItem = ({ item }: { item: User }) => {
    const employeeEarnings = earningsMap[item.id];
    const daysWorkedThisWeek = weeklyAttendanceMap[item.id] || 0;

    // Convert values to numbers
    const baseSalary = Number(item.base_salary || 0);
    const hourlyRate = Number(item.hourly_rate || 0);
    const earnedSalary = Number(employeeEarnings?.earned_salary || 0);
    const hoursWorked = Number(employeeEarnings?.total_hours_worked || 0);
    const expectedHours = Number(employeeEarnings?.expected_hours || 0);

    const hasSalaryData = baseSalary > 0;

    // Create subtitle for collapsed state
    const subtitle = hasSalaryData
      ? `${formatCurrency(earnedSalary)} earned so far this month`
      : // • ${daysWorkedThisWeek} ${daysWorkedThisWeek === 1 ? 'day' : 'days'} this week`
        `${item.role} • ${item.is_active ? "Active" : "Inactive"}`;

    return (
      <View style={styles.cardWrapper}>
        <CollapsibleCard
          title={item.full_name || "Unknown Employee"}
          subtitle={subtitle}
          icon="person"
          defaultExpanded={false}
        >
          <View style={styles.cardContent}>
            {/* Basic Info */}
            <View style={styles.infoSection}>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <MaterialCommunityIcons
                    name={
                      item.role === "hr" || item.role === "admin"
                        ? "shield-account"
                        : "account"
                    }
                    size={14}
                    color="#6366F1"
                  />
                  <Text style={styles.roleText}>{item.role}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.is_active
                      ? styles.statusActive
                      : styles.statusInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      item.is_active
                        ? styles.statusDotActive
                        : styles.statusDotInactive,
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {item.is_active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              {(item.department || item.designation) && (
                <View style={styles.detailsGrid}>
                  {item.department && (
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="office-building"
                        size={18}
                        color="#6366F1"
                      />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Department</Text>
                        <Text style={styles.detailValue}>
                          {item.department}
                        </Text>
                      </View>
                    </View>
                  )}

                  {item.designation && (
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="account-tie"
                        size={18}
                        color="#6366F1"
                      />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Designation</Text>
                        <Text style={styles.detailValue}>
                          {item.designation}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Salary Information */}
            {hasSalaryData ? (
              <View style={styles.salarySection}>
                <SalaryProgressCard
                  earnedSalary={earnedSalary}
                  baseSalary={baseSalary}
                  hoursWorked={hoursWorked}
                  expectedHours={expectedHours}
                  hourlyRate={hourlyRate > 0 ? hourlyRate : undefined}
                  daysWorkedThisWeek={daysWorkedThisWeek}
                  compact={false}
                />
              </View>
            ) : (
              <View style={styles.noSalarySection}>
                <MaterialCommunityIcons
                  name="cash-off"
                  size={24}
                  color="#94A3B8"
                />
                <Text style={styles.noSalaryText}>No salary configuration</Text>
              </View>
            )}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => router.push(`/(hr)/employee/${item.id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.viewDetailsText}>View Full Profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButtonCard,
                  deletingUserId === item.id && styles.deleteButtonDisabled,
                ]}
                onPress={() => handleDeleteEmployee(item)}
                activeOpacity={0.7}
                disabled={deletingUserId === item.id}
              >
                {deletingUserId === item.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </CollapsibleCard>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(hr)/employee/add")}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Employee</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : users && users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderEmployeeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No employees found</Text>
          <Text style={styles.emptySubtext}>
            Tap the button above to add your first employee
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerActions: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  cardContent: {
    gap: 20,
  },
  infoSection: {
    gap: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  detailsGrid: {
    gap: 14,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  salarySection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  noSalarySection: {
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 16,
  },
  noSalaryText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  deleteButtonCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusActive: {
    backgroundColor: "#DCFCE7",
  },
  statusInactive: {
    backgroundColor: "#FEE2E2",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: "#10B981",
  },
  statusDotInactive: {
    backgroundColor: "#EF4444",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});
