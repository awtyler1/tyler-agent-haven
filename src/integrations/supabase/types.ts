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
      carrier_statuses: {
        Row: {
          application_id: string | null
          carrier_name: string
          created_at: string | null
          id: string
          is_test: boolean | null
          is_transfer: boolean | null
          notes: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          application_id?: string | null
          carrier_name: string
          created_at?: string | null
          id?: string
          is_test?: boolean | null
          is_transfer?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          application_id?: string | null
          carrier_name?: string
          created_at?: string | null
          id?: string
          is_test?: boolean | null
          is_transfer?: boolean | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_statuses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contracting_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          code: string
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          product_tags: string[] | null
          requires_corporate_resolution: boolean
          requires_non_resident_states: boolean
          state_availability: string[] | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          product_tags?: string[] | null
          requires_corporate_resolution?: boolean
          requires_non_resident_states?: boolean
          state_availability?: string[] | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          product_tags?: string[] | null
          requires_corporate_resolution?: boolean
          requires_non_resident_states?: boolean
          state_availability?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      contracting_applications: {
        Row: {
          agency_name: string | null
          agency_tax_id: string | null
          agreements: Json | null
          aml_completion_date: string | null
          aml_course_date: string | null
          aml_course_name: string | null
          aml_training_provider: string | null
          bank_account_number: string | null
          bank_branch_name: string | null
          bank_routing_number: string | null
          beneficiary_birth_date: string | null
          beneficiary_drivers_license_number: string | null
          beneficiary_drivers_license_state: string | null
          beneficiary_name: string | null
          beneficiary_relationship: string | null
          birth_city: string | null
          birth_date: string | null
          birth_state: string | null
          completed_steps: number[]
          contract_level: string | null
          created_at: string
          current_step: number
          disciplinary_entries: Json
          drivers_license_number: string | null
          drivers_license_state: string | null
          email_address: string | null
          eo_expiration_date: string | null
          eo_not_yet_covered: boolean | null
          eo_policy_number: string | null
          eo_provider: string | null
          fax: string | null
          finra_broker_dealer_name: string | null
          finra_crd_number: string | null
          full_legal_name: string | null
          gender: string | null
          has_aml_course: boolean | null
          has_ltc_certification: boolean | null
          home_address: Json | null
          id: string
          insurance_license_number: string | null
          is_corporation: boolean | null
          is_finra_registered: boolean | null
          is_test: boolean | null
          legal_questions: Json | null
          license_expiration_date: string | null
          mailing_address: Json | null
          mailing_address_same_as_home: boolean | null
          non_resident_states: string[] | null
          npn_number: string | null
          phone_business: string | null
          phone_home: string | null
          phone_mobile: string | null
          preferred_contact_methods: string[] | null
          previous_addresses: Json | null
          requesting_commission_advancing: boolean | null
          resident_license_number: string | null
          resident_state: string | null
          section_acknowledgments: Json | null
          selected_carriers: Json | null
          sent_to_upline_at: string | null
          sent_to_upline_by: string | null
          signature_date: string | null
          signature_initials: string | null
          signature_name: string | null
          state_requires_ce: boolean | null
          status: string
          submitted_at: string | null
          tax_id: string | null
          updated_at: string
          upline_id: string | null
          uploaded_documents: Json | null
          ups_address: Json | null
          ups_address_same_as_home: boolean | null
          user_id: string
        }
        Insert: {
          agency_name?: string | null
          agency_tax_id?: string | null
          agreements?: Json | null
          aml_completion_date?: string | null
          aml_course_date?: string | null
          aml_course_name?: string | null
          aml_training_provider?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_routing_number?: string | null
          beneficiary_birth_date?: string | null
          beneficiary_drivers_license_number?: string | null
          beneficiary_drivers_license_state?: string | null
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          birth_city?: string | null
          birth_date?: string | null
          birth_state?: string | null
          completed_steps?: number[]
          contract_level?: string | null
          created_at?: string
          current_step?: number
          disciplinary_entries?: Json
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email_address?: string | null
          eo_expiration_date?: string | null
          eo_not_yet_covered?: boolean | null
          eo_policy_number?: string | null
          eo_provider?: string | null
          fax?: string | null
          finra_broker_dealer_name?: string | null
          finra_crd_number?: string | null
          full_legal_name?: string | null
          gender?: string | null
          has_aml_course?: boolean | null
          has_ltc_certification?: boolean | null
          home_address?: Json | null
          id?: string
          insurance_license_number?: string | null
          is_corporation?: boolean | null
          is_finra_registered?: boolean | null
          is_test?: boolean | null
          legal_questions?: Json | null
          license_expiration_date?: string | null
          mailing_address?: Json | null
          mailing_address_same_as_home?: boolean | null
          non_resident_states?: string[] | null
          npn_number?: string | null
          phone_business?: string | null
          phone_home?: string | null
          phone_mobile?: string | null
          preferred_contact_methods?: string[] | null
          previous_addresses?: Json | null
          requesting_commission_advancing?: boolean | null
          resident_license_number?: string | null
          resident_state?: string | null
          section_acknowledgments?: Json | null
          selected_carriers?: Json | null
          sent_to_upline_at?: string | null
          sent_to_upline_by?: string | null
          signature_date?: string | null
          signature_initials?: string | null
          signature_name?: string | null
          state_requires_ce?: boolean | null
          status?: string
          submitted_at?: string | null
          tax_id?: string | null
          updated_at?: string
          upline_id?: string | null
          uploaded_documents?: Json | null
          ups_address?: Json | null
          ups_address_same_as_home?: boolean | null
          user_id: string
        }
        Update: {
          agency_name?: string | null
          agency_tax_id?: string | null
          agreements?: Json | null
          aml_completion_date?: string | null
          aml_course_date?: string | null
          aml_course_name?: string | null
          aml_training_provider?: string | null
          bank_account_number?: string | null
          bank_branch_name?: string | null
          bank_routing_number?: string | null
          beneficiary_birth_date?: string | null
          beneficiary_drivers_license_number?: string | null
          beneficiary_drivers_license_state?: string | null
          beneficiary_name?: string | null
          beneficiary_relationship?: string | null
          birth_city?: string | null
          birth_date?: string | null
          birth_state?: string | null
          completed_steps?: number[]
          contract_level?: string | null
          created_at?: string
          current_step?: number
          disciplinary_entries?: Json
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          email_address?: string | null
          eo_expiration_date?: string | null
          eo_not_yet_covered?: boolean | null
          eo_policy_number?: string | null
          eo_provider?: string | null
          fax?: string | null
          finra_broker_dealer_name?: string | null
          finra_crd_number?: string | null
          full_legal_name?: string | null
          gender?: string | null
          has_aml_course?: boolean | null
          has_ltc_certification?: boolean | null
          home_address?: Json | null
          id?: string
          insurance_license_number?: string | null
          is_corporation?: boolean | null
          is_finra_registered?: boolean | null
          is_test?: boolean | null
          legal_questions?: Json | null
          license_expiration_date?: string | null
          mailing_address?: Json | null
          mailing_address_same_as_home?: boolean | null
          non_resident_states?: string[] | null
          npn_number?: string | null
          phone_business?: string | null
          phone_home?: string | null
          phone_mobile?: string | null
          preferred_contact_methods?: string[] | null
          previous_addresses?: Json | null
          requesting_commission_advancing?: boolean | null
          resident_license_number?: string | null
          resident_state?: string | null
          section_acknowledgments?: Json | null
          selected_carriers?: Json | null
          sent_to_upline_at?: string | null
          sent_to_upline_by?: string | null
          signature_date?: string | null
          signature_initials?: string | null
          signature_name?: string | null
          state_requires_ce?: boolean | null
          status?: string
          submitted_at?: string | null
          tax_id?: string | null
          updated_at?: string
          upline_id?: string | null
          uploaded_documents?: Json | null
          ups_address?: Json | null
          ups_address_same_as_home?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          carrier: string | null
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_name: string
          document_type: string
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
          plan_name: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_name: string
          document_type: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          plan_name?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_name?: string
          document_type?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          plan_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      entity_owners: {
        Row: {
          created_at: string | null
          entity_id: string
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_owners_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          flag_key: string
          flag_value: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          flag_key: string
          flag_value?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          flag_key?: string
          flag_value?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      hierarchy_entities: {
        Row: {
          created_at: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          parent_entity_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          parent_entity_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parent_entity_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hierarchy_entities_parent_entity_id_fkey"
            columns: ["parent_entity_id"]
            isOneToOne: false
            referencedRelation: "hierarchy_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_document: string | null
          error_message: string | null
          failed_documents: number
          id: string
          processed_documents: number
          started_at: string | null
          status: string
          total_documents: number
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_document?: string | null
          error_message?: string | null
          failed_documents?: number
          id?: string
          processed_documents?: number
          started_at?: string | null
          status?: string
          total_documents?: number
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_document?: string | null
          error_message?: string | null
          failed_documents?: number
          id?: string
          processed_documents?: number
          started_at?: string | null
          status?: string
          total_documents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          appointed_at: string | null
          created_at: string
          developer_access: boolean | null
          email: string | null
          first_login_at: string | null
          full_name: string | null
          id: string
          is_active: boolean
          is_test: boolean | null
          manager_id: string | null
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          password_created_at: string | null
          setup_link_sent_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointed_at?: string | null
          created_at?: string
          developer_access?: boolean | null
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_test?: boolean | null
          manager_id?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          password_created_at?: string | null
          setup_link_sent_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointed_at?: string | null
          created_at?: string
          developer_access?: boolean | null
          email?: string | null
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          is_test?: boolean | null
          manager_id?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          password_created_at?: string | null
          setup_link_sent_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      state_carriers: {
        Row: {
          carrier_id: string | null
          created_at: string | null
          id: string
          is_available: boolean | null
          is_default: boolean | null
          state_code: string
          updated_at: string | null
        }
        Insert: {
          carrier_id?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          state_code: string
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          is_default?: boolean | null
          state_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "state_carriers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_my_profile_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_documents: {
        Args: {
          filter_carrier?: string
          filter_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          carrier: string
          chunk_text: string
          document_name: string
          document_type: string
          id: string
          page_number: number
          plan_name: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "independent_agent"
        | "internal_tig_agent"
      onboarding_status:
        | "CONTRACTING_REQUIRED"
        | "CONTRACT_SUBMITTED"
        | "APPOINTED"
        | "SUSPENDED"
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
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "independent_agent",
        "internal_tig_agent",
      ],
      onboarding_status: [
        "CONTRACTING_REQUIRED",
        "CONTRACT_SUBMITTED",
        "APPOINTED",
        "SUSPENDED",
      ],
    },
  },
} as const
