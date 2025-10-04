import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { authMutations } from '@/lib/api/mutations/auth.mutations';
import { router } from 'expo-router';

/**
 * Hook for signing up
 */
export const useSignUp = (
  options?: UseMutationOptions<any, Error, {
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    phone?: string;
    role?: string;
  }>
) => {
  return useMutation({
    mutationFn: (params) => authMutations.signUp(params),
    ...options,
  });
};

/**
 * Hook for signing in
 */
export const useSignIn = (
  options?: UseMutationOptions<any, Error, { email: string; password: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) => authMutations.signIn(email, password),
    onSuccess: () => {
      // Invalidate all queries on sign in
      queryClient.invalidateQueries();
    },
    ...options,
  });
};

/**
 * Hook for signing out
 */
export const useSignOut = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authMutations.signOut(),
    onSuccess: () => {
      // Clear all queries on sign out
      queryClient.clear();
      router.replace('/auth/login');
    },
    ...options,
  });
};

/**
 * Hook for resetting password
 */
export const useResetPassword = (
  options?: UseMutationOptions<void, Error, { email: string }>
) => {
  return useMutation({
    mutationFn: ({ email }) => authMutations.resetPassword(email),
    ...options,
  });
};

/**
 * Hook for updating password
 */
export const useUpdatePassword = (
  options?: UseMutationOptions<void, Error, { newPassword: string }>
) => {
  return useMutation({
    mutationFn: ({ newPassword }) => authMutations.updatePassword(newPassword),
    ...options,
  });
};
