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
      businesses: {
        Row: {
          address: string
          city: string
          cover_url: string
          created_at: string
          description: string
          id: string
          lat: number
          lng: number
          menu_link: string | null
          mobile: string
          name: string
          owner_id: string
          phone: string
          status: Database["public"]["Enums"]["business_status"]
        }
        Insert: {
          address: string
          city: string
          cover_url: string
          created_at?: string
          description: string
          id?: string
          lat: number
          lng: number
          menu_link?: string | null
          mobile: string
          name: string
          owner_id: string
          phone: string
          status?: Database["public"]["Enums"]["business_status"]
        }
        Update: {
          address?: string
          city?: string
          cover_url?: string
          created_at?: string
          description?: string
          id?: string
          lat?: number
          lng?: number
          menu_link?: string | null
          mobile?: string
          name?: string
          owner_id?: string
          phone?: string
          status?: Database["public"]["Enums"]["business_status"]
        }
        Relationships: []
      }
      gathering_attendees: {
        Row: {
          gathering_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          gathering_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          gathering_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_attendees_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "gatherings"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_checklist_checks: {
        Row: {
          checked_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          checked_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_checklist_checks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "gathering_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_checklist_items: {
        Row: {
          created_at: string
          gathering_id: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          gathering_id: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          gathering_id?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "gathering_checklist_items_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "gatherings"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_messages: {
        Row: {
          body: string
          created_at: string
          gathering_id: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          gathering_id: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          gathering_id?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_messages_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "gatherings"
            referencedColumns: ["id"]
          },
        ]
      }
      gatherings: {
        Row: {
          address: string | null
          business_id: string | null
          city: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          host_id: string
          id: string
          lat: number | null
          lng: number | null
          neighborhood: string
          origin: string
          seats: number
          starts_at: string
          status: Database["public"]["Enums"]["gathering_status"]
          subject: string
          table_id: string | null
          venue_name: string
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          host_id: string
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood: string
          origin?: string
          seats?: number
          starts_at: string
          status?: Database["public"]["Enums"]["gathering_status"]
          subject: string
          table_id?: string | null
          venue_name: string
        }
        Update: {
          address?: string | null
          business_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          host_id?: string
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string
          origin?: string
          seats?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["gathering_status"]
          subject?: string
          table_id?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "gatherings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gatherings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gatherings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "venue_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: Json
          social_links: Json
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          interests?: Json
          social_links?: Json
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: Json
          social_links?: Json
        }
        Relationships: []
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
      venue_tables: {
        Row: {
          business_id: string
          capacity: number
          created_at: string
          id: string
          label: string
        }
        Insert: {
          business_id: string
          capacity?: number
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          business_id?: string
          capacity?: number
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tables_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          interests: string | null
          name: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          interests?: string | null
          name: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          interests?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      businesses_public: {
        Row: {
          address: string | null
          city: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          id: string | null
          lat: number | null
          lng: number | null
          menu_link: string | null
          name: string | null
          status: Database["public"]["Enums"]["business_status"] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          menu_link?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          menu_link?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["business_status"] | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "business_owner" | "user" | "venue"
      business_status: "pending" | "approved" | "rejected"
      gathering_status: "proposed" | "approved" | "cancelled" | "rejected"
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
      app_role: ["admin", "business_owner", "user", "venue"],
      business_status: ["pending", "approved", "rejected"],
      gathering_status: ["proposed", "approved", "cancelled", "rejected"],
    },
  },
} as const
