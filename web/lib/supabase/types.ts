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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alarm: {
        Row: {
          alarm_name: string
          alarm_type: string
          bridge_id: number
          camera_id: number
          created_at: string
          id: number
          is_read: boolean
          last_alarm_at: string
          read_at: string | null
          site_id: number
          snapshot_urls: string[] | null
          updated_at: string
        }
        Insert: {
          alarm_name: string
          alarm_type: string
          bridge_id: number
          camera_id: number
          created_at?: string
          id?: never
          is_read?: boolean
          last_alarm_at?: string
          read_at?: string | null
          site_id: number
          snapshot_urls?: string[] | null
          updated_at?: string
        }
        Update: {
          alarm_name?: string
          alarm_type?: string
          bridge_id?: number
          camera_id?: number
          created_at?: string
          id?: never
          is_read?: boolean
          last_alarm_at?: string
          read_at?: string | null
          site_id?: number
          snapshot_urls?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alarm_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "camera"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alarm_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge: {
        Row: {
          access_token: string | null
          bridge_name: string
          bridge_uuid: string
          created_at: string
          healthy: boolean
          id: number
          last_checked_at: string
          site_id: number | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          bridge_name: string
          bridge_uuid: string
          created_at?: string
          healthy?: boolean
          id?: never
          last_checked_at?: string
          site_id?: number | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          bridge_name?: string
          bridge_uuid?: string
          created_at?: string
          healthy?: boolean
          id?: never
          last_checked_at?: string
          site_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site"
            referencedColumns: ["id"]
          },
        ]
      }
      camera: {
        Row: {
          bridge_id: number
          camera_name: string
          created_at: string
          healthy: boolean
          id: number
          ip_address: string
          is_registered: boolean
          last_checked_at: string
          password: string
          updated_at: string
          username: string
        }
        Insert: {
          bridge_id: number
          camera_name: string
          created_at?: string
          healthy?: boolean
          id?: never
          ip_address: string
          is_registered?: boolean
          last_checked_at?: string
          password: string
          updated_at?: string
          username: string
        }
        Update: {
          bridge_id?: number
          camera_name?: string
          created_at?: string
          healthy?: boolean
          id?: never
          ip_address?: string
          is_registered?: boolean
          last_checked_at?: string
          password?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridge"
            referencedColumns: ["id"]
          },
        ]
      }
      site: {
        Row: {
          arm_status: string
          arm_status_changed_at: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: number
          logo_url: string | null
          site_name: string
          updated_at: string
        }
        Insert: {
          arm_status?: string
          arm_status_changed_at?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          logo_url?: string | null
          site_name: string
          updated_at?: string
        }
        Update: {
          arm_status?: string
          arm_status_changed_at?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: never
          logo_url?: string | null
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
