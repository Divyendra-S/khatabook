import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { userQueries } from '@/lib/api/queries/user.queries';
import { User } from '@/lib/types';

/**
 * Query keys for user-related queries
 */
export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  byId: (id: string) => [...userKeys.all, 'detail', id] as const,
  list: (filters?: object) => [...userKeys.all, 'list', filters] as const,
  byDepartment: (department: string) => [...userKeys.all, 'department', department] as const,
  search: (term: string) => [...userKeys.all, 'search', term] as const,
};

/**
 * Hook to get current user
 */
export const useCurrentUser = (
  options?: Omit<UseQueryOptions<User | null>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => userQueries.getCurrentUser(),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Hook to get user by ID
 */
export const useUserById = (
  userId: string,
  options?: Omit<UseQueryOptions<User | null>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.byId(userId),
    queryFn: () => userQueries.getUserById(userId),
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
    ...options,
  });
};

/**
 * HR: Hook to get all users
 */
export const useAllUsers = (
  filters?: {
    role?: string;
    department?: string;
    isActive?: boolean;
  },
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userQueries.getAllUsers(filters),
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/**
 * Hook to get employees by department
 */
export const useEmployeesByDepartment = (
  department: string,
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.byDepartment(department),
    queryFn: () => userQueries.getEmployeesByDepartment(department),
    staleTime: 1000 * 60 * 10,
    enabled: !!department,
    ...options,
  });
};

/**
 * Hook to search users
 */
export const useSearchUsers = (
  searchTerm: string,
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.search(searchTerm),
    queryFn: () => userQueries.searchUsers(searchTerm),
    staleTime: 1000 * 60 * 2,
    enabled: searchTerm.length > 0,
    ...options,
  });
};
