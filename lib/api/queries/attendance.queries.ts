import { supabase } from '@/lib/supabase/client';
import { AttendanceRecord, AttendanceWithUser } from '@/lib/types';

export const attendanceQueries = {
  /**
   * Fetch today's attendance record for a user
   */
  getTodayAttendance: async (userId: string): Promise<AttendanceRecord | null> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Fetch attendance records for a date range
   */
  getAttendanceByDateRange: async (
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Fetch monthly attendance summary
   */
  getMonthlyAttendanceSummary: async (userId: string, month: number, year: number) => {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    return {
      records: data || [],
      totalDays: data?.length || 0,
      validDays: data?.filter(r => r.is_valid_day).length || 0,
      totalHours: data?.reduce((sum, r) => sum + (r.total_hours || 0), 0) || 0,
      avgHours: data?.length 
        ? (data.reduce((sum, r) => sum + (r.total_hours || 0), 0) / data.length)
        : 0,
    };
  },

  /**
   * Get attendance record by ID
   */
  getAttendanceById: async (recordId: string): Promise<AttendanceRecord | null> => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // HR queries
  /**
   * Get all attendance records (HR only)
   */
  getAllAttendanceRecords: async (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    date?: string;
  }): Promise<AttendanceWithUser[]> => {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        user:users(full_name, employee_id)
      `);

    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.date) query = query.eq('date', filters.date);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return (data || []) as AttendanceWithUser[];
  },

  /**
   * Get today's attendance for all employees (HR only)
   */
  getTodayAllAttendance: async (): Promise<AttendanceWithUser[]> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        user:users(full_name, employee_id, department)
      `)
      .eq('date', today)
      .order('check_in_time', { ascending: true });

    if (error) throw error;
    return (data || []) as AttendanceWithUser[];
  },

  /**
   * Get attendance statistics for a date range (HR only)
   */
  getAttendanceStats: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const records = data || [];
    const totalRecords = records.length;
    const validRecords = records.filter(r => r.is_valid_day).length;
    const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    const avgHours = totalRecords > 0 ? totalHours / totalRecords : 0;

    // Get unique users who marked attendance
    const uniqueUsers = new Set(records.map(r => r.user_id));

    return {
      totalRecords,
      validRecords,
      totalHours,
      avgHours,
      uniqueUsers: uniqueUsers.size,
    };
  },
};
