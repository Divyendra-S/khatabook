import AssignBreakModal from "@/components/attendance/AssignBreakModal";
import AttendanceStatsCards from "@/components/attendance/AttendanceStatsCards";
import AttendanceTable, {
  AttendanceTableHeader,
} from "@/components/attendance/AttendanceTable";
import MarkAttendanceModal from "@/components/attendance/MarkAttendanceModal";
import { useHRAllEmployeesAttendance } from "@/hooks/queries/useAttendance";
import { useAllUsers } from "@/hooks/queries/useUser";
import { AttendanceRecord, AttendanceWithUser } from "@/lib/types";
import { getAttendanceStatus } from "@/lib/utils/attendance.utils";
import { formatDateToISO } from "@/lib/utils/date.utils";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from "react-native-safe-area-context";

type StatusFilter = "all" | "present" | "absent" | "incomplete";
type SortField = "name" | "checkIn" | "checkOut" | "hours";
type SortOrder = "asc" | "desc";

export default function HRAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<
    AttendanceRecord | undefined
  >(undefined);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<
    string | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [assignBreakModalVisible, setAssignBreakModalVisible] = useState(false);
  const [selectedRecordForBreak, setSelectedRecordForBreak] = useState<
    AttendanceWithUser | undefined
  >(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const targetDate = formatDateToISO(selectedDate);

  const {
    data: records,
    isLoading,
    refetch,
  } = useHRAllEmployeesAttendance({
    date: targetDate,
  });

  const { data: allEmployees } = useAllUsers({
    role: "employee",
    isActive: true,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEmployees = allEmployees?.length || 0;
    // Count both 'Present' (checked in + out) and 'Incomplete' (only checked in) as present
    const presentCount =
      records?.filter((r) => {
        const status = getAttendanceStatus(r);
        return status === "Present" || status === "Incomplete";
      }).length || 0;
    const totalHours =
      records?.reduce((sum, r) => sum + (r.total_hours || 0), 0) || 0;
    const averageHours =
      records && records.length > 0 ? totalHours / records.length : 0;
    const absentCount = totalEmployees - (records?.length || 0);

    return {
      totalEmployees,
      presentCount,
      absentCount,
      averageHours,
    };
  }, [records, allEmployees]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!records) return [];

    let filtered = [...records];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.user?.full_name?.toLowerCase().includes(query) ||
          r.user?.employee_id?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => {
        const status = getAttendanceStatus(r).toLowerCase();
        return status === statusFilter;
      });
    }

    return filtered;
  }, [records, searchQuery, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAttendance = () => {
    setSelectedRecord(undefined);
    setSelectedEmployeeId(undefined);
    setModalVisible(true);
  };

  const handleEditAttendance = (record: AttendanceRecord) => {
    // Check if this is a placeholder record for an absent employee
    if (record.id.startsWith("absent-")) {
      // For absent employees, open modal in "create" mode with employee pre-selected
      setSelectedRecord(undefined);
      setSelectedEmployeeId(record.user_id);
      setModalVisible(true);
      return;
    }

    setSelectedRecord(record);
    setSelectedEmployeeId(undefined);
    setModalVisible(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleAssignBreak = (record: AttendanceWithUser) => {
    setSelectedRecordForBreak(record);
    setAssignBreakModalVisible(true);
  };

  const previousDay = () => {
    setSelectedDate((prev) => {
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
      setSelectedDate((prev) => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + 1);
        return newDate;
      });
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const handleDatePickerChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const statusFilterOptions = [
    { value: "all" as StatusFilter, label: "All", count: records?.length || 0 },
    {
      value: "present" as StatusFilter,
      label: "Present",
      count: stats.presentCount,
    },
    {
      value: "incomplete" as StatusFilter,
      label: "Incomplete",
      count:
        records?.filter((r) => getAttendanceStatus(r) === "Incomplete")
          .length || 0,
    },
    {
      value: "absent" as StatusFilter,
      label: "Absent",
      count: stats.absentCount,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[5]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Attendance</Text>
          <TouchableOpacity
            style={styles.markButton}
            onPress={handleMarkAttendance}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.markButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={previousDay}
            style={styles.monthButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#6366F1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.monthTextContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={20}
              color="#6366F1"
            />
            <Text style={styles.monthText}>
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextDay}
            style={[styles.monthButton, isToday && styles.monthButtonDisabled]}
            disabled={isToday}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={isToday ? "#CBD5E1" : "#6366F1"}
            />
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <AttendanceStatsCards
          totalEmployees={stats.totalEmployees}
          presentCount={stats.presentCount}
          absentCount={stats.absentCount}
          averageHours={stats.averageHours}
        />

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94A3B8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterChips}
            contentContainerStyle={styles.filterChipsContent}
          >
            {statusFilterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  statusFilter === option.value && styles.filterChipActive,
                ]}
                onPress={() => setStatusFilter(option.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === option.value &&
                      styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                <View
                  style={[
                    styles.filterChipBadge,
                    statusFilter === option.value &&
                      styles.filterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipBadgeText,
                      statusFilter === option.value &&
                        styles.filterChipBadgeTextActive,
                    ]}
                  >
                    {option.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sticky Table Header - Index 5 */}
        <AttendanceTableHeader
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Table Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : filteredRecords && filteredRecords.length > 0 ? (
          <AttendanceTable
            data={filteredRecords}
            onEdit={handleEditAttendance}
            onAssignBreak={handleAssignBreak}
            sortField={sortField}
            sortOrder={sortOrder}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== "all"
                ? "No matching records"
                : "No attendance records"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Mark attendance to see records here"}
            </Text>
          </View>
        )}
      </ScrollView>

      <MarkAttendanceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedRecord(undefined);
          setSelectedEmployeeId(undefined);
        }}
        existingRecord={selectedRecord}
        employeeId={selectedEmployeeId}
      />

      {selectedRecordForBreak && (
        <AssignBreakModal
          visible={assignBreakModalVisible}
          onClose={() => {
            setAssignBreakModalVisible(false);
            setSelectedRecordForBreak(undefined);
          }}
          attendanceRecord={selectedRecordForBreak}
        />
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <>
          {Platform.OS === 'android' ? (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDatePickerChange}
              maximumDate={new Date()}
            />
          ) : (
            <View style={styles.iosPickerOverlay}>
              <TouchableOpacity
                style={styles.iosPickerBackdrop}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              />
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <Text style={styles.iosPickerTitle}>Select Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.iosPickerDoneButton}
                  >
                    <Text style={styles.iosPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDatePickerChange}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  markButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  monthButtonDisabled: {
    backgroundColor: "#F1F5F9",
    opacity: 0.5,
  },
  monthTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  monthText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  filtersContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
  filterChips: {
    marginTop: 4,
  },
  filterChipsContent: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterChipBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  filterChipBadgeActive: {
    backgroundColor: "#818CF8",
  },
  filterChipBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  filterChipBadgeTextActive: {
    color: "#FFFFFF",
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
  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  iosPickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iosPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  iosPickerDoneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  iosPickerDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iosDatePicker: {
    height: 200,
  },
});
