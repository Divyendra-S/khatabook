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
    const now = new Date();
    const nowISO = now.toISOString();

    // Validate: Check-out time cannot be in the future (extra safety check)
    // This is already guaranteed by using current time, but kept for validation
    const checkOutTime = new Date(nowISO);
    if (checkOutTime > now) {
      throw new Error('Check-out time cannot be in the future');
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: nowISO,
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
   * Uses upsert to handle duplicate (user_id, date) combinations
   */
  markAttendance: async (params: {
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    markedBy: string;
    notes?: string;
  }) => {
    // Fetch user's working days to validate
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('working_days')
      .eq('id', params.userId)
      .single();

    if (userError) throw userError;

    // Validate: Check if the selected date is a working day
    const selectedDate = new Date(params.date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const workingDays = userData?.working_days || [];

    const dayMap: { [key: number]: string } = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    const selectedDayName = dayMap[dayOfWeek];

    if (workingDays.length > 0 && !workingDays.includes(selectedDayName)) {
      throw new Error('Cannot mark attendance on a non-working day');
    }

    // Validate: Check-out time cannot be in the future
    if (params.checkOutTime) {
      const checkOutDateTime = new Date(params.checkOutTime);
      const now = new Date();

      if (checkOutDateTime > now) {
        throw new Error('Check-out time cannot be in the future');
      }
    }

    // Validate: Check-out time must be after check-in time
    if (params.checkInTime && params.checkOutTime) {
      const checkInDateTime = new Date(params.checkInTime);
      const checkOutDateTime = new Date(params.checkOutTime);

      if (checkOutDateTime < checkInDateTime) {
        throw new Error('Check-out time must be after check-in time');
      }
    }

    // First check if a record already exists for this user and date
    const { data: existingRecord } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('user_id', params.userId)
      .eq('date', params.date)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          check_in_time: params.checkInTime,
          check_out_time: params.checkOutTime,
          notes: params.notes,
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new record
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
    }
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
    // If updating check-in time, validate against working days
    if (updates.check_in_time) {
      // Fetch the attendance record to get user_id and date
      const { data: recordData, error: recordError } = await supabase
        .from('attendance_records')
        .select('user_id, date')
        .eq('id', recordId)
        .single();

      if (recordError) throw recordError;

      // Fetch user's working days
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('working_days')
        .eq('id', recordData.user_id)
        .single();

      if (userError) throw userError;

      // Validate working day
      const selectedDate = new Date(recordData.date);
      const dayOfWeek = selectedDate.getDay();
      const workingDays = userData?.working_days || [];

      const dayMap: { [key: number]: string } = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      const selectedDayName = dayMap[dayOfWeek];

      if (workingDays.length > 0 && !workingDays.includes(selectedDayName)) {
        throw new Error('Cannot update attendance on a non-working day');
      }
    }

    // Validate: Check-out time cannot be in the future
    if (updates.check_out_time) {
      const checkOutDateTime = new Date(updates.check_out_time);
      const now = new Date();

      if (checkOutDateTime > now) {
        throw new Error('Check-out time cannot be in the future');
      }
    }

    // Validate: Check-out time must be after check-in time
    if (updates.check_in_time && updates.check_out_time) {
      const checkInDateTime = new Date(updates.check_in_time);
      const checkOutDateTime = new Date(updates.check_out_time);

      if (checkOutDateTime < checkInDateTime) {
        throw new Error('Check-out time must be after check-in time');
      }
    }

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
