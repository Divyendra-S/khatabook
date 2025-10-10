import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAllBreakRequests } from '@/hooks/queries/useBreakRequests';
import { BreakRequest } from '@/lib/types';
import BreakApprovalModal from '@/components/attendance/BreakApprovalModal';
import { formatDate, formatTime } from '@/lib/utils/date.utils';
import { calculateBreakDuration } from '@/lib/utils/attendance.utils';

export default function BreakRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<BreakRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const {
    data: breakRequests,
    isLoading,
    error,
    refetch,
    isRefreshing,
  } = useAllBreakRequests(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  );

  const pendingCount = breakRequests?.filter((req) => req.status === 'pending').length || 0;
  const approvedCount = breakRequests?.filter((req) => req.status === 'approved').length || 0;
  const rejectedCount = breakRequests?.filter((req) => req.status === 'rejected').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'clock-outline';
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const renderBreakRequestCard = ({ item }: { item: BreakRequest & {
    user?: { full_name: string; employee_id: string };
    attendance_record?: {
      date: string;
      check_in_time: string;
      check_out_time: string | null;
    };
  } }) => {
    const duration = item.requested_start_time && item.requested_end_time
      ? calculateBreakDuration(item.requested_start_time, item.requested_end_time)
      : null;

    const hours = duration ? Math.floor(duration / 60) : 0;
    const minutes = duration ? duration % 60 : 0;

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => item.status === 'pending' ? setSelectedRequest(item) : null}
        activeOpacity={item.status === 'pending' ? 0.7 : 1}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.employeeInfo}>
            <View style={styles.employeeAvatar}>
              <Ionicons name="person" size={20} color="#6366F1" />
            </View>
            <View style={styles.employeeDetails}>
              <Text style={styles.employeeName}>
                {item.user?.full_name || 'Unknown Employee'}
              </Text>
              <Text style={styles.employeeId}>
                ID: {item.user?.employee_id || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.cardLabel}>Date:</Text>
          <Text style={styles.cardValue}>
            {formatDate(new Date(item.request_date))}
          </Text>
        </View>

        {/* Break Time */}
        {item.requested_start_time && item.requested_end_time && (
          <View style={styles.cardRow}>
            <MaterialCommunityIcons name="coffee" size={16} color="#64748B" />
            <Text style={styles.cardLabel}>Break Time:</Text>
            <Text style={styles.cardValue}>
              {formatTime(new Date(item.requested_start_time))} - {formatTime(new Date(item.requested_end_time))}
            </Text>
          </View>
        )}

        {/* Duration */}
        {duration !== null && (
          <View style={styles.cardRow}>
            <Ionicons name="timer-outline" size={16} color="#64748B" />
            <Text style={styles.cardLabel}>Duration:</Text>
            <Text style={styles.cardValue}>
              {hours > 0 && `${hours}h `}{minutes}m
            </Text>
          </View>
        )}

        {/* Reason */}
        {item.reason && (
          <View style={styles.reasonSection}>
            <View style={styles.reasonHeader}>
              <Feather name="message-circle" size={14} color="#64748B" />
              <Text style={styles.reasonLabel}>Reason</Text>
            </View>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}

        {/* Footer for pending requests */}
        {item.status === 'pending' && (
          <View style={styles.cardFooter}>
            <Ionicons name="hand-right-outline" size={16} color="#6366F1" />
            <Text style={styles.cardFooterText}>Tap to review</Text>
          </View>
        )}

        {/* Reviewer notes for approved/rejected */}
        {item.status !== 'pending' && item.reviewer_notes && (
          <View style={styles.reviewerSection}>
            <Text style={styles.reviewerLabel}>Reviewer Notes:</Text>
            <Text style={styles.reviewerNotes}>{item.reviewer_notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: 'Break Requests',
            headerShown: true,
          }}
        />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading break requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen
          options={{
            title: 'Break Requests',
            headerShown: true,
          }}
        />
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load break requests</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Break Requests',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statCard,
            statusFilter === 'all' && styles.statCardActive,
          ]}
          onPress={() => setStatusFilter('all')}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{breakRequests?.length || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            styles.statCardPending,
            statusFilter === 'pending' && styles.statCardActive,
          ]}
          onPress={() => setStatusFilter('pending')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            styles.statCardApproved,
            statusFilter === 'approved' && styles.statCardActive,
          ]}
          onPress={() => setStatusFilter('approved')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statValue, { color: '#10B981' }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            styles.statCardRejected,
            statusFilter === 'rejected' && styles.statCardActive,
          ]}
          onPress={() => setStatusFilter('rejected')}
          activeOpacity={0.7}
        >
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{rejectedCount}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {breakRequests && breakRequests.length > 0 ? (
        <FlatList
          data={breakRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderBreakRequestCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refetch}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="coffee-off-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No break requests found</Text>
          <Text style={styles.emptySubtitle}>
            {statusFilter === 'all'
              ? 'There are no break requests yet.'
              : `There are no ${statusFilter} break requests.`}
          </Text>
        </View>
      )}

      {/* Break Approval Modal */}
      {selectedRequest && (
        <BreakApprovalModal
          visible={!!selectedRequest}
          onClose={() => {
            setSelectedRequest(null);
            refetch();
          }}
          breakRequest={selectedRequest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  statCardPending: {
    borderColor: '#FDE68A',
  },
  statCardApproved: {
    borderColor: '#A7F3D0',
  },
  statCardRejected: {
    borderColor: '#FECACA',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  employeeId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  reasonSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardFooterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  reviewerSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  reviewerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reviewerNotes: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
});
