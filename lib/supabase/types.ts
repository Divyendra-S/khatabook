export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          aadhaar_number: string | null
          date_of_birth: string | null
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          base_salary: number | null
          branch_name: string | null
          created_at: string | null
          daily_working_hours: number | null
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string
          employee_id: string
          full_name: string
          hourly_rate: number | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          monthly_total_hours: number | null
          organization_id: string | null
          phone: string | null
          profile_picture_url: string | null
          role: string
          updated_at: string | null
          working_days: string[] | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
