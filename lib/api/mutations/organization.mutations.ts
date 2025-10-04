import { supabase } from '@/lib/supabase/client';

export const organizationMutations = {
  /**
   * Create a new employee in the organization
   * This creates both auth user and user profile
   */
  createEmployee: async (params: {
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    phone?: string;
    department?: string;
    designation?: string;
    role?: 'employee' | 'hr';
    dateOfJoining?: string;
    organizationId: string;
  }) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: params.email,
        full_name: params.fullName,
        employee_id: params.employeeId,
        phone: params.phone,
        department: params.department,
        designation: params.designation,
        role: params.role || 'employee',
        date_of_joining: params.dateOfJoining || new Date().toISOString().split('T')[0],
        organization_id: params.organizationId,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    // Insert into user_role_cache
    await supabase
      .from('user_role_cache')
      .insert({
        user_id: authData.user.id,
        role: params.role || 'employee',
      });

    return {
      authUser: authData.user,
      user: userData,
    };
  },

  /**
   * Update employee details
   */
  updateEmployee: async (
    userId: string,
    updates: Partial<{
      full_name: string;
      phone: string;
      department: string;
      designation: string;
      role: 'employee' | 'hr' | 'admin';
      date_of_joining: string;
      is_active: boolean;
    }>
  ) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Update role cache if role changed
    if (updates.role) {
      await supabase
        .from('user_role_cache')
        .upsert({
          user_id: userId,
          role: updates.role,
        });
    }

    return data;
  },

  /**
   * Deactivate an employee
   */
  deactivateEmployee: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Reactivate an employee
   */
  reactivateEmployee: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update organization details
   */
  updateOrganization: async (
    organizationId: string,
    updates: Partial<{
      name: string;
      description: string;
      is_active: boolean;
    }>
  ) => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
