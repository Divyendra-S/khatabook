import { supabase } from '@/lib/supabase/client';
import { LeaveRequest, LeaveRequestWithUser } from '@/lib/types';

export const leaveQueries = {
  /**
   * Get leave requests for a user
   */
  getUserLeaveRequests: async (userId: string): Promise<LeaveRequest[]> => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get upcoming leave requests for a user
   */
  getUpcomingLeaves: async (userId: string): Promise<LeaveRequest[]> => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .gte('end_date', today)
      .in('status', ['pending', 'approved'])
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get leave request by ID
   */
  getLeaveRequestById: async (requestId: string): Promise<LeaveRequest | null> => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Get leave balance for a user (simplified - can be enhanced)
   */
  getLeaveBalance: async (userId: string, year: number) => {
    const startDate = new Date(year, 0, 1).toISOString().split('T')[0];
    const endDate = new Date(year, 11, 31).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gte('start_date', startDate)
      .lte('end_date', endDate);

    if (error) throw error;

    const leaves = data || [];
    const casualLeaves = leaves
      .filter(l => l.leave_type === 'casual')
      .reduce((sum, l) => sum + (l.total_days || 0), 0);
    const sickLeaves = leaves
      .filter(l => l.leave_type === 'sick')
      .reduce((sum, l) => sum + (l.total_days || 0), 0);
    const earnedLeaves = leaves
      .filter(l => l.leave_type === 'earned')
      .reduce((sum, l) => sum + (l.total_days || 0), 0);

    // Assuming standard leave policy
    const totalCasual = 12;
    const totalSick = 12;
    const totalEarned = 15;

    return {
      casual: { used: casualLeaves, total: totalCasual, remaining: totalCasual - casualLeaves },
      sick: { used: sickLeaves, total: totalSick, remaining: totalSick - sickLeaves },
      earned: { used: earnedLeaves, total: totalEarned, remaining: totalEarned - earnedLeaves },
    };
  },

  // HR queries
  /**
   * Get all leave requests (HR only)
   */
  getAllLeaveRequests: async (filters?: {
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LeaveRequestWithUser[]> => {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users(full_name, employee_id, department),
        reviewer:reviewed_by(full_name)
      `);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    if (filters?.startDate) query = query.gte('start_date', filters.startDate);
    if (filters?.endDate) query = query.lte('end_date', filters.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as LeaveRequestWithUser[];
  },

  /**
   * Get pending leave requests (HR only)
   */
  getPendingLeaveRequests: async (): Promise<LeaveRequestWithUser[]> => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:users(full_name, employee_id, department)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as LeaveRequestWithUser[];
  },

  /**
   * Get leave statistics (HR only)
   */
  getLeaveStats: async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate);

    if (error) throw error;

    const requests = data || [];
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const totalDays = requests
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.total_days || 0), 0);

    return {
      total: requests.length,
      pending,
      approved,
      rejected,
      totalDays,
    };
  },
};
