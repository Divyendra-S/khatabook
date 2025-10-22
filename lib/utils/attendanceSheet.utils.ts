import { supabase } from '@/lib/supabase/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Alert } from 'react-native';

/**
 * Interface for attendance report data
 */
export interface AttendanceReportData {
  employee: {
    name: string;
    employeeId: string;
    phone: string;
    hourlyRate: number;
    aadhaarNumber?: string;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  earnings: {
    totalHours: number;
    expectedHours: number;
    earnedSalary: number;
  };
  attendance: {
    present: number;
    absent: number;
    totalHours: number;
  };
  dailyAttendance: Array<{
    date: string;
    dayName: string;
    status: 'P' | 'A' | 'WO';
    hours?: number;
  }>;
}

/**
 * Fetch attendance report data for a user and month
 */
export async function fetchAttendanceReportData(
  userId: string,
  month: number,
  year: number
): Promise<AttendanceReportData> {
  // Fetch user data
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('employee_id, full_name, phone, hourly_rate, working_days, aadhaar_number')
    .eq('id', userId)
    .single();

  if (userError) throw userError;

  // Fetch monthly earnings
  const { data: earnings, error: earningsError } = await supabase
    .from('employee_monthly_earnings')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .single();

  // If no earnings record exists, throw a user-friendly error
  if (earningsError && earningsError.code !== 'PGRST116') throw earningsError;
  if (!earnings) {
    throw new Error('No attendance data found for this month. Please ensure the month has ended and earnings have been calculated.');
  }

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
  const dailyAttendance: AttendanceReportData['dailyAttendance'] = [];
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

  const monthName = startDate.toLocaleDateString('en-US', { month: 'long' });

  return {
    employee: {
      name: user.full_name,
      employeeId: user.employee_id,
      phone: user.phone || 'N/A',
      hourlyRate: Number(user.hourly_rate) || 0,
      aadhaarNumber: user.aadhaar_number || undefined,
    },
    period: {
      month,
      year,
      monthName: `${monthName} ${year}`,
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
      expectedHours: Number(earnings.expected_hours) || 0,
      earnedSalary: Number(earnings.earned_salary) || 0,
    },
    attendance: {
      present: presentDays,
      absent: absentDays,
      totalHours: Number(earnings.total_hours_worked) || 0,
    },
    dailyAttendance,
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
 * Get logo URL from Supabase storage
 */
function getLogoUrl(): string {
  return 'https://yardyctualuppxckvobx.supabase.co/storage/v1/object/public/assets/logo.png';
}

/**
 * Generate HTML for attendance report
 */
function generateAttendanceReportHTML(data: AttendanceReportData): string {
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
        currentWeek.push('<td style="padding: 8px; border: 1px solid #333333;"></td>');
      }
    }

    const dateNum = new Date(day.date).getDate();
    const monthStr = new Date(day.date).toLocaleDateString('en-US', { month: 'short' });
    const isSunday = dayOfWeek === 0;
    const sundayStyle = isSunday ? 'color: #EF4444;' : '';

    let cellContent = '';
    if (day.status === 'P' && day.hours) {
      const hours = Math.floor(day.hours);
      const minutes = Math.round((day.hours - hours) * 60);
      cellContent = `<strong style="${sundayStyle}">${dateNum} ${monthStr}</strong><br/><span style="font-size: 9px; ${sundayStyle}">${hours}:${String(minutes).padStart(2, '0')}</span>`;
    } else if (day.status === 'A') {
      cellContent = `<strong style="${sundayStyle}">${dateNum} ${monthStr}</strong><br/><span style="font-size: 9px; ${sundayStyle}">Ab.</span>`;
    } else if (day.status === 'WO') {
      cellContent = `<strong style="${sundayStyle}">${dateNum} ${monthStr}</strong><br/><span style="font-size: 9px; ${sundayStyle}">Week Off</span>`;
    }

    currentWeek.push(`
      <td style="padding: 8px; border: 1px solid #333333; text-align: center; font-size: 11px;">
        ${cellContent}
      </td>
    `);

    // Complete week on Sunday
    if (dayOfWeek === 0 || index === data.dailyAttendance.length - 1) {
      // Fill remaining cells
      while (currentWeek.length < 7) {
        currentWeek.push('<td style="padding: 8px; border: 1px solid #333333;"></td>');
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
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Calibri', 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
        }

        /* Company Name */
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 20px;
          text-align: center;
        }

        /* Content */
        .content {
          background-color: white;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #0F172A;
        }
        h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 10px;
          color: #0F172A;
        }

        .header-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .info-item {
          font-size: 12px;
        }
        .info-label {
          font-weight: 600;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          padding: 8px 6px;
          text-align: left;
          border: 1px solid #333333;
          font-size: 10pt;
          color: #000000;
        }
        th {
          background-color: white;
          font-weight: normal;
          font-size: 10pt;
          text-align: center;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 20px 0;
        }
        .summary-item {
          padding: 10px;
          border: 1px solid #333333;
          text-align: center;
        }
        .summary-label {
          font-size: 11px;
          color: #64748b;
        }
        .summary-value {
          font-size: 16px;
          font-weight: 600;
          margin-top: 4px;
        }

        .calendar-header th {
          background-color: #6366f1;
          color: white;
          text-align: center;
          padding: 8px;
        }
      </style>
    </head>
    <body>
      <div class="company-name">SAS Migration</div>

      <div class="content">
        <div class="container">
          <h1>Attendance Report - ${data.period.monthName}</h1>

          <div class="header-info">
            <div class="info-item">
              <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${data.employee.name}</div>
              ${data.employee.aadhaarNumber ? `<div style="font-size: 14px;"><span class="info-label">Aadhaar:</span> ${data.employee.aadhaarNumber}</div>` : ''}
            </div>
            <div class="info-item">
              <div style="font-size: 11px;"><span class="info-label">Phone:</span> ${data.employee.phone}</div>
              <div style="font-size: 11px;"><span class="info-label">Hourly Rate:</span> ₹${data.employee.hourlyRate.toFixed(2)}</div>
            </div>
          </div>

          <h2>Salary Summary</h2>
          <table>
            <tbody>
              <tr>
                <td><strong>Total Amount</strong></td>
                <td style="text-align: right;"><strong>₹${data.earnings.earnedSalary.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td><strong>Hours Worked</strong></td>
                <td style="text-align: right;">${data.earnings.totalHours.toFixed(2)} hrs</td>
              </tr>
              <tr>
                <td><strong>Expected Working Hours</strong></td>
                <td style="text-align: right;">${data.earnings.expectedHours.toFixed(2)} hrs</td>
              </tr>
            </tbody>
          </table>

          <h2>Attendance Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Present Days</div>
              <div class="summary-value">${data.attendance.present}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Absent Days</div>
              <div class="summary-value">${data.attendance.absent}</div>
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
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate and download attendance report as PDF
 */
export async function downloadAttendanceReport(
  userId: string,
  month: number,
  year: number
): Promise<void> {
  try {
    // Fetch data
    const data = await fetchAttendanceReportData(userId, month, year);

    // Generate HTML
    const html = generateAttendanceReportHTML(data);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create filename
    const monthName = data.period.monthName.replace(/\s+/g, '_');
    const employeeName = data.employee.name.replace(/\s+/g, '_');
    const fileName = `Attendance_Report_${employeeName}_${monthName}.pdf`;

    // Save to device
    if (Platform.OS === 'android') {
      try {
        // Try to save to Downloads using MediaLibrary
        // Note: This only works in development builds, not in Expo Go
        const { status } = await MediaLibrary.requestPermissionsAsync(false);

        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('Download', asset, false);

          Alert.alert(
            'Success',
            `Attendance report has been downloaded to your device.\n\nFile: ${fileName}`,
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        // MediaLibrary not available (Expo Go) or permission error
        console.log('MediaLibrary not available, using share instead:', error);
      }

      // Fall back to share dialog
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Attendance Report - ${data.employee.name} - ${data.period.monthName}`,
      });
    } else if (Platform.OS === 'ios') {
      // For iOS, use share sheet
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Attendance Report - ${data.employee.name} - ${data.period.monthName}`,
      });
    }
  } catch (error) {
    console.error('Error generating attendance report:', error);
    throw error;
  }
}

/**
 * Get available months for attendance reports for a user
 * Only returns completed months (excludes current month)
 */
export async function getAvailableAttendanceMonths(userId: string): Promise<
  Array<{
    month: number;
    year: number;
    monthName: string;
    totalHours: number;
  }>
> {
  const { data, error } = await supabase
    .from('employee_monthly_earnings')
    .select('month, year, total_hours_worked')
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
    filteredData?.map((record) => {
      const monthName = new Date(record.year, record.month - 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      return {
        month: record.month,
        year: record.year,
        monthName,
        totalHours: Number(record.total_hours_worked) || 0,
      };
    }) || []
  );
}
