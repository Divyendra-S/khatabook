import { useAuth } from "@/hooks/auth/useAuth";
import { useReviewLeaveRequest } from "@/hooks/mutations/useLeaveMutations";
import { useHRAllLeaveRequests } from "@/hooks/queries/useLeave";
import { LeaveRequest } from "@/lib/types";
import { formatDate } from "@/lib/utils/date.utils";
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
    const statusColors = {
      pending: "#FFF3CD",
      approved: "#D4EDDA",
      rejected: "#F8D7DA",
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userId}>
            Employee: {item.user_id.substring(0, 8)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusColors[item.status as keyof typeof statusColors],
              },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={[styles.leaveTypeBadge, { backgroundColor: "#007AFF20" }]}>
          <Text style={[styles.leaveTypeText, { color: "#007AFF" }]}>
            {item.leave_type}
          </Text>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>From:</Text>
            <Text style={styles.dateValue}>
              {formatDate(new Date(item.start_date))}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>To:</Text>
            <Text style={styles.dateValue}>
              {formatDate(new Date(item.end_date))}
            </Text>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Days:</Text>
            <Text style={styles.dateValue}>{item.total_days}</Text>
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.status === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item.id)}
              disabled={reviewMutation.isPending}
            >
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.reviewer_notes && (
          <View style={styles.reviewerNotesContainer}>
            <Text style={styles.reviewerNotesLabel}>Reviewer Notes:</Text>
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
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : leaveRequests && leaveRequests.length > 0 ? (
        <FlatList
          data={leaveRequests}
          renderItem={renderLeaveItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leave requests</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userId: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  leaveTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  leaveTypeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateContainer: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  reasonContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reasonLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#34C759",
  },
  rejectButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  reviewerNotesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  reviewerNotesLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  reviewerNotesText: {
    fontSize: 14,
    color: "#1a1a1a",
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
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
