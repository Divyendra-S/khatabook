import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { attendanceQueries } from '@/lib/api/queries/attendance.queries';
import { AttendanceRecord, AttendanceWithUser } from '@/lib/types';

/**
 * Query keys for attendance-related queries
 */
export const attendanceKeys = {
  all: ['attendance'] as const,
  today: (userId: string) => [...attendanceKeys.all, 'today', userId] as const,
  byDateRange: (userId: string, startDate: string, endDate: string) =>
    [...attendanceKeys.all, 'range', userId, startDate, endDate] as const,
  monthlySummary: (userId: string, month: number, year: number) =>
    [...attendanceKeys.all, 'monthly', userId, month, year] as const,
  byId: (id: string) => [...attendanceKeys.all, 'detail', id] as const,
  hrAll: (filters?: object) => [...attendanceKeys.all, 'hr', 'all', filters] as const,
  hrToday: () => [...attendanceKeys.all, 'hr', 'today'] as const,
  hrStats: (startDate: string, endDate: string) => 
    [...attendanceKeys.all, 'hr', 'stats', startDate, endDate] as const,
};

/**
 * Hook to fetch today's attendance record
 */
export const useTodayAttendance = (
  userId: string,
  options?: Omit<UseQueryOptions<AttendanceRecord | null>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.today(userId),
    queryFn: () => attendanceQueries.getTodayAttendance(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch attendance records by date range
 */
export const useAttendanceByDateRange = (
  userId: string,
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<AttendanceRecord[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.byDateRange(userId, startDate, endDate),
    queryFn: () => attendanceQueries.getAttendanceByDateRange(userId, startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch monthly attendance summary
 */
export const useMonthlyAttendanceSummary = (
  userId: string,
  month: number,
  year: number,
  options?: Omit<UseQueryOptions<{
    records: AttendanceRecord[];
    totalDays: number;
    validDays: number;
    totalHours: number;
    avgHours: number;
  }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.monthlySummary(userId, month, year),
    queryFn: () => attendanceQueries.getMonthlyAttendanceSummary(userId, month, year),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Hook to fetch attendance by ID
 */
export const useAttendanceById = (
  recordId: string,
  options?: Omit<UseQueryOptions<AttendanceRecord | null>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.byId(recordId),
    queryFn: () => attendanceQueries.getAttendanceById(recordId),
    staleTime: 1000 * 60 * 5,
    enabled: !!recordId,
    ...options,
  });
};

/**
 * HR: Hook to fetch all attendance records
 */
export const useAllAttendanceRecords = (
  filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    date?: string;
  },
  options?: Omit<UseQueryOptions<AttendanceWithUser[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.hrAll(filters),
    queryFn: () => attendanceQueries.getAllAttendanceRecords(filters),
    staleTime: 1000 * 60 * 3,
    ...options,
  });
};

/**
 * HR: Hook to fetch today's attendance for all employees
 */
export const useTodayAllAttendance = (
  options?: Omit<UseQueryOptions<AttendanceWithUser[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.hrToday(),
    queryFn: () => attendanceQueries.getTodayAllAttendance(),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * HR: Hook to fetch attendance statistics
 */
export const useAttendanceStats = (
  startDate: string,
  endDate: string,
  options?: Omit<UseQueryOptions<{
    totalRecords: number;
    validRecords: number;
    totalHours: number;
    avgHours: number;
    uniqueUsers: number;
  }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: attendanceKeys.hrStats(startDate, endDate),
    queryFn: () => attendanceQueries.getAttendanceStats(startDate, endDate),
    staleTime: 1000 * 60 * 10,
    ...options,
  });
};

// Aliases for HR hooks
export const useHRTodayAttendance = useTodayAllAttendance;
export const useHRAllAttendanceRecords = useAllAttendanceRecords;
