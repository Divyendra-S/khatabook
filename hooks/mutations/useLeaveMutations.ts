import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { leaveMutations } from '@/lib/api/mutations/leave.mutations';
import { leaveKeys } from '@/hooks/queries/useLeave';
import { LeaveRequest, LeaveType } from '@/lib/types';

export const useCreateLeaveRequest = (
  userId: string,
  options?: UseMutationOptions<LeaveRequest, Error, {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => leaveMutations.createLeaveRequest({ ...params, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.upcoming(userId) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.hrPending() });
    },
    ...options,
  });
};

export const useReviewLeaveRequest = (
  options?: UseMutationOptions<LeaveRequest, Error, {
    requestId: string;
    status: 'approved' | 'rejected';
    reviewedBy: string;
    reviewerNotes?: string;
  }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status, reviewedBy, reviewerNotes }) =>
      leaveMutations.reviewLeaveRequest(requestId, status, reviewedBy, reviewerNotes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.list(data.user_id) });
      queryClient.invalidateQueries({ queryKey: leaveKeys.hrAll() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.hrPending() });
    },
    ...options,
  });
};
