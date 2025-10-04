import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { attendanceMutations } from '@/lib/api/mutations/attendance.mutations';
import { attendanceKeys } from '@/hooks/queries/useAttendance';
import { AttendanceRecord } from '@/lib/types';

/**
 * Hook for checking in
 */
export const useCheckIn = (
  userId: string,
  options?: UseMutationOptions<AttendanceRecord, Error, { notes?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notes }) => attendanceMutations.checkIn(userId, notes),
    onSuccess: () => {
      // Invalidate today's attendance query
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });

      // Invalidate monthly summary
      const now = new Date();
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(userId, now.getMonth(), now.getFullYear())
      });

      // Invalidate ALL attendance-related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'active'
      });
    },
    ...options,
  });
};

/**
 * Hook for checking out
 */
export const useCheckOut = (
  userId: string,
  options?: UseMutationOptions<AttendanceRecord, Error, { recordId: string; notes?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, notes }) => attendanceMutations.checkOut(recordId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });
      const now = new Date();
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(userId, now.getMonth(), now.getFullYear())
      });

      // Invalidate ALL attendance-related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'active'
      });
    },
    ...options,
  });
};

/**
 * HR: Hook for marking attendance
 */
export const useMarkAttendance = (
  markedBy: string,
  options?: UseMutationOptions<
    AttendanceRecord,
    Error,
    {
      userId: string;
      date: string;
      checkInTime: string;
      checkOutTime?: string;
      notes?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => attendanceMutations.markAttendance({ ...params, markedBy }),
    onSuccess: (_, variables) => {
      // Invalidate the affected user's queries
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(variables.userId) });

      // Invalidate ALL attendance-related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'active'
      });

      // Invalidate monthly summary for the affected month
      const date = new Date(variables.date);
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.monthlySummary(
          variables.userId,
          date.getMonth(),
          date.getFullYear()
        )
      });
    },
    ...options,
  });
};

/**
 * Hook for updating attendance
 */
export const useUpdateAttendance = (
  userId: string,
  options?: UseMutationOptions<
    AttendanceRecord,
    Error,
    {
      recordId: string;
      updates: Partial<{
        check_in_time: string;
        check_out_time: string;
        notes: string;
        is_valid_day: boolean;
      }>;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, updates }) => attendanceMutations.updateAttendance(recordId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today(userId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.byId(variables.recordId) });

      // Invalidate ALL attendance-related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'active'
      });
    },
    ...options,
  });
};

/**
 * HR: Hook for deleting attendance
 */
export const useDeleteAttendance = (
  options?: UseMutationOptions<void, Error, { recordId: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId }) => attendanceMutations.deleteAttendance(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    ...options,
  });
};
