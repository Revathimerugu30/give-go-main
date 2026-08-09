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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          id: string
          title: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          description?: string
          icon?: string
          id?: string
          title: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          id?: string
          title?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badge_config: {
        Row: {
          color: string
          description: string
          icon: string
          id: string
          min_points: number
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          description?: string
          icon?: string
          id?: string
          min_points: number
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          description?: string
          icon?: string
          id?: string
          min_points?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      donation_events: {
        Row: {
          actor_id: string | null
          created_at: string
          donation_id: string
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          stage: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          donation_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          stage: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          donation_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_events_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          assigned_at: string | null
          category: string
          city: string
          collected_at: string | null
          collection_photo: string | null
          completed_at: string | null
          condition: string
          created_at: string
          delivered_at: string | null
          delivery_photo: string | null
          description: string | null
          distance_km: number | null
          donor_id: string
          id: string
          images: string[]
          ngo_lat: number | null
          ngo_lng: number | null
          ngo_name: string | null
          pickup_address: string
          pickup_date: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_time: string | null
          quantity: number
          signature_url: string | null
          status: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at: string
          volunteer_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          category: string
          city: string
          collected_at?: string | null
          collection_photo?: string | null
          completed_at?: string | null
          condition?: string
          created_at?: string
          delivered_at?: string | null
          delivery_photo?: string | null
          description?: string | null
          distance_km?: number | null
          donor_id: string
          id?: string
          images?: string[]
          ngo_lat?: number | null
          ngo_lng?: number | null
          ngo_name?: string | null
          pickup_address: string
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_time?: string | null
          quantity?: number
          signature_url?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          title: string
          updated_at?: string
          volunteer_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          category?: string
          city?: string
          collected_at?: string | null
          collection_photo?: string | null
          completed_at?: string | null
          condition?: string
          created_at?: string
          delivered_at?: string | null
          delivery_photo?: string | null
          description?: string | null
          distance_km?: number | null
          donor_id?: string
          id?: string
          images?: string[]
          ngo_lat?: number | null
          ngo_lng?: number | null
          ngo_name?: string | null
          pickup_address?: string
          pickup_date?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_time?: string | null
          quantity?: number
          signature_url?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          title?: string
          updated_at?: string
          volunteer_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          donation_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          donation_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          donation_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_suspended: boolean
          phone: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_suspended?: boolean
          phone?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      reward_config: {
        Row: {
          category: string
          points: number
          updated_at: string
        }
        Insert: {
          category: string
          points?: number
          updated_at?: string
        }
        Update: {
          category?: string
          points?: number
          updated_at?: string
        }
        Relationships: []
      }
      reward_points: {
        Row: {
          category: string | null
          created_at: string
          donation_id: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          points: number
          reason?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          donation_id?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_points_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: true
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_locations: {
        Row: {
          donation_id: string | null
          heading: number | null
          lat: number
          lng: number
          speed: number | null
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          donation_id?: string | null
          heading?: number | null
          lat: number
          lng: number
          speed?: number | null
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          donation_id?: string | null
          heading?: number | null
          lat?: number
          lng?: number
          speed?: number | null
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: []
      }
      volunteer_ratings: {
        Row: {
          comment: string | null
          created_at: string
          donation_id: string
          id: string
          rater_id: string
          rating: number
          volunteer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          donation_id: string
          id?: string
          rater_id: string
          rating: number
          volunteer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          donation_id?: string
          id?: string
          rater_id?: string
          rating?: number
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_ratings_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          avatar_url: string | null
          created_at: string
          is_approved: boolean
          is_available: boolean
          phone: string | null
          service_city: string | null
          status: string
          user_id: string
          vehicle: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          is_approved?: boolean
          is_available?: boolean
          phone?: string | null
          service_city?: string | null
          status?: string
          user_id: string
          vehicle?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          is_approved?: boolean
          is_available?: boolean
          phone?: string | null
          service_city?: string | null
          status?: string
          user_id?: string
          vehicle?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_donor_leaderboard: {
        Args: { _period?: string }
        Returns: {
          avatar_url: string
          city: string
          donations: number
          full_name: string
          points: number
          user_id: string
        }[]
      }
      get_volunteer_leaderboard: {
        Args: never
        Returns: {
          assigned: number
          avatar_url: string
          avg_delivery_minutes: number
          avg_pickup_minutes: number
          cancelled: number
          city: string
          completed: number
          distance_km: number
          full_name: string
          rating: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "volunteer" | "admin"
      donation_status:
        | "pending"
        | "approved"
        | "rejected"
        | "assigned"
        | "collected"
        | "delivered"
        | "completed"
        | "accepted"
        | "traveling"
        | "near_pickup"
        | "in_transit"
        | "failed"
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
    Enums: {
      app_role: ["user", "volunteer", "admin"],
      donation_status: [
        "pending",
        "approved",
        "rejected",
        "assigned",
        "collected",
        "delivered",
        "completed",
        "accepted",
        "traveling",
        "near_pickup",
        "in_transit",
        "failed",
      ],
    },
  },
} as const
