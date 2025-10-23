import BreakRequestModal from "@/components/attendance/BreakRequestModal";
import WiFiVerificationModal, {
  WiFiVerificationResult,
} from "@/components/attendance/WiFiVerificationModal";
import SalaryProgressCard from "@/components/salary/SalaryProgressCard";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useCheckIn,
  useCheckOut,
} from "@/hooks/mutations/useAttendanceMutations";
import {
  useMonthlyAttendanceSummary,
  useTodayAttendance,
} from "@/hooks/queries/useAttendance";
import { useMyBreakRequests } from "@/hooks/queries/useBreakRequests";
import { useCurrentMonthEarnings } from "@/hooks/queries/useEarnings";
import { useLatestSalary } from "@/hooks/queries/useSalary";
import { useAutoRejectExpiredBreaks } from "@/hooks/useAutoRejectExpiredBreaks";
import { WeekDay } from "@/lib/types";
import {
  calculateBreakDuration,
  formatHours,
} from "@/lib/utils/attendance.utils";
import { formatDate, formatTime } from "@/lib/utils/date.utils";
import { formatCurrency } from "@/lib/utils/salary.utils";
import { performWiFiVerification } from "@/lib/utils/wifiVerification.utils";
import {
  formatWorkingDays,
  isTodayWorkingDay,
} from "@/lib/utils/workingDays.utils";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmployeeDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [showBreakRequestModal, setShowBreakRequestModal] = useState(false);

  // WiFi Verification Modal State
  const [showWiFiModal, setShowWiFiModal] = useState(false);
  const [wifiVerificationResult, setWifiVerificationResult] =
    useState<WiFiVerificationResult | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "check-in" | "check-out" | null
  >(null);

  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || "";

  const {
    data: todayAttendance,
    isLoading: loadingToday,
    refetch: refetchToday,
  } = useTodayAttendance(userId);
  const {
    data: monthlySummary,
    isLoading: loadingMonthly,
    refetch: refetchMonthly,
  } = useMonthlyAttendanceSummary(
    userId,
    new Date().getMonth(),
    new Date().getFullYear()
  );
  const {
    data: latestSalary,
    isLoading: loadingSalary,
    refetch: refetchSalary,
  } = useLatestSalary(userId);
  const {
    data: earnings,
    isLoading: loadingEarnings,
    refetch: refetchEarnings,
  } = useCurrentMonthEarnings(userId);
  const { data: myBreakRequests, refetch: refetchBreakRequests } =
    useMyBreakRequests(userId);

  // Auto-reject expired pending break requests
  useAutoRejectExpiredBreaks(userId);

  // Find pending break request for today's attendance
  const pendingBreakRequest = myBreakRequests?.find(
    (req: any) =>
      req.attendance_record_id === todayAttendance?.id &&
      req.status === "pending"
  );

  // Find approved break requests for today
  const approvedBreakRequests =
    myBreakRequests?.filter(
      (req: any) =>
        req.attendance_record_id === todayAttendance?.id &&
        req.status === "approved"
    ) || [];

  // Check break states
  const now = new Date();

  // Find upcoming break (approved but starts in future)
  const upcomingBreak = approvedBreakRequests.find((req: any) => {
    if (!req.approved_start_time || !req.approved_end_time) return false;
    const startTime = new Date(req.approved_start_time);
    return now < startTime;
  });

  // Find ongoing break (currently happening)
  const ongoingBreak = approvedBreakRequests.find((req: any) => {
    if (!req.approved_start_time || !req.approved_end_time) return false;
    const startTime = new Date(req.approved_start_time);
    const endTime = new Date(req.approved_end_time);
    return now >= startTime && now <= endTime;
  });

  // Calculate total break duration for today
  const totalBreakDuration = approvedBreakRequests.reduce(
    (total: number, req: any) => {
      if (req.approved_start_time && req.approved_end_time) {
        return (
          total +
          calculateBreakDuration(req.approved_start_time, req.approved_end_time)
        );
      }
      return total;
    },
    0
  );

  const checkInMutation = useCheckIn(userId, {
    onSuccess: () => {
      Alert.alert("Success", "Checked in successfully!");
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "Failed to check in. Please try again."
      );
    },
  });

  const checkOutMutation = useCheckOut(userId, {
    onSuccess: () => {
      Alert.alert("Success", "Checked out successfully!");
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error.message || "Failed to check out. Please try again."
      );
    },
  });

  const handleCheckIn = async () => {
    if (!user?.organization_id) {
      Alert.alert("Error", "Organization not found. Please contact support.");
      return;
    }

    // Perform WiFi verification
    const wifiResult = await performWiFiVerification(userId, user.organization_id);

    // Show modal with verification result
    setWifiVerificationResult(wifiResult);
    setPendingAction("check-in");
    setShowWiFiModal(true);

    // Only proceed if verification passed OR not required
    if (!wifiResult.isRequired || wifiResult.isVerified) {
      // Proceed with check-in after modal is shown
      setTimeout(() => {
        checkInMutation.mutate({
          notes: "Self check-in",
          wifiInfo: wifiResult.isVerified
            ? {
                ssid: wifiResult.currentSsid,
                verified: true,
              }
            : undefined,
        });
      }, 2000); // Give user 2 seconds to see the modal
    } else {
      // Verification required but failed - don't proceed
      console.log("WiFi verification failed. Check-in blocked.");
    }
  };

  const handleCheckOut = async () => {
    // Prevent checkout if break is ongoing
    if (ongoingBreak) {
      const endTime = new Date(ongoingBreak.approved_end_time);
      Alert.alert(
        "Break in Progress",
        `You cannot check out during a break. Your break ends at ${formatTime(
          endTime
        )}. Please wait until your break is complete.`,
        [{ text: "OK" }]
      );
      return;
    }

    // Prevent checkout if upcoming break is scheduled
    if (upcomingBreak) {
      const startTime = new Date(upcomingBreak.approved_start_time);
      Alert.alert(
        "Break Scheduled",
        `You cannot check out yet. You have a scheduled break starting at ${formatTime(
          startTime
        )}. Please complete or cancel the break first.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (!todayAttendance?.id) {
      Alert.alert(
        "Error",
        "No attendance record found. Please check in first."
      );
      return;
    }

    if (!user?.organization_id) {
      Alert.alert("Error", "Organization not found. Please contact support.");
      return;
    }

    // Perform WiFi verification
    const wifiResult = await performWiFiVerification(userId, user.organization_id);

    // Show modal with verification result
    setWifiVerificationResult(wifiResult);
    setPendingAction("check-out");
    setShowWiFiModal(true);

    // Only proceed if verification passed OR not required
    if (!wifiResult.isRequired || wifiResult.isVerified) {
      // Proceed with check-out after modal is shown
      setTimeout(() => {
        checkOutMutation.mutate({
          recordId: todayAttendance.id,
          notes: "Self check-out",
          wifiInfo: wifiResult.isVerified
            ? {
                ssid: wifiResult.currentSsid,
                verified: true,
              }
            : undefined,
        });
      }, 2000); // Give user 2 seconds to see the modal
    } else {
      // Verification required but failed - don't proceed
      console.log("WiFi verification failed. Check-out blocked.");
    }
  };

  const isCheckedIn = todayAttendance && !todayAttendance.check_out_time;
  const workingDays = (user?.working_days || []) as WeekDay[];
  const isTodayWorking = isTodayWorkingDay(workingDays);
  const canCheckIn = !todayAttendance && isTodayWorking;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchToday(),
        refetchMonthly(),
        refetchSalary(),
        refetchEarnings(),
        refetchBreakRequests(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              Hello, {user?.full_name?.split(" ")[0]}
            </Text>
            <Text style={styles.date}>{formatDate(new Date())}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
        alwaysBounceVertical={true}
      >
        {/* Content Cards */}
        <View style={styles.content}>
          {/* Attendance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={24} color="#6366F1" />
                </View>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
              </View>
              {todayAttendance && !todayAttendance.check_out_time && (
                <View style={styles.liveBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.liveText}>Active</Text>
                </View>
              )}
            </View>

            {loadingToday ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <>
                {todayAttendance ? (
                  <View style={styles.attendanceInfo}>
                    <View style={styles.timeCard}>
                      <Ionicons
                        name="log-in-outline"
                        size={20}
                        color="#10B981"
                      />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Check In</Text>
                        <Text style={styles.timeCardValue}>
                          {formatTime(new Date(todayAttendance.check_in_time))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeCard}>
                      <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#EF4444"
                      />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Check Out</Text>
                        <Text style={styles.timeCardValue}>
                          {todayAttendance.check_out_time
                            ? formatTime(
                                new Date(todayAttendance.check_out_time)
                              )
                            : "--:--"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.timeCard}>
                      <Ionicons
                        name="timer-outline"
                        size={20}
                        color="#6366F1"
                      />
                      <View style={styles.timeCardContent}>
                        <Text style={styles.timeCardLabel}>Total Hours</Text>
                        <Text style={[styles.timeCardValue, styles.hoursValue]}>
                          {formatHours(todayAttendance.total_hours || 0)}
                        </Text>
                        {totalBreakDuration > 0 && (
                          <Text style={styles.breakDeductionText}>
                            (Break: -{Math.floor(totalBreakDuration / 60)}h{" "}
                            {totalBreakDuration % 60}m deducted)
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyStateContainer}>
                    <Feather name="calendar" size={40} color="#94A3B8" />
                    <Text style={styles.emptyStateText}>
                      No attendance recorded today
                    </Text>
                  </View>
                )}

                {!todayAttendance && !isTodayWorking && (
                  <View style={styles.nonWorkingDayContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#F59E0B"
                    />
                    <Text style={styles.nonWorkingDayTitle}>
                      Not a Working Day
                    </Text>
                    <Text style={styles.nonWorkingDayText}>
                      Today is not a configured working day
                    </Text>
                    {workingDays.length > 0 && (
                      <Text style={styles.workingDaysText}>
                        Working days: {formatWorkingDays(workingDays)}
                      </Text>
                    )}
                  </View>
                )}

                {canCheckIn && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCheckIn}
                    disabled={checkInMutation.isPending}
                    style={styles.primaryButton}
                  >
                    {checkInMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>
                          Check In Now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {isCheckedIn && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleCheckOut}
                      disabled={
                        checkOutMutation.isPending ||
                        !!ongoingBreak ||
                        !!upcomingBreak
                      }
                      style={[
                        styles.checkOutButton,
                        (ongoingBreak || upcomingBreak) &&
                          styles.checkOutButtonDisabled,
                      ]}
                    >
                      {checkOutMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name="exit-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.checkOutButtonText}>
                            {ongoingBreak
                              ? "On Break - Cannot Check Out"
                              : upcomingBreak
                              ? "Break Scheduled - Cannot Check Out"
                              : "Check Out"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {upcomingBreak ? (
                      <View style={styles.upcomingBreakCard}>
                        {/* Status Badge */}
                        <View style={styles.upcomingStatusBadge}>
                          <View style={styles.pulseDotBlue} />
                          <Text style={styles.upcomingStatusText}>
                            Break Scheduled
                          </Text>
                        </View>

                        {/* Time Display */}
                        <View style={styles.breakTimeDisplay}>
                          <View style={styles.breakTimeMain}>
                            <MaterialCommunityIcons
                              name="coffee-outline"
                              size={32}
                              color="#3B82F6"
                            />
                            <View style={styles.breakTimeInfo}>
                              <Text style={styles.breakTimeLabel}>
                                Break Time
                              </Text>
                              <Text
                                style={[
                                  styles.breakTimeValue,
                                  { color: "#1E40AF" },
                                ]}
                              >
                                {formatTime(
                                  new Date(upcomingBreak.approved_start_time)
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  new Date(upcomingBreak.approved_end_time)
                                )}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.breakDurationBadge,
                              {
                                backgroundColor: "#DBEAFE",
                                borderColor: "#93C5FD",
                              },
                            ]}
                          >
                            <Ionicons name="timer" size={16} color="#3B82F6" />
                            <Text
                              style={[
                                styles.breakDurationText,
                                { color: "#3B82F6" },
                              ]}
                            >
                              {Math.floor(
                                calculateBreakDuration(
                                  upcomingBreak.approved_start_time,
                                  upcomingBreak.approved_end_time
                                ) / 60
                              )}
                              h{" "}
                              {calculateBreakDuration(
                                upcomingBreak.approved_start_time,
                                upcomingBreak.approved_end_time
                              ) % 60}
                              m
                            </Text>
                          </View>
                        </View>

                        {/* Reason */}
                        {upcomingBreak.reason && (
                          <View style={styles.breakReasonContainer}>
                            <View style={styles.breakReasonHeader}>
                              <Feather
                                name="message-circle"
                                size={14}
                                color="#1E40AF"
                              />
                              <Text
                                style={[
                                  styles.breakReasonLabel,
                                  { color: "#1E40AF" },
                                ]}
                              >
                                Reason
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.breakReasonText,
                                { color: "#1E3A8A" },
                              ]}
                            >
                              {upcomingBreak.reason}
                            </Text>
                          </View>
                        )}

                        {/* Footer Message */}
                        <View
                          style={[
                            styles.breakPendingFooter,
                            {
                              backgroundColor: "#DBEAFE",
                              borderColor: "#93C5FD",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={16}
                            color="#1E40AF"
                          />
                          <Text
                            style={[
                              styles.breakPendingFooterText,
                              { color: "#1E40AF" },
                            ]}
                          >
                            Starts at{" "}
                            {formatTime(
                              new Date(upcomingBreak.approved_start_time)
                            )}
                          </Text>
                        </View>
                      </View>
                    ) : ongoingBreak ? (
                      <View style={styles.ongoingBreakCard}>
                        {/* Status Badge */}
                        <View style={styles.ongoingStatusBadge}>
                          <View style={styles.pulseDotGreen} />
                          <Text style={styles.ongoingStatusText}>
                            Break in Progress
                          </Text>
                        </View>

                        {/* Time Display */}
                        <View style={styles.breakTimeDisplay}>
                          <View style={styles.breakTimeMain}>
                            <MaterialCommunityIcons
                              name="coffee"
                              size={32}
                              color="#10B981"
                            />
                            <View style={styles.breakTimeInfo}>
                              <Text style={styles.breakTimeLabel}>
                                Break Time
                              </Text>
                              <Text
                                style={[
                                  styles.breakTimeValue,
                                  { color: "#065F46" },
                                ]}
                              >
                                {formatTime(
                                  new Date(ongoingBreak.approved_start_time)
                                )}{" "}
                                -{" "}
                                {formatTime(
                                  new Date(ongoingBreak.approved_end_time)
                                )}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.breakDurationBadge,
                              {
                                backgroundColor: "#D1FAE5",
                                borderColor: "#6EE7B7",
                              },
                            ]}
                          >
                            <Ionicons name="timer" size={16} color="#10B981" />
                            <Text
                              style={[
                                styles.breakDurationText,
                                { color: "#10B981" },
                              ]}
                            >
                              {Math.floor(
                                calculateBreakDuration(
                                  ongoingBreak.approved_start_time,
                                  ongoingBreak.approved_end_time
                                ) / 60
                              )}
                              h{" "}
                              {calculateBreakDuration(
                                ongoingBreak.approved_start_time,
                                ongoingBreak.approved_end_time
                              ) % 60}
                              m
                            </Text>
                          </View>
                        </View>

                        {/* Reason */}
                        {ongoingBreak.reason && (
                          <View style={styles.breakReasonContainer}>
                            <View style={styles.breakReasonHeader}>
                              <Feather
                                name="message-circle"
                                size={14}
                                color="#78350F"
                              />
                              <Text style={styles.breakReasonLabel}>
                                Reason
                              </Text>
                            </View>
                            <Text style={styles.breakReasonText}>
                              {ongoingBreak.reason}
                            </Text>
                          </View>
                        )}

                        {/* Footer Message */}
                        <View
                          style={[
                            styles.breakPendingFooter,
                            {
                              backgroundColor: "#D1FAE5",
                              borderColor: "#A7F3D0",
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="clock-check-outline"
                            size={16}
                            color="#047857"
                          />
                          <Text
                            style={[
                              styles.breakPendingFooterText,
                              { color: "#047857" },
                            ]}
                          >
                            Ends at{" "}
                            {formatTime(
                              new Date(ongoingBreak.approved_end_time)
                            )}
                          </Text>
                        </View>
                      </View>
                    ) : pendingBreakRequest ? (
                      <View style={styles.pendingBreakCard}>
                        {/* Status Badge */}
                        <View style={styles.pendingStatusBadge}>
                          <View style={styles.pulseDotOrange} />
                          <Text style={styles.pendingStatusText}>
                            Pending Approval
                          </Text>
                        </View>

                        {/* Time Display */}
                        {pendingBreakRequest.requested_start_time &&
                          pendingBreakRequest.requested_end_time && (
                            <View style={styles.breakTimeDisplay}>
                              <View style={styles.breakTimeMain}>
                                <MaterialCommunityIcons
                                  name="coffee"
                                  size={32}
                                  color="#F59E0B"
                                />
                                <View style={styles.breakTimeInfo}>
                                  <Text style={styles.breakTimeLabel}>
                                    Break Time
                                  </Text>
                                  <Text style={styles.breakTimeValue}>
                                    {formatTime(
                                      new Date(
                                        pendingBreakRequest.requested_start_time
                                      )
                                    )}{" "}
                                    -{" "}
                                    {formatTime(
                                      new Date(
                                        pendingBreakRequest.requested_end_time
                                      )
                                    )}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.breakDurationBadge}>
                                <Ionicons
                                  name="timer"
                                  size={16}
                                  color="#F59E0B"
                                />
                                <Text style={styles.breakDurationText}>
                                  {Math.floor(
                                    calculateBreakDuration(
                                      pendingBreakRequest.requested_start_time,
                                      pendingBreakRequest.requested_end_time
                                    ) / 60
                                  )}
                                  h{" "}
                                  {calculateBreakDuration(
                                    pendingBreakRequest.requested_start_time,
                                    pendingBreakRequest.requested_end_time
                                  ) % 60}
                                  m
                                </Text>
                              </View>
                            </View>
                          )}

                        {/* Reason */}
                        {pendingBreakRequest.reason && (
                          <View style={styles.breakReasonContainer}>
                            <View style={styles.breakReasonHeader}>
                              <Feather
                                name="message-circle"
                                size={14}
                                color="#78350F"
                              />
                              <Text style={styles.breakReasonLabel}>
                                Reason
                              </Text>
                            </View>
                            <Text style={styles.breakReasonText}>
                              {pendingBreakRequest.reason}
                            </Text>
                          </View>
                        )}

                        {/* Footer Message */}
                        <View style={styles.breakPendingFooter}>
                          <MaterialCommunityIcons
                            name="shield-check-outline"
                            size={16}
                            color="#92400E"
                          />
                          <Text style={styles.breakPendingFooterText}>
                            Awaiting HR review and approval
                          </Text>
                        </View>
                      </View>
                    ) : !pendingBreakRequest &&
                      !upcomingBreak &&
                      !ongoingBreak ? (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowBreakRequestModal(true)}
                        style={styles.breakRequestButton}
                      >
                        <MaterialCommunityIcons
                          name="coffee-outline"
                          size={18}
                          color="#F59E0B"
                        />
                        <Text style={styles.breakRequestButtonText}>
                          Request Break
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </>
                )}
              </>
            )}
          </View>

          {/* Monthly Stats */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="chart-box-outline"
                    size={24}
                    color="#6366F1"
                  />
                </View>
                <Text style={styles.cardTitle}>This Month's Summary</Text>
              </View>
            </View>

            {loadingMonthly ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : (
              <View style={styles.statsContainer}>
                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgGreen}>
                      <MaterialCommunityIcons
                        name="calendar-check"
                        size={24}
                        color="#10B981"
                      />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Days Present</Text>
                    <Text style={styles.statItemValue}>
                      {monthlySummary?.totalDays || 0} days
                    </Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgBlue}>
                      <MaterialCommunityIcons
                        name="check-circle-outline"
                        size={24}
                        color="#3B82F6"
                      />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Valid Days</Text>
                    <Text style={styles.statItemValue}>
                      {monthlySummary?.validDays || 0} days
                    </Text>
                  </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItemRow}>
                  <View style={styles.statIconWrapper}>
                    <View style={styles.statIconBgPurple}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={24}
                        color="#8B5CF6"
                      />
                    </View>
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statItemLabel}>Total Hours</Text>
                    <Text style={styles.statItemValue}>
                      {Math.round(monthlySummary?.totalHours || 0)} hrs
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Monthly Earnings */}
          {user?.base_salary != null && user.base_salary > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name="cash-multiple"
                      size={24}
                      color="#6366F1"
                    />
                  </View>
                  <Text style={styles.cardTitle}>This Month's Earnings</Text>
                </View>
              </View>

              {loadingEarnings ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#6366F1" />
                </View>
              ) : (
                <SalaryProgressCard
                  earnedSalary={earnings?.earned_salary || 0}
                  baseSalary={user.base_salary || 0}
                  hoursWorked={earnings?.total_hours_worked || 0}
                  expectedHours={earnings?.expected_hours || 0}
                  compact={false}
                />
              )}
            </View>
          )}

          {/* Latest Salary */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="currency-usd"
                    size={24}
                    color="#6366F1"
                  />
                </View>
                <Text style={styles.cardTitle}>Latest Salary</Text>
              </View>
            </View>

            {loadingSalary ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : latestSalary ? (
              <View style={styles.salaryContent}>
                <View style={styles.salaryAmountContainer}>
                  <Text style={styles.salaryAmountLabel}>Total Amount</Text>
                  <Text style={styles.salaryAmount}>
                    {formatCurrency(latestSalary.total_salary)}
                  </Text>
                </View>

                <View style={styles.salaryDetails}>
                  <View style={styles.salaryRow}>
                    <View style={styles.salaryRowLeft}>
                      <MaterialCommunityIcons
                        name="calendar-month"
                        size={18}
                        color="#64748B"
                      />
                      <Text style={styles.salaryLabel}>Month</Text>
                    </View>
                    <Text style={styles.salaryValue}>
                      {latestSalary.month_year}
                    </Text>
                  </View>

                  <View style={styles.salaryRow}>
                    <View style={styles.salaryRowLeft}>
                      <MaterialCommunityIcons
                        name="information-outline"
                        size={18}
                        color="#64748B"
                      />
                      <Text style={styles.salaryLabel}>Status</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        latestSalary.status === "paid"
                          ? styles.statusPaid
                          : latestSalary.status === "approved"
                          ? styles.statusApproved
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {latestSalary.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={40}
                  color="#94A3B8"
                />
                <Text style={styles.emptyStateText}>
                  No salary records available
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Break Request Modal */}
      {todayAttendance && (
        <BreakRequestModal
          visible={showBreakRequestModal}
          onClose={() => setShowBreakRequestModal(false)}
          attendanceRecord={todayAttendance}
        />
      )}

      {/* WiFi Verification Modal */}
      {wifiVerificationResult && (
        <WiFiVerificationModal
          visible={showWiFiModal}
          onClose={() => setShowWiFiModal(false)}
          verificationResult={wifiVerificationResult}
          action={pendingAction || "check-in"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6366F1",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: "#6366F1",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    color: "#E0E7FF",
    fontWeight: "500",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6366F1",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  attendanceInfo: {
    gap: 12,
    marginBottom: 20,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  timeCardContent: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },
  timeCardValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  hoursValue: {
    color: "#6366F1",
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkOutButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  checkOutButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#94A3B8",
  },
  breakDeductionText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    fontStyle: "italic",
  },
  statsContainer: {
    gap: 0,
  },
  statItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  statIconBgGreen: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  statIconBgBlue: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },
  statIconBgPurple: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  statContent: {
    flex: 1,
    gap: 4,
  },
  statItemLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  statDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  salaryContent: {
    gap: 20,
  },
  salaryAmountContainer: {
    backgroundColor: "#F0FDF4",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  salaryAmountLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  salaryAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#10B981",
  },
  salaryDetails: {
    gap: 16,
  },
  salaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salaryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  salaryLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  salaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: "#DCFCE7",
  },
  statusApproved: {
    backgroundColor: "#DBEAFE",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#0F172A",
  },
  nonWorkingDayContainer: {
    backgroundColor: "#FEF3C7",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  nonWorkingDayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    marginTop: 8,
  },
  nonWorkingDayText: {
    fontSize: 14,
    color: "#78350F",
    textAlign: "center",
  },
  workingDaysText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  breakRequestButton: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  breakRequestButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  breakRequestButtonText: {
    color: "#92400E",
    fontSize: 15,
    fontWeight: "600",
  },
  breakRequestButtonTextDisabled: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  upcomingBreakCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 0,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#93C5FD",
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  ongoingBreakCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 0,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#6EE7B7",
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  pendingBreakCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 0,
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#FDE047",
    overflow: "hidden",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  upcomingStatusBadge: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#93C5FD",
  },
  pulseDotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
  },
  upcomingStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E40AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ongoingStatusBadge: {
    backgroundColor: "#D1FAE5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#A7F3D0",
  },
  pulseDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  ongoingStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pendingStatusBadge: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  pulseDotOrange: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  pendingStatusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakTimeDisplay: {
    padding: 16,
    gap: 12,
  },
  breakTimeMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  breakTimeInfo: {
    flex: 1,
  },
  breakTimeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakTimeValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#78350F",
    letterSpacing: -0.5,
  },
  breakDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  breakDurationText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },
  breakReasonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  breakReasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  breakReasonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  breakReasonText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
    fontWeight: "500",
  },
  breakPendingFooter: {
    backgroundColor: "#FDE68A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  breakPendingFooterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
});
