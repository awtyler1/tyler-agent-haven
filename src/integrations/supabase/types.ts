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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_certifications: {
        Row: {
          carrier_name: string
          certification_year: number
          created_at: string | null
          id: string
          product_type: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          carrier_name: string
          certification_year?: number
          created_at?: string | null
          id?: string
          product_type: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          carrier_name?: string
          certification_year?: number
          created_at?: string | null
          id?: string
          product_type?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_documents: {
        Row: {
          category: string
          created_at: string | null
          document_type: string
          expires_at: string | null
          file_name: string
          file_path: string
          id: string
          label: string | null
          notes: string | null
          profile_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          document_type: string
          expires_at?: string | null
          file_name: string
          file_path: string
          id?: string
          label?: string | null
          notes?: string | null
          profile_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          document_type?: string
          expires_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          label?: string | null
          notes?: string | null
          profile_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ahip_certifications: {
        Row: {
          certificate_url: string | null
          certification_year: number
          completed_at: string | null
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_year: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_year?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      broker_roadmaps: {
        Row: {
          activity_targets: Json | null
          assigned_channels: Json | null
          book_size: number
          broker_name: string
          created_at: string | null
          created_by: string | null
          economics: Json | null
          id: string
          last_generated_at: string | null
          lead_star_leads: number | null
          manager_id: string | null
          manager_name: string
          mira_access: boolean | null
          monthly_goal: number
          pdf_storage_path: string | null
          profile_id: string | null
          review_date: string | null
          seminar_dates: string[] | null
          seminar_eligible: boolean | null
          seminars_planned: number | null
          updated_at: string | null
        }
        Insert: {
          activity_targets?: Json | null
          assigned_channels?: Json | null
          book_size?: number
          broker_name: string
          created_at?: string | null
          created_by?: string | null
          economics?: Json | null
          id?: string
          last_generated_at?: string | null
          lead_star_leads?: number | null
          manager_id?: string | null
          manager_name: string
          mira_access?: boolean | null
          monthly_goal?: number
          pdf_storage_path?: string | null
          profile_id?: string | null
          review_date?: string | null
          seminar_dates?: string[] | null
          seminar_eligible?: boolean | null
          seminars_planned?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_targets?: Json | null
          assigned_channels?: Json | null
          book_size?: number
          broker_name?: string
          created_at?: string | null
          created_by?: string | null
          economics?: Json | null
          id?: string
          last_generated_at?: string | null
          lead_star_leads?: number | null
          manager_id?: string | null
          manager_name?: string
          mira_access?: boolean | null
          monthly_goal?: number
          pdf_storage_path?: string | null
          profile_id?: string | null
          review_date?: string | null
          seminar_dates?: string[] | null
          seminar_eligible?: boolean | null
          seminars_planned?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_roadmaps_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_roadmaps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_certifications: {
        Row: {
          carrier_id: string
          certificate_url: string | null
          certification_year: number
          completed_at: string | null
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          carrier_id: string
          certificate_url?: string | null
          certification_year: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          carrier_id?: string
          certificate_url?: string | null
          certification_year?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      carrier_statuses: {
        Row: {
          carrier_id: string
          contracted_at: string | null
          contracting_link_sent_at: string | null
          contracting_link_url: string | null
          contracting_status: string
          contracting_submitted_at: string | null
          created_at: string | null
          id: string
          issue_description: string | null
          link_resend_requested_at: string | null
          profile_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          carrier_id: string
          contracted_at?: string | null
          contracting_link_sent_at?: string | null
          contracting_link_url?: string | null
          contracting_status?: string
          contracting_submitted_at?: string | null
          created_at?: string | null
          id?: string
          issue_description?: string | null
          link_resend_requested_at?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          carrier_id?: string
          contracted_at?: string | null
          contracting_link_sent_at?: string | null
          contracting_link_url?: string | null
          contracting_status?: string
          contracting_submitted_at?: string | null
          created_at?: string | null
          id?: string
          issue_description?: string | null
          link_resend_requested_at?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_statuses_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_statuses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          rts_aliases: string[] | null
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
          rts_aliases?: string[] | null
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
          rts_aliases?: string[] | null
          state_availability?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      certification_windows: {
        Row: {
          carrier_id: string | null
          certification_year: number
          closes_at: string
          created_at: string | null
          id: string
          notes: string | null
          opens_at: string
          updated_at: string | null
        }
        Insert: {
          carrier_id?: string | null
          certification_year: number
          closes_at: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opens_at: string
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string | null
          certification_year?: number
          closes_at?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opens_at?: string
          updated_at?: string | null
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
          assigned_carriers: string[] | null
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
          queue_status: string | null
          requested_carriers: string[] | null
          requesting_commission_advancing: boolean | null
          resident_license_number: string | null
          resident_state: string | null
          section_acknowledgments: Json | null
          selected_carriers: Json | null
          sent_to_pinnacle_at: string | null
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
          assigned_carriers?: string[] | null
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
          queue_status?: string | null
          requested_carriers?: string[] | null
          requesting_commission_advancing?: boolean | null
          resident_license_number?: string | null
          resident_state?: string | null
          section_acknowledgments?: Json | null
          selected_carriers?: Json | null
          sent_to_pinnacle_at?: string | null
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
          assigned_carriers?: string[] | null
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
          queue_status?: string | null
          requested_carriers?: string[] | null
          requesting_commission_advancing?: boolean | null
          resident_license_number?: string | null
          resident_state?: string | null
          section_acknowledgments?: Json | null
          selected_carriers?: Json | null
          sent_to_pinnacle_at?: string | null
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
      contracting_communications: {
        Row: {
          agent_id: string | null
          attachments: string[] | null
          body_html: string | null
          carriers_included: string[] | null
          communication_type: string
          created_at: string | null
          external_message_id: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          sent_by: string | null
          subject: string
        }
        Insert: {
          agent_id?: string | null
          attachments?: string[] | null
          body_html?: string | null
          carriers_included?: string[] | null
          communication_type: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          sent_by?: string | null
          subject: string
        }
        Update: {
          agent_id?: string | null
          attachments?: string[] | null
          body_html?: string | null
          carriers_included?: string[] | null
          communication_type?: string
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          sent_by?: string | null
          subject?: string
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
        Relationships: []
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
        Relationships: []
      }
      microsoft_oauth_tokens: {
        Row: {
          access_token_encrypted: string
          created_at: string | null
          expires_at: string
          id: string
          microsoft_email: string | null
          refresh_token_encrypted: string
          scope: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token_encrypted: string
          created_at?: string | null
          expires_at: string
          id?: string
          microsoft_email?: string | null
          refresh_token_encrypted: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token_encrypted?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          microsoft_email?: string | null
          refresh_token_encrypted?: string
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          ahip_cert_file_path: string | null
          ahip_cert_uploaded_at: string | null
          ahip_cert_year: number | null
          appointed_at: string | null
          assigned_carriers: string[] | null
          contracting_notes: string | null
          created_at: string
          developer_access: boolean | null
          email: string | null
          excluded_carriers: string[] | null
          first_login_at: string | null
          full_name: string | null
          id: string
          invited_at: string | null
          is_active: boolean
          is_test: boolean | null
          manager_id: string | null
          npn: string | null
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          ownership_group: string | null
          password_created_at: string | null
          phone: string | null
          setup_link_sent_at: string | null
          state: string | null
          team_reference: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ahip_cert_file_path?: string | null
          ahip_cert_uploaded_at?: string | null
          ahip_cert_year?: number | null
          appointed_at?: string | null
          assigned_carriers?: string[] | null
          contracting_notes?: string | null
          created_at?: string
          developer_access?: boolean | null
          email?: string | null
          excluded_carriers?: string[] | null
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          is_test?: boolean | null
          manager_id?: string | null
          npn?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          ownership_group?: string | null
          password_created_at?: string | null
          phone?: string | null
          setup_link_sent_at?: string | null
          state?: string | null
          team_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ahip_cert_file_path?: string | null
          ahip_cert_uploaded_at?: string | null
          ahip_cert_year?: number | null
          appointed_at?: string | null
          assigned_carriers?: string[] | null
          contracting_notes?: string | null
          created_at?: string
          developer_access?: boolean | null
          email?: string | null
          excluded_carriers?: string[] | null
          first_login_at?: string | null
          full_name?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean
          is_test?: boolean | null
          manager_id?: string | null
          npn?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          ownership_group?: string | null
          password_created_at?: string | null
          phone?: string | null
          setup_link_sent_at?: string | null
          state?: string | null
          team_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rts_import_logs: {
        Row: {
          agents_matched: number
          agents_skipped: number
          certifications_imported: number
          created_at: string | null
          file_name: string
          id: string
          profiles_created: number
          uploaded_by: string
        }
        Insert: {
          agents_matched?: number
          agents_skipped?: number
          certifications_imported?: number
          created_at?: string | null
          file_name: string
          id?: string
          profiles_created?: number
          uploaded_by: string
        }
        Update: {
          agents_matched?: number
          agents_skipped?: number
          certifications_imported?: number
          created_at?: string | null
          file_name?: string
          id?: string
          profiles_created?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rts_import_logs_uploaded_by_fkey"
            columns: ["uploaded_by"]
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
        Relationships: []
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
      current_user_has_downline: { Args: never; Returns: boolean }
      get_my_profile_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_downline: { Args: { profile_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "manager"
        | "internal_tig_agent"
        | "independent_agent"
      onboarding_status:
        | "CONTRACTING_REQUIRED"
        | "CONTRACTING_SUBMITTED"
        | "APPOINTED"
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
        "internal_tig_agent",
        "independent_agent",
      ],
      onboarding_status: [
        "CONTRACTING_REQUIRED",
        "CONTRACTING_SUBMITTED",
        "APPOINTED",
      ],
    },
  },
} as const
