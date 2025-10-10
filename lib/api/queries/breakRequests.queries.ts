import { supabase } from '@/lib/supabase/client';
import { BreakRequest } from '@/lib/types';

export const breakRequestQueries = {
  /**
   * Get all break requests for the current user (employee view)
   */
  getMyBreakRequests: async (userId: string): Promise<BreakRequest[]> => {
    const { data, error } = await supabase
      .from('break_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pending break requests (HR view)
   */
  getPendingBreakRequests: async (): Promise<BreakRequest[]> => {
    const { data, error } = await supabase
      .from('break_requests')
      .select(`
        *,
        user:users!break_requests_user_id_fkey(full_name, employee_id),
        attendance_record:attendance_records(date, check_in_time, check_out_time)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all break requests (HR view with filters)
   */
  getAllBreakRequests: async (filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BreakRequest[]> => {
    let query = supabase
      .from('break_requests')
      .select(`
        *,
        user:users!break_requests_user_id_fkey(full_name, employee_id),
        reviewer:users!break_requests_reviewed_by_fkey(full_name),
        attendance_record:attendance_records(date, check_in_time, check_out_time)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.startDate) {
      query = query.gte('request_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('request_date', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get break requests for a specific attendance record
   */
  getBreakRequestsByAttendance: async (
    attendanceRecordId: string
  ): Promise<BreakRequest[]> => {
    const { data, error } = await supabase
      .from('break_requests')
      .select('*')
      .eq('attendance_record_id', attendanceRecordId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single break request by ID
   */
  getBreakRequestById: async (id: string): Promise<BreakRequest | null> => {
    const { data, error } = await supabase
      .from('break_requests')
      .select(`
        *,
        user:users!break_requests_user_id_fkey(full_name, employee_id, phone),
        reviewer:users!break_requests_reviewed_by_fkey(full_name),
        attendance_record:attendance_records(date, check_in_time, check_out_time)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Check if user has a pending break request for today's attendance
   */
  hasPendingBreakRequestToday: async (
    userId: string,
    attendanceRecordId: string
  ): Promise<boolean> => {
    const { data, error } = await supabase
      .from('break_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('attendance_record_id', attendanceRecordId)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  /**
   * Check if employee has an active (ongoing) or upcoming (scheduled) break
   */
  hasActiveOrUpcomingBreak: async (
    attendanceRecordId: string
  ): Promise<{ hasActive: boolean; breakDetails?: BreakRequest }> => {
    const now = new Date();

    const { data, error } = await supabase
      .from('break_requests')
      .select('*')
      .eq('attendance_record_id', attendanceRecordId)
      .eq('status', 'approved')
      .not('approved_start_time', 'is', null)
      .not('approved_end_time', 'is', null);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { hasActive: false };
    }

    // Check if any break is ongoing or upcoming
    const activeBreak = data.find((breakReq) => {
      const startTime = new Date(breakReq.approved_start_time!);
      const endTime = new Date(breakReq.approved_end_time!);

      // Ongoing: current time is between start and end
      const isOngoing = now >= startTime && now <= endTime;

      // Upcoming: start time is in the future
      const isUpcoming = now < startTime;

      return isOngoing || isUpcoming;
    });

    return {
      hasActive: !!activeBreak,
      breakDetails: activeBreak,
    };
  },
};
