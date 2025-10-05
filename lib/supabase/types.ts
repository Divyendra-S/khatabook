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
      employee_monthly_earnings: {
        Row: {
          created_at: string | null
          earned_salary: number | null
          expected_hours: number | null
          id: string
          month: number
          total_hours_worked: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          earned_salary?: number | null
          expected_hours?: number | null
          id?: string
          month: number
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          earned_salary?: number | null
          expected_hours?: number | null
          id?: string
          month?: number
          total_hours_worked?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_monthly_earnings_user_id_fkey"
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
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
      user_role_cache: {
        Row: {
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          base_salary: number | null
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
          is_active: boolean | null
          monthly_total_hours: number | null
          organization_id: string | null
          phone: string | null
          profile_picture_url: string | null
          role: string
          updated_at: string | null
          working_days: string[] | null
        }
        Insert: {
          base_salary?: number | null
          created_at?: string | null
          daily_working_hours?: number | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email: string
          employee_id: string
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          monthly_total_hours?: number | null
          organization_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Update: {
          base_salary?: number | null
          created_at?: string | null
          daily_working_hours?: number | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          monthly_total_hours?: number | null
          organization_id?: string | null
          phone?: string | null
          profile_picture_url?: string | null
          role?: string
          updated_at?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_working_days_in_month: {
        Args: {
          target_month: number
          target_year: number
          working_days: string[]
        }
        Returns: number
      }
      create_employee_profile: {
        Args: {
          p_auth_user_id: string
          p_date_of_joining?: string
          p_department?: string
          p_designation?: string
          p_email: string
          p_employee_id: string
          p_full_name: string
          p_organization_id?: string
          p_phone?: string
          p_role?: string
        }
        Returns: Json
      }
      create_employee_with_auth: {
        Args: {
          p_date_of_joining?: string
          p_department?: string
          p_designation?: string
          p_email: string
          p_employee_id: string
          p_full_name: string
          p_organization_id?: string
          p_password: string
          p_phone?: string
          p_role?: string
        }
        Returns: Json
      }
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
      get_my_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_hr_or_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
