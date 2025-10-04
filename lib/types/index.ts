import { Tables } from '../supabase/types';

// Database table types
export type User = Tables<'users'>;
export type AttendanceRecord = Tables<'attendance_records'>;
export type SalaryRecord = Tables<'salary_records'> & {
  // Computed fields added by query functions for UI compatibility
  month_year?: string;
  days_worked?: number;
  paid_date?: string | null;
};
export type LeaveRequest = Tables<'leave_requests'>;
export type Notification = Tables<'notifications'>;
export type Organization = Tables<'organizations'>;

// Enums
export type UserRole = 'employee' | 'hr' | 'admin';
export type LeaveType = 'sick' | 'casual' | 'earned' | 'unpaid' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type SalaryStatus = 'draft' | 'pending' | 'approved' | 'paid';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'upi';
export type NotificationType = 'attendance' | 'salary' | 'leave' | 'announcement' | 'system';

// Extended types with relations
export type UserWithOrganization = User & {
  organization?: Organization;
};

export type AttendanceWithUser = AttendanceRecord & {
  user?: Pick<User, 'full_name' | 'employee_id'>;
};

export type SalaryWithUser = SalaryRecord & {
  user?: Pick<User, 'full_name' | 'employee_id'>;
};

export type LeaveRequestWithUser = LeaveRequest & {
  user?: Pick<User, 'full_name' | 'employee_id'>;
  reviewer?: Pick<User, 'full_name'>;
};

// Monthly attendance summary
export interface MonthlyAttendanceSummary {
  records: AttendanceRecord[];
  totalDays: number;
  validDays: number;
  totalHours: number;
  avgHours: number;
}

// Dashboard stats
export interface EmployeeDashboardStats {
  todayAttendance: AttendanceRecord | null;
  monthlyAttendance: MonthlyAttendanceSummary;
  upcomingLeaves: LeaveRequest[];
  latestSalary: SalaryRecord | null;
  unreadNotifications: number;
}

export interface HRDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayPresent: number;
  pendingLeaveRequests: number;
  pendingSalaryRecords: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  email: string;
  password: string;
  fullName: string;
  employeeId: string;
  phone?: string;
}

export interface CheckInForm {
  notes?: string;
}

export interface CheckOutForm {
  notes?: string;
}

export interface LeaveRequestForm {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface SalaryRecordForm {
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  allowances?: number;
  deductions?: number;
  bonus?: number;
  workingDays: number;
  presentDays: number;
  leavesTaken?: number;
  notes?: string;
}

export interface EmployeeForm {
  fullName: string;
  email: string;
  employeeId: string;
  phone?: string;
  role: UserRole;
  department?: string;
  designation?: string;
  dateOfJoining?: string;
  password?: string;
}

// Organization stats
export interface OrganizationStats {
  totalEmployees: number;
  activeEmployees: number;
  hrCount: number;
  employeeCount: number;
  presentToday: number;
  absentToday: number;
  pendingLeaveRequests: number;
}
