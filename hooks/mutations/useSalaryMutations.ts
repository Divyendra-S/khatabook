import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { salaryMutations } from '@/lib/api/mutations/salary.mutations';
import { salaryKeys } from '@/hooks/queries/useSalary';
import { SalaryRecord, SalaryStatus } from '@/lib/types';

export const useCreateSalaryRecord = (
  options?: UseMutationOptions<SalaryRecord, Error, any>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params) => salaryMutations.createSalaryRecord(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.list(variables.userId) });
      queryClient.invalidateQueries({ queryKey: salaryKeys.hrAll() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.hrPending() });
    },
    ...options,
  });
};

export const useUpdateSalaryRecord = (
  options?: UseMutationOptions<SalaryRecord, Error, { recordId: string; updates: any }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, updates }) => salaryMutations.updateSalaryRecord(recordId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.byId(variables.recordId) });
      queryClient.invalidateQueries({ queryKey: salaryKeys.hrAll() });
    },
    ...options,
  });
};

export const useUpdateSalaryStatus = (
  options?: UseMutationOptions<SalaryRecord, Error, { recordId: string; status: SalaryStatus; approvedBy?: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, status, approvedBy }) =>
      salaryMutations.updateSalaryStatus(recordId, status, approvedBy),
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch ALL salary queries immediately
      await queryClient.invalidateQueries({
        queryKey: salaryKeys.all,
        refetchType: 'all'
      });

      // Force refetch all active salary queries
      await queryClient.refetchQueries({
        queryKey: salaryKeys.all,
        type: 'active'
      });

      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
    onMutate: options?.onMutate,
    onSettled: options?.onSettled,
  });
};
