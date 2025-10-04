/**
 * Calculate total salary
 */
export const calculateTotalSalary = (
  baseSalary: number,
  allowances: number = 0,
  bonus: number = 0,
  deductions: number = 0
): number => {
  return baseSalary + allowances + bonus - deductions;
};

/**
 * Calculate pro-rated salary based on present days
 */
export const calculateProRatedSalary = (
  baseSalary: number,
  workingDays: number,
  presentDays: number,
  allowances: number = 0,
  bonus: number = 0,
  deductions: number = 0
): number => {
  const dailySalary = baseSalary / workingDays;
  const earnedSalary = dailySalary * presentDays;
  return earnedSalary + allowances + bonus - deductions;
};

/**
 * Format currency (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};
