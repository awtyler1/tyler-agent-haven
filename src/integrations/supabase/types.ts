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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      admin_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_carriers: {
        Row: {
          added_at: string | null
          carrier_id: string
          id: string
          profile_id: string
        }
        Insert: {
          added_at?: string | null
          carrier_id: string
          id?: string
          profile_id: string
        }
        Update: {
          added_at?: string | null
          carrier_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_carriers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_carriers_profile_id_fkey"
            columns: ["profile_id"]
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
      carrier_contacts: {
        Row: {
          carrier_id: string
          contact_type: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          state_code: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_id: string
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          state_code?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          state_code?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_contacts_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_documents: {
        Row: {
          carrier_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          document_type: string
          file_path: string
          id: string
          name: string
          state_code: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          carrier_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          document_type?: string
          file_path: string
          id?: string
          name: string
          state_code?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          carrier_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          document_type?: string
          file_path?: string
          id?: string
          name?: string
          state_code?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_documents_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_links: {
        Row: {
          carrier_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          link_type: string
          name: string
          state_code: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          carrier_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          link_type?: string
          name: string
          state_code?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          carrier_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          link_type?: string
          name?: string
          state_code?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_links_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
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
          cms_aliases: string[] | null
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
          cms_aliases?: string[] | null
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
          cms_aliases?: string[] | null
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
      clients: {
        Row: {
          address: string | null
          address_city: string | null
          address_line1: string | null
          address_state: string | null
          address_zip: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          dob: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          medicare_number: string | null
          middle_initial: string | null
          phone: string | null
          profile_id: string
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_line1?: string | null
          address_state?: string | null
          address_zip?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dob?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          medicare_number?: string | null
          middle_initial?: string | null
          phone?: string | null
          profile_id: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_line1?: string | null
          address_state?: string | null
          address_zip?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dob?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          medicare_number?: string | null
          middle_initial?: string | null
          phone?: string | null
          profile_id?: string
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_plans: {
        Row: {
          annual_deductible: number | null
          carrier_id: string | null
          cms_data_version: string | null
          commission_notes: string | null
          contract_id: string
          created_at: string | null
          dental_comprehensive: string | null
          dental_max_coverage: number | null
          dental_preventive: string | null
          drug_deductible: number | null
          drug_tier1: string | null
          drug_tier2: string | null
          drug_tier3: string | null
          drug_tier4: string | null
          drug_tier5: string | null
          er_copay: string | null
          fitness_benefit: string | null
          hearing_aid_allowance: string | null
          hearing_exam_copay: string | null
          id: string
          inpatient_copay: string | null
          is_active: boolean | null
          is_commissionable: boolean | null
          marketing_name: string | null
          meal_benefit: string | null
          monthly_premium: number | null
          moop_combined: number | null
          moop_in_network: number | null
          organization_name: string
          otc_allowance: number | null
          otc_frequency: string | null
          outpatient_copay: string | null
          pcp_copay: string | null
          plan_id: string
          plan_type: string
          raw_benefits: Json | null
          segment_id: string | null
          snp_type: string | null
          specialist_copay: string | null
          star_rating: number | null
          telehealth_copay: string | null
          transportation_notes: string | null
          transportation_trips: number | null
          updated_at: string | null
          urgent_care_copay: string | null
          vision_allowance: number | null
          vision_exam_copay: string | null
          year: number
        }
        Insert: {
          annual_deductible?: number | null
          carrier_id?: string | null
          cms_data_version?: string | null
          commission_notes?: string | null
          contract_id: string
          created_at?: string | null
          dental_comprehensive?: string | null
          dental_max_coverage?: number | null
          dental_preventive?: string | null
          drug_deductible?: number | null
          drug_tier1?: string | null
          drug_tier2?: string | null
          drug_tier3?: string | null
          drug_tier4?: string | null
          drug_tier5?: string | null
          er_copay?: string | null
          fitness_benefit?: string | null
          hearing_aid_allowance?: string | null
          hearing_exam_copay?: string | null
          id?: string
          inpatient_copay?: string | null
          is_active?: boolean | null
          is_commissionable?: boolean | null
          marketing_name?: string | null
          meal_benefit?: string | null
          monthly_premium?: number | null
          moop_combined?: number | null
          moop_in_network?: number | null
          organization_name: string
          otc_allowance?: number | null
          otc_frequency?: string | null
          outpatient_copay?: string | null
          pcp_copay?: string | null
          plan_id: string
          plan_type: string
          raw_benefits?: Json | null
          segment_id?: string | null
          snp_type?: string | null
          specialist_copay?: string | null
          star_rating?: number | null
          telehealth_copay?: string | null
          transportation_notes?: string | null
          transportation_trips?: number | null
          updated_at?: string | null
          urgent_care_copay?: string | null
          vision_allowance?: number | null
          vision_exam_copay?: string | null
          year: number
        }
        Update: {
          annual_deductible?: number | null
          carrier_id?: string | null
          cms_data_version?: string | null
          commission_notes?: string | null
          contract_id?: string
          created_at?: string | null
          dental_comprehensive?: string | null
          dental_max_coverage?: number | null
          dental_preventive?: string | null
          drug_deductible?: number | null
          drug_tier1?: string | null
          drug_tier2?: string | null
          drug_tier3?: string | null
          drug_tier4?: string | null
          drug_tier5?: string | null
          er_copay?: string | null
          fitness_benefit?: string | null
          hearing_aid_allowance?: string | null
          hearing_exam_copay?: string | null
          id?: string
          inpatient_copay?: string | null
          is_active?: boolean | null
          is_commissionable?: boolean | null
          marketing_name?: string | null
          meal_benefit?: string | null
          monthly_premium?: number | null
          moop_combined?: number | null
          moop_in_network?: number | null
          organization_name?: string
          otc_allowance?: number | null
          otc_frequency?: string | null
          outpatient_copay?: string | null
          pcp_copay?: string | null
          plan_id?: string
          plan_type?: string
          raw_benefits?: Json | null
          segment_id?: string | null
          snp_type?: string | null
          specialist_copay?: string | null
          star_rating?: number | null
          telehealth_copay?: string | null
          transportation_notes?: string | null
          transportation_trips?: number | null
          updated_at?: string | null
          urgent_care_copay?: string | null
          vision_allowance?: number | null
          vision_exam_copay?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_plans_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_service_areas: {
        Row: {
          cms_plan_id: string
          contract_id: string
          county_fips: string
          county_name: string | null
          created_at: string | null
          id: string
          plan_id: string
          state_code: string
          year: number
        }
        Insert: {
          cms_plan_id: string
          contract_id: string
          county_fips: string
          county_name?: string | null
          created_at?: string | null
          id?: string
          plan_id: string
          state_code: string
          year: number
        }
        Update: {
          cms_plan_id?: string
          contract_id?: string
          county_fips?: string
          county_name?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string
          state_code?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cms_service_areas_cms_plan_id_fkey"
            columns: ["cms_plan_id"]
            isOneToOne: false
            referencedRelation: "cms_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rates: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          plan_type: string
          rate_type: string
          region: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          plan_type: string
          rate_type: string
          region?: string | null
          year: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          plan_type?: string
          rate_type?: string
          region?: string | null
          year?: number
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
      forms: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          file_path: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_path: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          year?: number | null
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
      milestones: {
        Row: {
          achieved_at: string | null
          id: string
          milestone_type: string
          milestone_value: number
          profile_id: string
          sync_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          id?: string
          milestone_type: string
          milestone_value: number
          profile_id: string
          sync_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          id?: string
          milestone_type?: string
          milestone_value?: number
          profile_id?: string
          sync_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_sync_id_fkey"
            columns: ["sync_id"]
            isOneToOne: false
            referencedRelation: "monthly_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_syncs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          month: string
          new_clients: number | null
          previous_month_clients: number | null
          profile_id: string
          started_at: string | null
          status: string
          total_clients: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          month: string
          new_clients?: number | null
          previous_month_clients?: number | null
          profile_id: string
          started_at?: string | null
          status?: string
          total_clients?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          month?: string
          new_clients?: number | null
          previous_month_clients?: number | null
          profile_id?: string
          started_at?: string | null
          status?: string
          total_clients?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_syncs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_documents: {
        Row: {
          cms_plan_id: string
          created_at: string | null
          display_name: string | null
          document_type: string
          external_url: string | null
          file_path: string | null
          file_size_bytes: number | null
          id: string
          is_verified: boolean | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          year: number
        }
        Insert: {
          cms_plan_id: string
          created_at?: string | null
          display_name?: string | null
          document_type: string
          external_url?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          year: number
        }
        Update: {
          cms_plan_id?: string
          created_at?: string | null
          display_name?: string | null
          document_type?: string
          external_url?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          is_verified?: boolean | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_documents_cms_plan_id_fkey"
            columns: ["cms_plan_id"]
            isOneToOne: false
            referencedRelation: "cms_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          carrier_id: string
          carrier_member_id: string | null
          client_id: string
          created_at: string | null
          effective_date: string
          id: string
          is_t65: boolean | null
          last_seen_at: string | null
          last_seen_upload_id: string | null
          plan_name: string
          plan_type: string | null
          profile_id: string | null
          source_upload_id: string | null
          status: string
          term_date: string | null
          updated_at: string | null
        }
        Insert: {
          carrier_id: string
          carrier_member_id?: string | null
          client_id: string
          created_at?: string | null
          effective_date: string
          id?: string
          is_t65?: boolean | null
          last_seen_at?: string | null
          last_seen_upload_id?: string | null
          plan_name: string
          plan_type?: string | null
          profile_id?: string | null
          source_upload_id?: string | null
          status?: string
          term_date?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier_id?: string
          carrier_member_id?: string | null
          client_id?: string
          created_at?: string | null
          effective_date?: string
          id?: string
          is_t65?: boolean | null
          last_seen_at?: string | null
          last_seen_upload_id?: string | null
          plan_name?: string
          plan_type?: string | null
          profile_id?: string | null
          source_upload_id?: string | null
          status?: string
          term_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_last_seen_upload_id_fkey"
            columns: ["last_seen_upload_id"]
            isOneToOne: false
            referencedRelation: "production_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_source_upload_id_fkey"
            columns: ["source_upload_id"]
            isOneToOne: false
            referencedRelation: "production_uploads"
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
      production_uploads: {
        Row: {
          carrier_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          file_hash: string | null
          file_name: string
          id: string
          profile_id: string
          records_imported: number | null
          records_skipped: number | null
          records_total: number | null
          records_updated: number | null
          status: string
        }
        Insert: {
          carrier_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_name: string
          id?: string
          profile_id: string
          records_imported?: number | null
          records_skipped?: number | null
          records_total?: number | null
          records_updated?: number | null
          status?: string
        }
        Update: {
          carrier_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          file_hash?: string | null
          file_name?: string
          id?: string
          profile_id?: string
          records_imported?: number | null
          records_skipped?: number | null
          records_total?: number | null
          records_updated?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_uploads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_uploads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          last_sync_at: string | null
          manager_id: string | null
          npn: string | null
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          ownership_group: string | null
          password_created_at: string | null
          phone: string | null
          setup_link_sent_at: string | null
          state: string | null
          sync_reminder_sent_at: string | null
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
          last_sync_at?: string | null
          manager_id?: string | null
          npn?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          ownership_group?: string | null
          password_created_at?: string | null
          phone?: string | null
          setup_link_sent_at?: string | null
          state?: string | null
          sync_reminder_sent_at?: string | null
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
          last_sync_at?: string | null
          manager_id?: string | null
          npn?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          ownership_group?: string | null
          password_created_at?: string | null
          phone?: string | null
          setup_link_sent_at?: string | null
          state?: string | null
          sync_reminder_sent_at?: string | null
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
      sync_carrier_uploads: {
        Row: {
          carrier_id: string
          client_count: number | null
          id: string
          new_clients: number | null
          previous_count: number | null
          production_upload_id: string | null
          sync_id: string
          uploaded_at: string | null
        }
        Insert: {
          carrier_id: string
          client_count?: number | null
          id?: string
          new_clients?: number | null
          previous_count?: number | null
          production_upload_id?: string | null
          sync_id: string
          uploaded_at?: string | null
        }
        Update: {
          carrier_id?: string
          client_count?: number | null
          id?: string
          new_clients?: number | null
          previous_count?: number | null
          production_upload_id?: string | null
          sync_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_carrier_uploads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_carrier_uploads_production_upload_id_fkey"
            columns: ["production_upload_id"]
            isOneToOne: false
            referencedRelation: "production_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_carrier_uploads_sync_id_fkey"
            columns: ["sync_id"]
            isOneToOne: false
            referencedRelation: "monthly_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_history: {
        Row: {
          agent_id: string
          clients_added: number | null
          created_at: string | null
          files_uploaded: number | null
          id: string
          synced_at: string | null
        }
        Insert: {
          agent_id: string
          clients_added?: number | null
          created_at?: string | null
          files_uploaded?: number | null
          id?: string
          synced_at?: string | null
        }
        Update: {
          agent_id?: string
          clients_added?: number | null
          created_at?: string | null
          files_uploaded?: number | null
          id?: string
          synced_at?: string | null
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
      get_carrier_id_from_cms_org: {
        Args: { org_name: string }
        Returns: string
      }
      get_current_profile_id: { Args: never; Returns: string }
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
      is_admin_user: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
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
