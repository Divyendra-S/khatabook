import { supabase } from '@/lib/supabase/client';
import { AttendanceBreak, BreakRequest } from '@/lib/types';
import { calculateBreakDuration, parseBreaks } from '@/lib/utils/attendance.utils';

export const breakRequestMutations = {
  /**
   * Employee creates a break request
   */
  createBreakRequest: async (params: {
    userId: string;
    attendanceRecordId: string;
    requestDate: string;
    requestedStartTime?: string;
    requestedEndTime?: string;
    reason?: string;
  }): Promise<BreakRequest> => {
    const { data, error } = await supabase
      .from('break_requests')
      .insert({
        user_id: params.userId,
        attendance_record_id: params.attendanceRecordId,
        request_date: params.requestDate,
        requested_start_time: params.requestedStartTime,
        requested_end_time: params.requestedEndTime,
        reason: params.reason,
        requested_by: params.userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * HR approves a break request and adds the break to attendance record
   */
  approveBreakRequest: async (params: {
    breakRequestId: string;
    approvedStartTime: string;
    approvedEndTime: string;
    reviewedBy: string;
    reviewerNotes?: string;
  }): Promise<BreakRequest> => {
    // Calculate duration
    const durationMinutes = calculateBreakDuration(
      params.approvedStartTime,
      params.approvedEndTime
    );

    // First, get the break request to find the attendance record
    const { data: breakRequest, error: fetchError } = await supabase
      .from('break_requests')
      .select('*, attendance_record:attendance_records(*)')
      .eq('id', params.breakRequestId)
      .single();

    if (fetchError) throw fetchError;
    if (!breakRequest) throw new Error('Break request not found');

    // Get the attendance record
    const attendanceRecord = breakRequest.attendance_record as any;
    if (!attendanceRecord) throw new Error('Attendance record not found');

    // Parse existing breaks
    const existingBreaks = parseBreaks(attendanceRecord.breaks);

    // Create new break object
    const newBreak: AttendanceBreak = {
      start_time: params.approvedStartTime,
      end_time: params.approvedEndTime,
      duration_minutes: durationMinutes,
      notes: params.reviewerNotes,
    };

    // Add new break to existing breaks
    const updatedBreaks = [...existingBreaks, newBreak];

    // Update both break_requests and attendance_records in a transaction
    // Update break request status
    const { error: updateBreakRequestError } = await supabase
      .from('break_requests')
      .update({
        status: 'approved',
        approved_start_time: params.approvedStartTime,
        approved_end_time: params.approvedEndTime,
        duration_minutes: durationMinutes,
        reviewed_by: params.reviewedBy,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: params.reviewerNotes,
      })
      .eq('id', params.breakRequestId);

    if (updateBreakRequestError) throw updateBreakRequestError;

    // Update attendance record with the new break
    const { error: updateAttendanceError } = await supabase
      .from('attendance_records')
      .update({
        breaks: updatedBreaks,
      })
      .eq('id', attendanceRecord.id);

    if (updateAttendanceError) throw updateAttendanceError;

    // Fetch and return updated break request
    const { data: updatedBreakRequest, error: finalFetchError } = await supabase
      .from('break_requests')
      .select('*')
      .eq('id', params.breakRequestId)
      .single();

    if (finalFetchError) throw finalFetchError;
    return updatedBreakRequest;
  },

  /**
   * HR rejects a break request
   */
  rejectBreakRequest: async (params: {
    breakRequestId: string;
    reviewedBy: string;
    reviewerNotes?: string;
  }): Promise<BreakRequest> => {
    const { data, error } = await supabase
      .from('break_requests')
      .update({
        status: 'rejected',
        reviewed_by: params.reviewedBy,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: params.reviewerNotes,
      })
      .eq('id', params.breakRequestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Employee cancels their pending break request
   */
  cancelBreakRequest: async (breakRequestId: string): Promise<BreakRequest> => {
    const { data, error } = await supabase
      .from('break_requests')
      .update({
        status: 'rejected',
        reviewer_notes: 'Cancelled by employee',
      })
      .eq('id', breakRequestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a break request (only if pending)
   */
  deleteBreakRequest: async (breakRequestId: string): Promise<void> => {
    const { error } = await supabase
      .from('break_requests')
      .delete()
      .eq('id', breakRequestId)
      .eq('status', 'pending');

    if (error) throw error;
  },
};
