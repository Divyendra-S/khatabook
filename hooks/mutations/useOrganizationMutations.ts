import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { organizationMutations } from '@/lib/api/mutations/organization.mutations';
import { organizationKeys } from '@/hooks/queries/useOrganization';
import { userKeys } from '@/hooks/queries/useUser';
import { User, Organization } from '@/lib/types';

/**
 * Hook for creating a new employee
 */
export const useCreateEmployee = (
  organizationId: string,
  options?: UseMutationOptions<
    { authUser: any; user: User },
    Error,
    {
      email: string;
      password: string;
      fullName: string;
      employeeId: string;
      phone?: string;
      department?: string;
      designation?: string;
      role?: 'employee' | 'hr';
      dateOfJoining?: string;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) =>
      organizationMutations.createEmployee({ ...params, organizationId }),
    onSuccess: () => {
      // Invalidate employees list
      queryClient.invalidateQueries({
        queryKey: organizationKeys.employees(organizationId),
      });
      // Invalidate organization stats
      queryClient.invalidateQueries({
        queryKey: organizationKeys.stats(organizationId),
      });
      // Invalidate all users query
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
    ...options,
  });
};

/**
 * Hook for updating employee details
 */
export const useUpdateEmployee = (
  organizationId: string,
  options?: UseMutationOptions<
    User,
    Error,
    {
      userId: string;
      updates: Partial<{
        full_name: string;
        phone: string;
        department: string;
        designation: string;
        role: 'employee' | 'hr' | 'admin';
        date_of_joining: string;
        is_active: boolean;
      }>;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }) =>
      organizationMutations.updateEmployee(userId, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific user
      queryClient.invalidateQueries({
        queryKey: userKeys.byId(variables.userId),
      });
      // Invalidate employees list
      queryClient.invalidateQueries({
        queryKey: organizationKeys.employees(organizationId),
      });
      // Invalidate all users
      queryClient.invalidateQueries({
        queryKey: userKeys.all,
      });
    },
    ...options,
  });
};

/**
 * Hook for deactivating an employee
 */
export const useDeactivateEmployee = (
  organizationId: string,
  options?: UseMutationOptions<User, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationMutations.deactivateEmployee(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.byId(userId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.employees(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.stats(organizationId),
      });
    },
    ...options,
  });
};

/**
 * Hook for reactivating an employee
 */
export const useReactivateEmployee = (
  organizationId: string,
  options?: UseMutationOptions<User, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationMutations.reactivateEmployee(userId),
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({
        queryKey: userKeys.byId(userId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.employees(organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.stats(organizationId),
      });
    },
    ...options,
  });
};

/**
 * Hook for updating organization details
 */
export const useUpdateOrganization = (
  options?: UseMutationOptions<
    Organization,
    Error,
    {
      organizationId: string;
      updates: Partial<{
        name: string;
        description: string;
        is_active: boolean;
      }>;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, updates }) =>
      organizationMutations.updateOrganization(organizationId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.byId(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.current(),
      });
    },
    ...options,
  });
};
