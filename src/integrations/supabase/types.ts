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
      business_categories: {
        Row: {
          created_at: string
          created_by_user_id: string
          currency: string
          default_tax: number
          enabled_features: string[]
          enabled_modules: string[]
          id: string
          industry_type: string
          internal_description: string | null
          name: string
          status: string
          stock_alert_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          currency?: string
          default_tax?: number
          enabled_features?: string[]
          enabled_modules?: string[]
          id?: string
          industry_type: string
          internal_description?: string | null
          name: string
          status?: string
          stock_alert_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          currency?: string
          default_tax?: number
          enabled_features?: string[]
          enabled_modules?: string[]
          id?: string
          industry_type?: string
          internal_description?: string | null
          name?: string
          status?: string
          stock_alert_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          business_address: string | null
          business_name: string
          category_id: string | null
          created_at: string
          currency: string
          default_tax: number
          id: string
          last_active: string
          listed_products: number
          owner_user_id: string
          status: string
          stock_alert_limit: number
          updated_at: string
          usage: number
        }
        Insert: {
          business_address?: string | null
          business_name: string
          category_id?: string | null
          created_at?: string
          currency?: string
          default_tax?: number
          id?: string
          last_active?: string
          listed_products?: number
          owner_user_id: string
          status?: string
          stock_alert_limit?: number
          updated_at?: string
          usage?: number
        }
        Update: {
          business_address?: string | null
          business_name?: string
          category_id?: string | null
          created_at?: string
          currency?: string
          default_tax?: number
          id?: string
          last_active?: string
          listed_products?: number
          owner_user_id?: string
          status?: string
          stock_alert_limit?: number
          updated_at?: string
          usage?: number
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          billing_email: string
          business_id: string | null
          client_name: string
          created_at: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          owner_user_id: string | null
          payment_method: string
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_email: string
          business_id?: string | null
          client_name: string
          created_at?: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          owner_user_id?: string | null
          payment_method?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_email?: string
          business_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          owner_user_id?: string | null
          payment_method?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string
          features: string[]
          id: string
          is_active: boolean
          is_popular: boolean
          lifetime_price: number
          monthly_price: number
          name: string
          payment_method_synced: boolean
          plan_key: string
          sort_order: number
          tagline: string | null
          updated_at: string
          yearly_price: number
        }
        Insert: {
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          lifetime_price?: number
          monthly_price?: number
          name: string
          payment_method_synced?: boolean
          plan_key: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_popular?: boolean
          lifetime_price?: number
          monthly_price?: number
          name?: string
          payment_method_synced?: boolean
          plan_key?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string | null
          id: string
          industry_assignments: string[]
          inherit_alerts: boolean
          inherit_barcode: boolean
          inherit_batch: boolean
          inherit_expiry: boolean
          name: string
          parent_id: string | null
          slug: string
          status: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description?: string | null
          id?: string
          industry_assignments?: string[]
          inherit_alerts?: boolean
          inherit_barcode?: boolean
          inherit_batch?: boolean
          inherit_expiry?: boolean
          name: string
          parent_id?: string | null
          slug: string
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          id?: string
          industry_assignments?: string[]
          inherit_alerts?: boolean
          inherit_barcode?: boolean
          inherit_batch?: boolean
          inherit_expiry?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_active: string
          listed_products: number
          plan: string
          status: string
          usage: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_active?: string
          listed_products?: number
          plan?: string
          status?: string
          usage?: number
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_active?: string
          listed_products?: number
          plan?: string
          status?: string
          usage?: number
          user_id?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          business_id: string | null
          created_at: string
          id: string
          owner_user_id: string
          reason: string
          resolved_at: string | null
          status: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount?: number
          business_id?: string | null
          created_at?: string
          id?: string
          owner_user_id: string
          reason: string
          resolved_at?: string | null
          status?: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          business_id?: string | null
          created_at?: string
          id?: string
          owner_user_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          cycle: string
          id: string
          next_billing_date: string | null
          owner_user_id: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          created_at?: string
          cycle?: string
          id?: string
          next_billing_date?: string | null
          owner_user_id: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          cycle?: string
          id?: string
          next_billing_date?: string | null
          owner_user_id?: string
          status?: string
          tier?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_business_limit: { Args: { _plan: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
