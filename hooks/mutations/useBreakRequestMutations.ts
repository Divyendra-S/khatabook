import { attendanceKeys } from "@/hooks/queries/useAttendance";
import { breakRequestKeys } from "@/hooks/queries/useBreakRequests";
import { breakRequestMutations } from "@/lib/api/mutations/breakRequests.mutations";
import { BreakRequest } from "@/lib/types";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";

/**
 * Hook for creating a break request (employee)
 */
export const useCreateBreakRequest = (
  userId: string,
  options?: UseMutationOptions<
    BreakRequest,
    Error,
    {
      attendanceRecordId: string;
      requestDate: string;
      requestedStartTime?: string;
      requestedEndTime?: string;
      reason?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.createBreakRequest({
        userId,
        ...params,
      }),
    onSuccess: async (data, variables, context) => {
      // Await query invalidation to ensure refetch completes before modal closes
      await Promise.all([
        // Invalidate user's break requests
        queryClient.invalidateQueries({
          queryKey: breakRequestKeys.my(userId),
        }),

        // Invalidate pending break requests (for HR)
        queryClient.invalidateQueries({ queryKey: breakRequestKeys.pending() }),

        // Invalidate break requests for this attendance record
        queryClient.invalidateQueries({
          queryKey: breakRequestKeys.byAttendance(data.attendance_record_id),
        }),

        // Invalidate today's attendance
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.today(userId),
        }),
      ]);

      // Call the user's onSuccess callback if provided
      await options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
};

/**
 * Hook for approving a break request (HR)
 */
export const useApproveBreakRequest = (
  reviewedBy: string,
  options?: UseMutationOptions<
    BreakRequest,
    Error,
    {
      breakRequestId: string;
      approvedStartTime: string;
      approvedEndTime: string;
      reviewerNotes?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.approveBreakRequest({
        ...params,
        reviewedBy,
      }),
    onSuccess: (data) => {
      // Invalidate all break request queries
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.all });

      // Invalidate attendance queries for the affected user
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.today(data.user_id),
      });

      // Invalidate attendance by date range
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

      // Invalidate monthly summary for the affected date
      const requestDate = new Date(data.request_date);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(
          data.user_id,
          requestDate.getMonth(),
          requestDate.getFullYear()
        ),
      });
    },
    ...options,
  });
};

/**
 * Hook for rejecting a break request (HR)
 */
export const useRejectBreakRequest = (
  reviewedBy: string,
  options?: UseMutationOptions<
    BreakRequest,
    Error,
    {
      breakRequestId: string;
      reviewerNotes?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.rejectBreakRequest({
        ...params,
        reviewedBy,
      }),
    onSuccess: (data) => {
      // Invalidate all break request queries
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.all });

      // Invalidate user's break requests
      queryClient.invalidateQueries({
        queryKey: breakRequestKeys.my(data.user_id),
      });
    },
    ...options,
  });
};

/**
 * Hook for cancelling a break request (employee)
 */
export const useCancelBreakRequest = (
  userId: string,
  options?: UseMutationOptions<BreakRequest, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (breakRequestId: string) =>
      breakRequestMutations.cancelBreakRequest(breakRequestId),
    onSuccess: () => {
      // Invalidate user's break requests
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.my(userId) });

      // Invalidate pending break requests
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.pending() });
    },
    ...options,
  });
};

/**
 * Hook for deleting a break request (employee)
 */
export const useDeleteBreakRequest = (
  userId: string,
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (breakRequestId: string) =>
      breakRequestMutations.deleteBreakRequest(breakRequestId),
    onSuccess: () => {
      // Invalidate user's break requests
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.my(userId) });

      // Invalidate pending break requests
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.pending() });
    },
    ...options,
  });
};

/**
 * Hook for updating an existing break request (HR only)
 */
export const useUpdateBreakRequest = (
  updatedBy: string,
  options?: UseMutationOptions<
    BreakRequest,
    Error,
    {
      breakRequestId: string;
      approvedStartTime: string;
      approvedEndTime: string;
      notes?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.updateBreakRequest({
        ...params,
        updatedBy,
      }),
    onSuccess: (data) => {
      // Invalidate all break request queries
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.all });

      // Invalidate attendance queries for the affected user
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.today(data.user_id),
      });

      // Invalidate all attendance records (HR view)
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

      // Invalidate monthly summary for the affected date
      const requestDate = new Date(data.request_date);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(
          data.user_id,
          requestDate.getMonth(),
          requestDate.getFullYear()
        ),
      });
    },
    ...options,
  });
};

/**
 * Hook for HR to directly assign a break to an employee (auto-approved)
 */
export const useAssignBreakByHR = (
  assignedBy: string,
  options?: UseMutationOptions<
    BreakRequest,
    Error,
    {
      userId: string;
      attendanceRecordId: string;
      requestDate: string;
      approvedStartTime: string;
      approvedEndTime: string;
      notes?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.assignBreakByHR({
        ...params,
        assignedBy,
      }),
    onSuccess: (data) => {
      // Invalidate all break request queries
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.all });

      // Invalidate attendance queries for the affected user
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.today(data.user_id),
      });

      // Invalidate all attendance records (HR view)
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

      // Invalidate monthly summary for the affected date
      const requestDate = new Date(data.request_date);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(
          data.user_id,
          requestDate.getMonth(),
          requestDate.getFullYear()
        ),
      });
    },
    ...options,
  });
};

/**
 * Hook for HR to remove/delete a break (removes from both break_requests and attendance_records)
 */
export const useRemoveBreak = (
  removedBy: string,
  options?: UseMutationOptions<
    void,
    Error,
    {
      breakRequestId: string;
      userId?: string;
      requestDate?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      breakRequestMutations.removeBreak({
        breakRequestId: params.breakRequestId,
        removedBy,
      }),
    onSuccess: (_, variables) => {
      // Invalidate all break request queries
      queryClient.invalidateQueries({ queryKey: breakRequestKeys.all });

      // Invalidate attendance queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });

      if (variables.userId) {
        // Invalidate user-specific queries
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.today(variables.userId),
        });

        if (variables.requestDate) {
          const date = new Date(variables.requestDate);
          queryClient.invalidateQueries({
            queryKey: attendanceKeys.monthlySummary(
              variables.userId,
              date.getMonth(),
              date.getFullYear()
            ),
          });
        }
      }
    },
    ...options,
  });
};
