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
      bookings: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          meal_id: string
          payment_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          meal_id: string
          payment_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          meal_id?: string
          payment_amount?: number | null
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
      meals: {
        Row: {
          allergens: string[] | null
          arrival_time: string | null
          available_portions: number
          barter_requests: string[] | null
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
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          arrival_time?: string | null
          available_portions?: number
          barter_requests?: string[] | null
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
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          arrival_time?: string | null
          available_portions?: number
          barter_requests?: string[] | null
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
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message_text: string
          original_language: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message_text: string
          original_language: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
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
          allergens: string[] | null
          created_at: string
          dislikes: string[] | null
          display_real_name: boolean | null
          first_name: string
          id: string
          karma: number
          language: string
          last_name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string
          dislikes?: string[] | null
          display_real_name?: boolean | null
          first_name: string
          id: string
          karma?: number
          language?: string
          last_name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          created_at?: string
          dislikes?: string[] | null
          display_real_name?: boolean | null
          first_name?: string
          id?: string
          karma?: number
          language?: string
          last_name?: string
          role?: string | null
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
