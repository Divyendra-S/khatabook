import { supabase } from '@/lib/supabase/client';

export const attendanceMutations = {
  /**
   * Check in for today
   */
  checkIn: async (userId: string, notes?: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: userId,
        date: todayDate,
        check_in_time: now,
        marked_by: userId,
        marked_by_role: 'self',
        check_in_method: 'self',
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Check out for today
   */
  checkOut: async (recordId: string, notes?: string) => {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: now,
        notes,
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * HR marks attendance for an employee
   */
  markAttendance: async (params: {
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    markedBy: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        user_id: params.userId,
        date: params.date,
        check_in_time: params.checkInTime,
        check_out_time: params.checkOutTime,
        marked_by: params.markedBy,
        marked_by_role: 'hr',
        check_in_method: 'manual',
        notes: params.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update attendance record
   */
  updateAttendance: async (
    recordId: string,
    updates: Partial<{
      check_in_time: string;
      check_out_time: string;
      notes: string;
      is_valid_day: boolean;
    }>
  ) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete attendance record (HR only)
   */
  deleteAttendance: async (recordId: string) => {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
  },
};
