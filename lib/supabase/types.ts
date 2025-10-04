export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          check_in_method: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          date: string
          id: string
          is_valid_day: boolean | null
          marked_by: string | null
          marked_by_role: string | null
          notes: string | null
          total_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date: string
          id?: string
          is_valid_day?: boolean | null
          marked_by?: string | null
          marked_by_role?: string | null
          notes?: string | null
          total_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_method?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date?: string
          id?: string
          is_valid_day?: boolean | null
          marked_by?: string | null
          marked_by_role?: string | null
          notes?: string | null
          total_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          start_date: string
          status: string
          total_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date: string
          status?: string
          total_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          start_date?: string
          status?: string
          total_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_records: {
        Row: {
          allowances: number | null
          approved_by: string | null
          base_salary: number
          bonus: number | null
          created_at: string | null
          created_by: string | null
          deductions: number | null
          id: string
          leaves_taken: number | null
          month: number
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          present_days: number
          status: string
          total_salary: number | null
          updated_at: string | null
          user_id: string
          working_days: number
          year: number
        }
        Insert: {
          allowances?: number | null
          approved_by?: string | null
          base_salary: number
          bonus?: number | null
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          id?: string
          leaves_taken?: number | null
          month: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          present_days: number
          status?: string
          total_salary?: number | null
          updated_at?: string | null
          user_id: string
          working_days: number
          year: number
        }
        Update: {
          allowances?: number | null
          approved_by?: string | null
          base_salary?: number
          bonus?: number | null
          created_at?: string | null
          created_by?: string | null
          deductions?: number | null
          id?: string
          leaves_taken?: number | null
          month?: number
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          present_days?: number
          status?: string
          total_salary?: number | null
          updated_at?: string | null
          user_id?: string
          working_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          profile_picture_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          profile_picture_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_related_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_monthly_attendance_summary: {
        Args: { p_month: number; p_user_id: string; p_year: number }
        Returns: {
          avg_hours: number
          present_days: number
          total_days: number
          total_hours: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
