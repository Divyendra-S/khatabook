import { supabase } from '@/lib/supabase/client';

export const notificationMutations = {
  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Create notification (HR only)
   */
  createNotification: async (params: {
    userId: string;
    title: string;
    message: string;
    type: string;
    relatedId?: string;
    relatedType?: string;
  }) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        related_id: params.relatedId,
        related_type: params.relatedType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
