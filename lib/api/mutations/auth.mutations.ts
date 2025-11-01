import { supabase } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authMutations = {
  /**
   * Sign up with email and password
   */
  signUp: async (params: {
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    phone?: string;
    role?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          employee_id: params.employeeId,
          phone: params.phone,
          role: params.role || 'employee',
        },
      },
    });

    if (error) {
      // Log complete error details for debugging
      console.error('===== SIGNUP ERROR DETAILS =====');
      console.error('Error Message:', error.message);
      console.error('Error Name:', error.name);
      console.error('Error Status:', error.status);
      console.error('Full Error Object:', JSON.stringify(error, null, 2));
      console.error('================================');
      throw error;
    }
    return data;
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign out - local only (doesn't affect other devices)
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    
    // Clear AsyncStorage to prevent refresh token errors on restart
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key => key.includes('supabase'));
    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  /**
   * Update password
   */
  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};
