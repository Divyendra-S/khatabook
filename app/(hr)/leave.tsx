import { useAuth } from "@/hooks/auth/useAuth";
import { useReviewLeaveRequest } from "@/hooks/mutations/useLeaveMutations";
import { useHRAllLeaveRequests } from "@/hooks/queries/useLeave";
import { LeaveRequest } from "@/lib/types";
import { formatDate } from "@/lib/utils/date.utils";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HRLeaveScreen() {
  const { user } = useAuth();
  const { data: leaveRequests, isLoading } = useHRAllLeaveRequests();

  const reviewMutation = useReviewLeaveRequest({
    onSuccess: () => {
      Alert.alert("Success", "Leave request reviewed");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleApprove = (requestId: string) => {
    Alert.alert(
      "Approve Leave",
      "Are you sure you want to approve this leave request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () =>
            reviewMutation.mutate({
              requestId,
              status: "approved",
              reviewedBy: user?.id || "",
            }),
        },
      ]
    );
  };

  const handleReject = (requestId: string) => {
    Alert.alert(
      "Reject Leave",
      "Are you sure you want to reject this leave request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () =>
            reviewMutation.mutate({
              requestId,
              status: "rejected",
              reviewedBy: user?.id || "",
              reviewerNotes: "Rejected by HR",
            }),
        },
      ]
    );
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => {
    const statusConfig = {
      pending: { bg: "#FEF3C7", color: "#F59E0B", icon: "clock-outline" },
      approved: { bg: "#DCFCE7", color: "#10B981", icon: "check-circle" },
      rejected: { bg: "#FEE2E2", color: "#EF4444", icon: "close-circle" },
    };
    const leaveTypeConfig = {
      sick: { bg: "#FEE2E2", color: "#EF4444", icon: "medical-bag" },
      casual: { bg: "#DBEAFE", color: "#3B82F6", icon: "coffee" },
      earned: { bg: "#DCFCE7", color: "#10B981", icon: "star" },
      unpaid: { bg: "#F3E8FF", color: "#A855F7", icon: "cash-off" },
      other: { bg: "#F1F5F9", color: "#64748B", icon: "dots-horizontal" },
    };
    const config =
      statusConfig[item.status as keyof typeof statusConfig] ||
      statusConfig.pending;
    const typeConfig =
      leaveTypeConfig[item.leave_type as keyof typeof leaveTypeConfig] ||
      leaveTypeConfig.other;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.leaveIconWrapper,
                { backgroundColor: typeConfig.bg },
              ]}
            >
              <MaterialCommunityIcons
                name={typeConfig.icon as any}
                size={24}
                color={typeConfig.color}
              />
            </View>
            <View>
              <Text style={styles.leaveTypeTitle}>{item.leave_type}</Text>
              <Text style={styles.cardSubtext}>
                Employee: {item.user_id.substring(0, 8)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.dateRangeContainer}>
          <View style={styles.dateRow}>
            <View style={styles.dateRowLeft}>
              <Ionicons name="calendar-outline" size={18} color="#64748B" />
              <Text style={styles.dateLabel}>From</Text>
            </View>
            <Text style={styles.dateValue}>
              {formatDate(new Date(item.start_date))}
            </Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateRow}>
            <View style={styles.dateRowLeft}>
              <Ionicons name="calendar" size={18} color="#64748B" />
              <Text style={styles.dateLabel}>To</Text>
            </View>
            <Text style={styles.dateValue}>
              {formatDate(new Date(item.end_date))}
            </Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateRow}>
            <View style={styles.dateRowLeft}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={18}
                color="#64748B"
              />
              <Text style={styles.dateLabel}>Total Days</Text>
            </View>
            <Text style={styles.dateValue}>
              {item.total_days || 0} day{(item.total_days || 0) > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <View style={styles.reasonHeader}>
            <Feather name="message-square" size={16} color="#64748B" />
            <Text style={styles.reasonLabel}>Reason</Text>
          </View>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item.id)}
              disabled={reviewMutation.isPending}
              activeOpacity={0.7}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApprove(item.id)}
              disabled={reviewMutation.isPending}
              activeOpacity={0.7}
            >
              {reviewMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {item.reviewer_notes && (
          <View style={styles.reviewerNotesContainer}>
            <View style={styles.reviewerNotesHeader}>
              <MaterialCommunityIcons
                name="comment-text-outline"
                size={16}
                color="#6366F1"
              />
              <Text style={styles.reviewerNotesLabel}>Reviewer Notes</Text>
            </View>
            <Text style={styles.reviewerNotesText}>{item.reviewer_notes}</Text>
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
      ) : leaveRequests && leaveRequests.length > 0 ? (
        <FlatList
          data={leaveRequests}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="beach" size={64} color="#CBD5E1" />
          <Text style={styles.emptyText}>No leave requests</Text>
          <Text style={styles.emptySubtext}>
            Leave requests will appear here
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
  listContent: {
    padding: 20,
    paddingBottom: 32,
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
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  leaveIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveTypeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "capitalize",
  },
  cardSubtext: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateRangeContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  dateDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  reasonContainer: {
    marginBottom: 8,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#10B981",
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  reviewerNotesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
  },
  reviewerNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  reviewerNotesLabel: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewerNotesText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
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
