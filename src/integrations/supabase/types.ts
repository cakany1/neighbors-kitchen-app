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
      app_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          guest_composition: string | null
          guest_id: string
          id: string
          meal_id: string
          payment_amount: number | null
          payout_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_composition?: string | null
          guest_id: string
          id?: string
          meal_id: string
          payment_amount?: number | null
          payout_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_composition?: string | null
          guest_id?: string
          id?: string
          meal_id?: string
          payment_amount?: number | null
          payout_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      language_requests: {
        Row: {
          created_at: string | null
          id: string
          language_name: string
          requested_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_name: string
          requested_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language_name?: string
          requested_by_user_id?: string | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          allergens: string[] | null
          arrival_time: string | null
          available_portions: number
          barter_requests: string[] | null
          booked_seats: number | null
          chef_id: string
          collection_window_end: string | null
          collection_window_start: string | null
          created_at: string
          description: string
          estimated_restaurant_value: number | null
          exact_address: string
          exchange_mode: string | null
          fuzzy_lat: number
          fuzzy_lng: number
          handover_mode: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_cooking_experience: boolean
          is_stock_photo: boolean | null
          max_seats: number | null
          neighborhood: string
          pricing_minimum: number
          pricing_suggested: number | null
          restaurant_reference_price: number | null
          scheduled_date: string
          tags: string[] | null
          title: string
          unit_type: string | null
          updated_at: string
          women_only: boolean | null
        }
        Insert: {
          allergens?: string[] | null
          arrival_time?: string | null
          available_portions?: number
          barter_requests?: string[] | null
          booked_seats?: number | null
          chef_id: string
          collection_window_end?: string | null
          collection_window_start?: string | null
          created_at?: string
          description: string
          estimated_restaurant_value?: number | null
          exact_address: string
          exchange_mode?: string | null
          fuzzy_lat: number
          fuzzy_lng: number
          handover_mode?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_cooking_experience?: boolean
          is_stock_photo?: boolean | null
          max_seats?: number | null
          neighborhood: string
          pricing_minimum?: number
          pricing_suggested?: number | null
          restaurant_reference_price?: number | null
          scheduled_date: string
          tags?: string[] | null
          title: string
          unit_type?: string | null
          updated_at?: string
          women_only?: boolean | null
        }
        Update: {
          allergens?: string[] | null
          arrival_time?: string | null
          available_portions?: number
          barter_requests?: string[] | null
          booked_seats?: number | null
          chef_id?: string
          collection_window_end?: string | null
          collection_window_start?: string | null
          created_at?: string
          description?: string
          estimated_restaurant_value?: number | null
          exact_address?: string
          exchange_mode?: string | null
          fuzzy_lat?: number
          fuzzy_lng?: number
          handover_mode?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_cooking_experience?: boolean
          is_stock_photo?: boolean | null
          max_seats?: number | null
          neighborhood?: string
          pricing_minimum?: number
          pricing_suggested?: number | null
          restaurant_reference_price?: number | null
          scheduled_date?: string
          tags?: string[] | null
          title?: string
          unit_type?: string | null
          updated_at?: string
          women_only?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_meals_profiles"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          original_language: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          original_language: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          original_language?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          allergens: string[] | null
          avatar_url: string | null
          created_at: string
          dislikes: string[] | null
          display_real_name: boolean | null
          first_name: string
          gender: string | null
          iban: string | null
          id: string
          id_verified: boolean | null
          is_couple: boolean | null
          karma: number
          languages: string[] | null
          last_name: string
          latitude: number | null
          longitude: number | null
          nickname: string | null
          notification_radius: number | null
          partner_gender: string | null
          partner_name: string | null
          partner_photo_url: string | null
          phone_number: string | null
          phone_verified: boolean | null
          private_address: string | null
          private_city: string | null
          private_postal_code: string | null
          role: string | null
          updated_at: string
          vacation_mode: boolean | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          age?: number | null
          allergens?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dislikes?: string[] | null
          display_real_name?: boolean | null
          first_name: string
          gender?: string | null
          iban?: string | null
          id: string
          id_verified?: boolean | null
          is_couple?: boolean | null
          karma?: number
          languages?: string[] | null
          last_name: string
          latitude?: number | null
          longitude?: number | null
          nickname?: string | null
          notification_radius?: number | null
          partner_gender?: string | null
          partner_name?: string | null
          partner_photo_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          private_address?: string | null
          private_city?: string | null
          private_postal_code?: string | null
          role?: string | null
          updated_at?: string
          vacation_mode?: boolean | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          age?: number | null
          allergens?: string[] | null
          avatar_url?: string | null
          created_at?: string
          dislikes?: string[] | null
          display_real_name?: boolean | null
          first_name?: string
          gender?: string | null
          iban?: string | null
          id?: string
          id_verified?: boolean | null
          is_couple?: boolean | null
          karma?: number
          languages?: string[] | null
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          nickname?: string | null
          notification_radius?: number | null
          partner_gender?: string | null
          partner_name?: string | null
          partner_photo_url?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          private_address?: string | null
          private_city?: string | null
          private_postal_code?: string | null
          role?: string | null
          updated_at?: string
          vacation_mode?: boolean | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          reason: string
          reported_meal_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          reported_meal_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          reported_meal_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_meal_id_fkey"
            columns: ["reported_meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_meal: {
        Args: { p_guest_id: string; p_meal_id: string }
        Returns: Json
      }
      cancel_booking: {
        Args: { p_booking_id: string; p_guest_id: string }
        Returns: Json
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
      app_role: "admin" | "moderator" | "user"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
