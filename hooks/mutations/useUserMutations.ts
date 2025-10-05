import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { userMutations } from '@/lib/api/mutations/user.mutations';
import { userKeys } from '@/hooks/queries/useUser';
import { User } from '@/lib/types';

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = (
  userId: string,
  options?: UseMutationOptions<User, Error, Partial<{
    full_name: string;
    phone: string;
    department: string;
    designation: string;
    profile_picture_url: string;
  }>>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => userMutations.updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.byId(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
    ...options,
  });
};

/**
 * Hook for updating employee (HR only)
 */
export const useUpdateEmployee = (
  options?: UseMutationOptions<User, Error, {
    userId: string;
    updates: Partial<{
      full_name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      designation: string;
      date_of_joining: string;
      is_active: boolean;
    }>;
  }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }) => userMutations.updateEmployee(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.byId(variables.userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
    ...options,
  });
};

/**
 * Hook for deactivating employee (HR only)
 */
export const useDeactivateEmployee = (
  options?: UseMutationOptions<User, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userMutations.deactivateEmployee(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.byId(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
    ...options,
  });
};

/**
 * Hook for activating employee (HR only)
 */
export const useActivateEmployee = (
  options?: UseMutationOptions<User, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userMutations.activateEmployee(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: userKeys.byId(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.list() });
    },
    ...options,
  });
};

/**
 * Hook for deleting employee and all related data (HR only)
 */
export const useDeleteEmployee = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      console.log('🔄 [useDeleteEmployee] Mutation triggered for userId:', userId);
      return userMutations.deleteEmployee(userId);
    },
    onMutate: async (userId) => {
      console.log('⏳ [useDeleteEmployee] onMutate called for userId:', userId);
      if (options?.onMutate) {
        return await options.onMutate(userId);
      }
    },
    onSuccess: async (data, userId, context) => {
      console.log('✅ [useDeleteEmployee] onSuccess called');
      console.log('✅ [useDeleteEmployee] Data:', data);
      console.log('✅ [useDeleteEmployee] UserId:', userId);

      console.log('🔄 [useDeleteEmployee] Invalidating user queries...');
      // Invalidate all user-related queries
      await queryClient.invalidateQueries({
        queryKey: userKeys.all,
        refetchType: 'all'
      });

      console.log('🔄 [useDeleteEmployee] Refetching active queries...');
      // Force refetch all active user queries
      await queryClient.refetchQueries({
        queryKey: userKeys.all,
        type: 'active'
      });

      console.log('✅ [useDeleteEmployee] Cache invalidation complete');

      // Call user's onSuccess if provided
      if (options?.onSuccess) {
        console.log('🔄 [useDeleteEmployee] Calling custom onSuccess handler...');
        await options.onSuccess(data, userId, context);
      }
    },
    onError: (error, userId, context) => {
      console.error('❌ [useDeleteEmployee] onError called');
      console.error('❌ [useDeleteEmployee] Error:', error);
      console.error('❌ [useDeleteEmployee] Error message:', error.message);
      console.error('❌ [useDeleteEmployee] UserId:', userId);

      if (options?.onError) {
        options.onError(error, userId, context);
      }
    },
    onSettled: (data, error, userId, context) => {
      console.log('🏁 [useDeleteEmployee] onSettled called');
      console.log('🏁 [useDeleteEmployee] Data:', data);
      console.log('🏁 [useDeleteEmployee] Error:', error);

      if (options?.onSettled) {
        options.onSettled(data, error, userId, context);
      }
    },
  });
};
