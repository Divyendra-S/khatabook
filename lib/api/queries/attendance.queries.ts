import { supabase } from '@/lib/supabase/client';
import { AttendanceRecord, AttendanceWithUser } from '@/lib/types';

export const attendanceQueries = {
  /**
   * Fetch today's attendance record for a user
   */
  getTodayAttendance: async (userId: string): Promise<AttendanceRecord | null> => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayDate)
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
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        *,
        user:users(full_name, employee_id, department)
      `)
      .eq('date', todayDate)
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

  /**
   * Get all employees with attendance status for a date range (HR only)
   * Shows all employees including those who didn't check in (absent)
   */
  getAllEmployeesAttendance: async (filters?: {
    startDate?: string;
    endDate?: string;
    date?: string;
  }) => {
    let targetDate = filters?.date;

    if (!targetDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    // First, get all active employees
    const { data: employees, error: employeesError } = await supabase
      .from('users')
      .select('id, full_name, employee_id, department, email')
      .eq('role', 'employee')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (employeesError) throw employeesError;

    // Then get attendance records for the date
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('date', targetDate);

    if (attendanceError) throw attendanceError;

    // Create a map of attendance records by user_id
    const attendanceMap = new Map(
      (attendanceRecords || []).map(record => [record.user_id, record])
    );

    // Combine employees with their attendance records
    const result = (employees || []).map(employee => {
      const attendanceRecord = attendanceMap.get(employee.id);

      if (attendanceRecord) {
        // Employee has attendance record
        return {
          ...attendanceRecord,
          user: {
            full_name: employee.full_name,
            employee_id: employee.employee_id,
            department: employee.department,
          },
        };
      } else {
        // Employee is absent - create a placeholder record
        return {
          id: `absent-${employee.id}-${targetDate}`,
          user_id: employee.id,
          date: targetDate,
          check_in_time: null,
          check_out_time: null,
          total_hours: null,
          is_valid_day: false,
          marked_by: null,
          marked_by_role: null,
          check_in_method: null,
          notes: null,
          created_at: null,
          updated_at: null,
          user: {
            full_name: employee.full_name,
            employee_id: employee.employee_id,
            department: employee.department,
          },
        };
      }
    });

    return result as AttendanceWithUser[];
  },
};
