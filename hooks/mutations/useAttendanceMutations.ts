import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { attendanceMutations } from '@/lib/api/mutations/attendance.mutations';
import { attendanceKeys } from '@/hooks/queries/useAttendance';
import { AttendanceRecord, AttendanceBreak } from '@/lib/types';

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
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL attendance and earnings queries
      await queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['salary'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['earnings'],
        refetchType: 'all'
      });

      // Force refetch all active queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['salary'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['earnings'],
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
};

/**
 * Hook for checking out
 */
export const useCheckOut = (
  userId: string,
  options?: UseMutationOptions<AttendanceRecord, Error, { recordId: string; notes?: string; breaks?: AttendanceBreak[] }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, notes, breaks }) => attendanceMutations.checkOut(recordId, notes, breaks),
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL attendance and earnings queries
      await queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['salary'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['earnings'],
        refetchType: 'all'
      });

      // Force refetch all active queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['salary'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['earnings'],
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
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
      breaks?: AttendanceBreak[];
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => attendanceMutations.markAttendance({ ...params, markedBy }),
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL attendance and earnings queries
      await queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['salary'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['earnings'],
        refetchType: 'all'
      });

      // Force refetch all active queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['salary'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['earnings'],
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
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
        breaks: AttendanceBreak[];
      }>;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, updates }) => attendanceMutations.updateAttendance(recordId, updates),
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL attendance and earnings queries
      await queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['salary'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['earnings'],
        refetchType: 'all'
      });

      // Force refetch all active queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['salary'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['earnings'],
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
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

/**
 * Hook for updating breaks on an attendance record
 * Can be used by employees to manage their own breaks
 */
export const useUpdateBreaks = (
  userId: string,
  options?: UseMutationOptions<
    AttendanceRecord,
    Error,
    {
      recordId: string;
      breaks: AttendanceBreak[];
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, breaks }) => attendanceMutations.updateBreaks(recordId, breaks),
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL attendance and earnings queries
      await queryClient.invalidateQueries({
        queryKey: ['attendance'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['salary'],
        refetchType: 'all'
      });

      await queryClient.invalidateQueries({
        queryKey: ['earnings'],
        refetchType: 'all'
      });

      // Force refetch all active queries
      await queryClient.refetchQueries({
        queryKey: ['attendance'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['salary'],
        type: 'active'
      });

      await queryClient.refetchQueries({
        queryKey: ['earnings'],
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
};
