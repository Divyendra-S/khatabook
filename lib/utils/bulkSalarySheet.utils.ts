import { supabase } from '@/lib/supabase/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

/**
 * Interface for employee salary data
 */
export interface EmployeeSalaryData {
  serialNo: number;
  name: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;
  aadhaarNumber: string;
  dateOfBirth: string;
}

/**
 * Fetch all employees' salary data for a given month
 */
export async function fetchMonthlySalaryData(
  month: number,
  year: number
): Promise<EmployeeSalaryData[]> {
  // Fetch all active employees with their earnings for the specified month
  const { data, error } = await supabase
    .from('employee_monthly_earnings')
    .select(`
      user_id,
      earned_salary,
      users!inner (
        full_name,
        employee_id,
        account_number,
        ifsc_code,
        aadhaar_number,
        date_of_birth,
        role
      )
    `)
    .eq('month', month)
    .eq('year', year)
    .eq('users.role', 'employee')
    .eq('users.is_active', true)
    .order('users(full_name)', { ascending: true });

  if (error) throw error;

  // Transform data to match our interface
  const employeeData: EmployeeSalaryData[] = [];

  if (data) {
    data.forEach((record: any, index: number) => {
      const user = record.users;

      // Only include employees with bank details
      if (user && user.account_number && user.ifsc_code && user.aadhaar_number) {
        employeeData.push({
          serialNo: index + 1,
          name: user.full_name || 'N/A',
          accountNumber: user.account_number || 'N/A',
          ifscCode: user.ifsc_code || 'N/A',
          amount: Number(record.earned_salary) || 0,
          aadhaarNumber: user.aadhaar_number || 'N/A',
          dateOfBirth: user.date_of_birth
            ? new Date(user.date_of_birth).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A',
        });
      }
    });
  }

  return employeeData;
}

/**
 * Get month name from number
 */
function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

/**
 * Get logo URL from Supabase storage
 */
function getLogoUrl(): string {
  return 'https://yardyctualuppxckvobx.supabase.co/storage/v1/object/public/assets/logo.png';
}

/**
 * Generate HTML for bulk salary sheet
 */
function generateBulkSalarySheetHTML(
  data: EmployeeSalaryData[],
  month: number,
  year: number
): string {
  const monthName = getMonthName(month);
  const totalAmount = data.reduce((sum, emp) => sum + emp.amount, 0);

  // Get logo URL
  const logoUrl = getLogoUrl();

  // Generate table rows
  const tableRows = data
    .map(
      (emp) => `
    <tr>
      <td style="text-align: center;">${emp.serialNo}</td>
      <td>${emp.name}</td>
      <td style="text-align: center;">${emp.accountNumber}</td>
      <td style="text-align: center;">${emp.ifscCode}</td>
      <td style="text-align: right;">₹${emp.amount.toFixed(2)}</td>
      <td style="text-align: center;">${emp.aadhaarNumber}</td>
      <td style="text-align: center;">${emp.dateOfBirth}</td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          height: 100%;
        }
        body {
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
          margin: -20px;
          padding: 0;
          min-height: calc(100% + 40px);
          display: flex;
          flex-direction: column;
        }

        /* Header Strip */
        .header-strip {
          background-color: #B8463D;
          padding: 25px 20px;
          text-align: center;
        }
        .header-content {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 0 40px;
          max-width: 100%;
        }
        .logo {
          width: 160px;
          height: 160px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .company-name {
          color: white;
          font-size: 42pt;
          font-weight: bold;
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
          letter-spacing: 2px;
          line-height: 1.2;
          flex-shrink: 0;
          text-align: center;
        }

        /* Content */
        .content {
          flex: 1;
          padding: 40px;
          background-color: white;
        }
        .table-container {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
        }
        th {
          padding: 10px 6px;
          text-align: center;
          font-weight: normal;
          font-size: 11pt;
          color: #000000;
          border: 1px solid #333333;
          background-color: white;
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
        }
        td {
          padding: 8px 6px;
          font-size: 10pt;
          color: #000000;
          border: 1px solid #333333;
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
        }

        /* Footer Strip */
        .footer-strip {
          background-color: #B8463D;
          color: white;
          padding: 15px 20px;
          text-align: center;
          margin-top: auto;
        }
        .footer-content {
          font-size: 9pt;
          line-height: 1.6;
          font-family: 'Carlito', 'Open Sans', 'Calibri', 'Arial', sans-serif;
        }
      </style>
    </head>
    <body>
      <!-- Header Strip -->
      <div class="header-strip">
        <div class="header-content">
          <div class="logo"><img src="${logoUrl}" alt="SAS Logo" /></div>
          <div class="company-name">SAS MIGRATION<br/>GROUP</div>
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">Serial No</th>
                <th style="width: 20%;">Name</th>
                <th style="width: 18%;">Account No</th>
                <th style="width: 14%;">Ifsc code</th>
                <th style="width: 12%;">Amount</th>
                <th style="width: 16%;">Aadhaar</th>
                <th style="width: 12%;">DOB</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Strip -->
      <div class="footer-strip">
        <div class="footer-content">
          <div>IND: SCO 30-31, Second Floor, Kalra Market, Sector 13, Karnal 132001, Haryana | AUS: D7/88-98 Marsden St, Parramatta, NSW 2150, Australia</div>
          <div>IND: +91 9729567891 | AUS: +61-451485409</div>
          <div>contact@sasmigration.com | info@sasmigration.com.au</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate and download bulk salary sheet as PDF
 */
export async function downloadBulkSalarySheet(
  month: number,
  year: number
): Promise<void> {
  try {
    // Fetch data
    const data = await fetchMonthlySalaryData(month, year);

    if (data.length === 0) {
      Alert.alert(
        'No Data',
        'No employee salary data found for the selected month.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Generate HTML
    const html = generateBulkSalarySheetHTML(data, month, year);

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
          dialogTitle: `Salary Sheet - ${getMonthName(month)} ${year}`,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    }
  } catch (error) {
    console.error('Error generating bulk salary sheet:', error);
    throw error;
  }
}

/**
 * Get available completed months for salary sheet generation
 * Only returns months that have ended (excludes current month)
 */
export async function getAvailableCompletedMonths(): Promise<
  Array<{
    month: number;
    year: number;
    monthName: string;
    employeeCount: number;
  }>
> {
  const { data, error } = await supabase
    .from('employee_monthly_earnings')
    .select(`
      month,
      year,
      users!inner (role, is_active)
    `)
    .eq('users.role', 'employee')
    .eq('users.is_active', true);

  if (error) throw error;

  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-11, we need 1-12
  const currentYear = now.getFullYear();

  // Group by month and year, count employees
  const monthMap = new Map<string, number>();

  data?.forEach((record: any) => {
    const key = `${record.year}-${record.month}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  // Convert to array and filter out current and future months
  const availableMonths = Array.from(monthMap.entries())
    .map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        monthName: `${getMonthName(month)} ${year}`,
        employeeCount: count,
      };
    })
    .filter((record) => {
      // Show if year is before current year
      if (record.year < currentYear) return true;

      // If same year, only show months before current month
      if (record.year === currentYear && record.month < currentMonth) return true;

      // Hide current month and future months
      return false;
    })
    .sort((a, b) => {
      // Sort by year desc, then month desc
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

  return availableMonths;
}
