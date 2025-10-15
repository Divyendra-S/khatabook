import { supabase } from '@/lib/supabase/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Interface for salary slip data
 */
export interface SalarySlipData {
  employee: {
    name: string;
    employeeId: string;
    phone: string;
    hourlyRate: number;
  };
  organization: {
    name: string;
  };
  period: {
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  };
  earnings: {
    totalHours: number;
    earnedSalary: number;
  };
  attendance: {
    present: number;
    absent: number;
    leaves: number;
    totalHours: number;
  };
  dailyAttendance: Array<{
    date: string;
    dayName: string;
    status: 'P' | 'A' | 'HD' | 'WO' | 'PCO' | 'HDCO';
    hours?: number;
  }>;
  previousBalance?: number;
}

/**
 * Fetch salary slip data for a user and month
 */
export async function fetchSalarySlipData(
  userId: string,
  month: number,
  year: number
): Promise<SalarySlipData> {
  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('employee_id, full_name, phone, hourly_rate, organization_id, working_days')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  // Organization name (hardcoded)
  const organizationName = 'SAS Migration';

  // Fetch monthly earnings
  const { data: earnings, error: earningsError } = await supabase
    .from('employee_monthly_earnings')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single();

  if (earningsError) throw earningsError;

  // Calculate date range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const totalDaysInMonth = endDate.getDate();
  const startDateStr = formatDateLocal(year, month, 1);
  const endDateStr = formatDateLocal(year, month, totalDaysInMonth);

  // Fetch attendance records for the month
  const { data: attendanceRecords, error: attendanceError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (attendanceError) throw attendanceError;

  // Get previous month balance (if exists)
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const { data: previousEarnings } = await supabase
    .from('employee_monthly_earnings')
    .select('earned_salary')
    .eq('user_id', userId)
    .eq('month', previousMonth)
    .eq('year', previousYear)
    .single();

  // Calculate attendance summary
  const presentDays = attendanceRecords?.length || 0;

  // Count working days in month based on user's working_days
  const workingDaysInMonth = calculateWorkingDaysInMonth(
    year,
    month,
    user.working_days || []
  );

  const absentDays = workingDaysInMonth - presentDays;

  // Generate daily attendance calendar
  const dailyAttendance: SalarySlipData['dailyAttendance'] = [];
  const attendanceMap = new Map(
    attendanceRecords?.map((record) => [record.date, record]) || []
  );

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = formatDateLocal(year, month, day);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const attendance = attendanceMap.get(dateStr);
    const isWorkingDay = user.working_days?.includes(dayKey);

    if (attendance) {
      dailyAttendance.push({
        date: dateStr,
        dayName,
        status: 'P',
        hours: Number(attendance.total_hours) || 0,
      });
    } else if (!isWorkingDay) {
      dailyAttendance.push({
        date: dateStr,
        dayName,
        status: 'WO', // Weekly Off
      });
    } else {
      dailyAttendance.push({
        date: dateStr,
        dayName,
        status: 'A', // Absent
      });
    }
  }

  return {
    employee: {
      name: user.full_name,
      employeeId: user.employee_id,
      phone: user.phone || 'N/A',
      hourlyRate: Number(user.hourly_rate) || 0,
    },
    organization: {
      name: organizationName,
    },
    period: {
      month,
      year,
      startDate: startDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      endDate: endDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    },
    earnings: {
      totalHours: Number(earnings.total_hours_worked) || 0,
      earnedSalary: Number(earnings.earned_salary) || 0,
    },
    attendance: {
      present: presentDays,
      absent: absentDays,
      leaves: 0, // TODO: Implement leaves tracking
      totalHours: Number(earnings.total_hours_worked) || 0,
    },
    dailyAttendance,
    previousBalance: previousEarnings ? Number(previousEarnings.earned_salary) : 0,
  };
}

/**
 * Format date to YYYY-MM-DD without timezone issues
 */
function formatDateLocal(year: number, month: number, day: number): string {
  const yyyy = year;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calculate working days in a month based on working_days array
 */
function calculateWorkingDaysInMonth(
  year: number,
  month: number,
  workingDays: string[]
): number {
  if (!workingDays || workingDays.length === 0) return 0;

  const totalDays = new Date(year, month, 0).getDate();
  let workingDaysCount = 0;

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (workingDays.includes(dayKey)) {
      workingDaysCount++;
    }
  }

  return workingDaysCount;
}

/**
 * Generate HTML for salary slip
 */
function generateSalarySlipHTML(data: SalarySlipData): string {
  const netPayable = data.earnings.earnedSalary + (data.previousBalance || 0);

  // Generate calendar HTML
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  data.dailyAttendance.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();

    // Start a new week on Monday
    if (dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    // Add empty cells for the first week
    if (index === 0 && dayOfWeek !== 1) {
      const emptyCells = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      for (let i = 0; i < emptyCells; i++) {
        currentWeek.push('<td style="padding: 8px; border: 1px solid #e2e8f0;"></td>');
      }
    }

    const dateNum = new Date(day.date).getDate();
    const dateStr = String(dateNum).padStart(2, '0');
    const monthStr = new Date(day.date).toLocaleDateString('en-US', { month: 'short' });

    let cellContent = '';
    if (day.status === 'P' && day.hours) {
      const hours = Math.floor(day.hours);
      const minutes = Math.round((day.hours - hours) * 60);
      cellContent = `<strong>${dateNum} ${monthStr}</strong><br/>P [${hours}:${String(minutes).padStart(2, '0')}] Hrs`;
    } else if (day.status === 'A') {
      cellContent = `<strong>${dateNum} ${monthStr}</strong><br/>Absent`;
    } else if (day.status === 'WO') {
      cellContent = `<strong>${dateNum} ${monthStr}</strong><br/>Week Off`;
    }

    currentWeek.push(`
      <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-size: 11px;">
        ${cellContent}
      </td>
    `);

    // Complete week on Sunday
    if (dayOfWeek === 0 || index === data.dailyAttendance.length - 1) {
      // Fill remaining cells
      while (currentWeek.length < 7) {
        currentWeek.push('<td style="padding: 8px; border: 1px solid #e2e8f0;"></td>');
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const calendarRows = weeks.map(week => `<tr>${week.join('')}</tr>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
        h2 { font-size: 18px; font-weight: 600; margin: 20px 0 10px; }
        .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .info-item { font-size: 12px; }
        .info-label { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #e2e8f0; }
        th { background-color: #f8fafc; font-weight: 600; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
        .summary-item { padding: 10px; border: 1px solid #e2e8f0; text-align: center; }
        .summary-label { font-size: 11px; color: #64748b; }
        .summary-value { font-size: 16px; font-weight: 600; margin-top: 4px; }
        .total-row { font-weight: 700; background-color: #f8fafc; }
        .calendar-header th { background-color: #6366f1; color: white; text-align: center; padding: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${data.organization.name}</h1>
        <h2>Salary Slip (${data.period.startDate} - ${data.period.endDate})</h2>

        <div class="header-info">
          <div class="info-item">
            <div><span class="info-label">${data.employee.name}</span></div>
          </div>
          <div class="info-item">
            <div><span class="info-label">Phone No</span> ${data.employee.phone}</div>
          </div>
          <div class="info-item">
            <div><span class="info-label">Hourly Salary</span> ₹ ${data.employee.hourlyRate.toFixed(2)}</div>
          </div>
        </div>

        <h2>Payment & Salary (${data.period.startDate} - ${data.period.endDate})</h2>
        <table>
          <thead>
            <tr>
              <th>Earnings</th>
              <th>Activity Date</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hourly Salary ₹ ${data.employee.hourlyRate.toFixed(2)} x ${data.earnings.totalHours.toFixed(2)} Hrs</td>
              <td>--</td>
              <td style="text-align: right;">₹ ${data.earnings.earnedSalary.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Earnings</td>
              <td></td>
              <td style="text-align: right;">₹ ${data.earnings.earnedSalary.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table style="margin-top: 20px;">
          <tbody>
            <tr>
              <td>Previous Month Closing Balance</td>
              <td style="text-align: right;">₹ ${(data.previousBalance || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Net Payable (Earnings + Previous Balance)</td>
              <td style="text-align: right;">₹ ${netPayable.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Attendance Summary (${data.period.startDate} - ${data.period.endDate})</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Present</div>
            <div class="summary-value">${data.attendance.present}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Absent</div>
            <div class="summary-value">${data.attendance.absent}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Leaves</div>
            <div class="summary-value">${data.attendance.leaves}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Hours</div>
            <div class="summary-value">${data.attendance.totalHours.toFixed(2)}</div>
          </div>
        </div>

        <h2>Monthly Calendar</h2>
        <table>
          <thead>
            <tr class="calendar-header">
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
              <th>Sun</th>
            </tr>
          </thead>
          <tbody>
            ${calendarRows}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate and download salary slip as PDF
 */
export async function downloadSalarySlip(
  userId: string,
  month: number,
  year: number
): Promise<void> {
  try {
    // Fetch data
    const data = await fetchSalarySlipData(userId, month, year);

    // Generate HTML
    const html = generateSalarySlipHTML(data);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Share/download the PDF
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Salary Slip - ${data.employee.name} - ${data.period.startDate}`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Error generating salary slip:', error);
    throw error;
  }
}

/**
 * Get available months for salary slips for a user
 * Only returns completed months (excludes current month)
 */
export async function getAvailableMonths(userId: string): Promise<
  Array<{
    month: number;
    year: number;
    totalHours: number;
    earnedSalary: number;
  }>
> {
  const { data, error } = await supabase
    .from('employee_monthly_earnings')
    .select('month, year, total_hours_worked, earned_salary')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) throw error;

  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11, we need 1-12
  const currentYear = now.getFullYear();

  // Filter out current month - only show completed months
  const filteredData = data?.filter((record) => {
    // Show if year is before current year
    if (record.year < currentYear) return true;

    // If same year, only show months before current month
    if (record.year === currentYear && record.month < currentMonth) return true;

    // Hide current month and future months
    return false;
  });

  return (
    filteredData?.map((record) => ({
      month: record.month,
      year: record.year,
      totalHours: Number(record.total_hours_worked) || 0,
      earnedSalary: Number(record.earned_salary) || 0,
    })) || []
  );
}
