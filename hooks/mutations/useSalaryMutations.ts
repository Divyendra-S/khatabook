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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.list(data.user_id) });
      queryClient.invalidateQueries({ queryKey: salaryKeys.latest(data.user_id) });
      queryClient.invalidateQueries({ queryKey: salaryKeys.hrAll() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.hrPending() });
    },
    ...options,
  });
};
