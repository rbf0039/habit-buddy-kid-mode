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
      badges: {
        Row: {
          child_id: string
          description: string | null
          earned_at: string
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          child_id: string
          description?: string | null
          earned_at?: string
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          child_id?: string
          description?: string | null
          earned_at?: string
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          avatar_url: string | null
          coin_balance: number
          created_at: string
          current_streak: number
          id: string
          name: string
          parent_id: string
        }
        Insert: {
          age: number
          avatar_url?: string | null
          coin_balance?: number
          created_at?: string
          current_streak?: number
          id?: string
          name: string
          parent_id: string
        }
        Update: {
          age?: number
          avatar_url?: string | null
          coin_balance?: number
          created_at?: string
          current_streak?: number
          id?: string
          name?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_progress: {
        Row: {
          child_id: string
          completed_at: string
          date: string
          habit_id: string
          id: string
          step_id: string | null
        }
        Insert: {
          child_id: string
          completed_at?: string
          date?: string
          habit_id: string
          id?: string
          step_id?: string | null
        }
        Update: {
          child_id?: string
          completed_at?: string
          date?: string
          habit_id?: string
          id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_progress_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "habit_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_steps: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          name: string
          order_index: number
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_steps_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          allowed_days: string[] | null
          child_id: string
          coins_per_completion: number
          cooldown_minutes: number
          created_at: string
          description: string | null
          frequency: string
          icon: string
          id: string
          is_active: boolean
          name: string
          times_per_period: number
        }
        Insert: {
          allowed_days?: string[] | null
          child_id: string
          coins_per_completion?: number
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          frequency?: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          times_per_period?: number
        }
        Update: {
          allowed_days?: string[] | null
          child_id?: string
          coins_per_completion?: number
          cooldown_minutes?: number
          created_at?: string
          description?: string | null
          frequency?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          times_per_period?: number
        }
        Relationships: [
          {
            foreignKeyName: "habits_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          pin: string | null
          timezone: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          pin?: string | null
          timezone?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          pin?: string | null
          timezone?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          child_id: string
          id: string
          redeemed_at: string
          reward_id: string
          status: string
        }
        Insert: {
          child_id: string
          id?: string
          redeemed_at?: string
          reward_id: string
          status?: string
        }
        Update: {
          child_id?: string
          id?: string
          redeemed_at?: string
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          child_id: string | null
          coin_cost: number
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          parent_id: string
        }
        Insert: {
          child_id?: string | null
          coin_cost: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id: string
        }
        Update: {
          child_id?: string | null
          coin_cost?: number
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
