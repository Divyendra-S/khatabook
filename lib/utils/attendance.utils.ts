import { differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Calculate total hours worked
 */
export const calculateTotalHours = (checkInTime: string, checkOutTime: string): number => {
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const hours = differenceInHours(checkOut, checkIn);
  const minutes = differenceInMinutes(checkOut, checkIn) % 60;
  return Number((hours + minutes / 60).toFixed(2));
};

/**
 * Format hours to readable string (e.g., "8h 30m")
 */
export const formatHours = (hours: number): string => {
  if (!hours) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Check if attendance is valid (minimum hours worked)
 */
export const isValidAttendance = (hours: number, minimumHours: number = 6): boolean => {
  return hours >= minimumHours;
};

/**
 * Get attendance status from record
 */
export const getAttendanceStatus = (record: {
  check_in_time?: string | null;
  check_out_time?: string | null;
  total_hours?: number | null;
}): 'Present' | 'Incomplete' | 'Absent' => {
  if (!record.check_in_time) return 'Absent';
  if (!record.check_out_time) return 'Incomplete';
  return 'Present';
};

/**
 * Calculate attendance percentage
 */
export const calculateAttendancePercentage = (presentDays: number, totalDays: number): number => {
  if (totalDays === 0) return 0;
  return Math.round((presentDays / totalDays) * 100);
};
