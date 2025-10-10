import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { breakRequestQueries } from '@/lib/api/queries/breakRequests.queries';
import { BreakRequest } from '@/lib/types';

/**
 * Query keys for break request-related queries
 */
export const breakRequestKeys = {
  all: ['breakRequests'] as const,
  my: (userId: string) => [...breakRequestKeys.all, 'my', userId] as const,
  pending: () => [...breakRequestKeys.all, 'pending'] as const,
  allRequests: (filters?: object) => [...breakRequestKeys.all, 'list', filters] as const,
  byAttendance: (attendanceRecordId: string) =>
    [...breakRequestKeys.all, 'attendance', attendanceRecordId] as const,
  detail: (id: string) => [...breakRequestKeys.all, 'detail', id] as const,
  hasPendingToday: (userId: string, attendanceRecordId: string) =>
    [...breakRequestKeys.all, 'hasPendingToday', userId, attendanceRecordId] as const,
};

/**
 * Hook to fetch current user's break requests
 */
export const useMyBreakRequests = (
  userId: string,
  options?: UseQueryOptions<BreakRequest[]>
) => {
  return useQuery({
    queryKey: breakRequestKeys.my(userId),
    queryFn: () => breakRequestQueries.getMyBreakRequests(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to fetch pending break requests (HR view)
 */
export const usePendingBreakRequests = (
  options?: UseQueryOptions<BreakRequest[]>
) => {
  return useQuery({
    queryKey: breakRequestKeys.pending(),
    queryFn: () => breakRequestQueries.getPendingBreakRequests(),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 3, // Refetch every 3 minutes
    ...options,
  });
};

/**
 * Hook to fetch all break requests with filters (HR view)
 */
export const useAllBreakRequests = (
  filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    userId?: string;
    startDate?: string;
    endDate?: string;
  },
  options?: UseQueryOptions<BreakRequest[]>
) => {
  return useQuery({
    queryKey: breakRequestKeys.allRequests(filters),
    queryFn: () => breakRequestQueries.getAllBreakRequests(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
};

/**
 * Hook to fetch break requests for a specific attendance record
 */
export const useBreakRequestsByAttendance = (
  attendanceRecordId: string,
  options?: UseQueryOptions<BreakRequest[]>
) => {
  return useQuery({
    queryKey: breakRequestKeys.byAttendance(attendanceRecordId),
    queryFn: () => breakRequestQueries.getBreakRequestsByAttendance(attendanceRecordId),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!attendanceRecordId,
    ...options,
  });
};

/**
 * Hook to fetch a single break request by ID
 */
export const useBreakRequestById = (
  id: string,
  options?: UseQueryOptions<BreakRequest | null>
) => {
  return useQuery({
    queryKey: breakRequestKeys.detail(id),
    queryFn: () => breakRequestQueries.getBreakRequestById(id),
    staleTime: 1000 * 60, // 1 minute
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to check if user has a pending break request for today
 */
export const useHasPendingBreakRequestToday = (
  userId: string,
  attendanceRecordId: string,
  options?: UseQueryOptions<boolean>
) => {
  return useQuery({
    queryKey: breakRequestKeys.hasPendingToday(userId, attendanceRecordId),
    queryFn: () =>
      breakRequestQueries.hasPendingBreakRequestToday(userId, attendanceRecordId),
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!userId && !!attendanceRecordId,
    ...options,
  });
};
