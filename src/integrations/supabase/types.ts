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
      admin_data_access_logs: {
        Row: {
          accessed_at: string
          action_type: string
          admin_id: string
          admin_name: string | null
          admin_role: string | null
          id: string
          ip_address: string | null
          justification: string | null
          resource_id: string
          resource_type: string
        }
        Insert: {
          accessed_at?: string
          action_type: string
          admin_id: string
          admin_name?: string | null
          admin_role?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          resource_id: string
          resource_type: string
        }
        Update: {
          accessed_at?: string
          action_type?: string
          admin_id?: string
          admin_name?: string | null
          admin_role?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      admin_impersonation_logs: {
        Row: {
          action_type: string
          admin_id: string
          admin_name: string | null
          created_at: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean
          target_user_id: string
          target_user_name: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          admin_name?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          target_user_id: string
          target_user_name?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          admin_name?: string | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          target_user_id?: string
          target_user_name?: string | null
        }
        Relationships: []
      }
      barcode_scan_logs: {
        Row: {
          barcode_code: string
          barcode_type: string
          id: string
          order_id: string
          rejection_reason: string | null
          scan_result: string
          scanned_at: string
          scanned_by: string
          scanned_by_role: string
        }
        Insert: {
          barcode_code: string
          barcode_type: string
          id?: string
          order_id: string
          rejection_reason?: string | null
          scan_result: string
          scanned_at?: string
          scanned_by: string
          scanned_by_role: string
        }
        Update: {
          barcode_code?: string
          barcode_type?: string
          id?: string
          order_id?: string
          rejection_reason?: string | null
          scan_result?: string
          scanned_at?: string
          scanned_by?: string
          scanned_by_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "barcode_scan_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_name: string
          email: string | null
          id: string
          internal_notes: string | null
          message: string
          phone: string
          status: string
          submission_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          message: string
          phone: string
          status?: string
          submission_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string
          phone?: string
          status?: string
          submission_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      custom_order_details: {
        Row: {
          chef_feasibility: string | null
          chef_notes: string | null
          chef_preparation_time: string | null
          chef_proposed_price: number | null
          chef_rejection_reason: string | null
          chef_reviewed_at: string | null
          chef_reviewed_by: string | null
          confirmed_by: string | null
          created_at: string
          customer_confirmed_at: string | null
          customer_confirmed_price: boolean | null
          customer_response: string | null
          customer_response_at: string | null
          customer_visible_notes: string | null
          design_description: string | null
          filling: string | null
          flavor: string | null
          id: string
          number_of_people: number | null
          occasion: string | null
          order_id: string
          pricing_sent_at: string | null
          pricing_sent_by: string | null
          product_type: string
          reference_image_url: string | null
          reference_order_id: string | null
          sugar_level: string | null
          updated_at: string
          writing_text: string | null
        }
        Insert: {
          chef_feasibility?: string | null
          chef_notes?: string | null
          chef_preparation_time?: string | null
          chef_proposed_price?: number | null
          chef_rejection_reason?: string | null
          chef_reviewed_at?: string | null
          chef_reviewed_by?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          customer_confirmed_price?: boolean | null
          customer_response?: string | null
          customer_response_at?: string | null
          customer_visible_notes?: string | null
          design_description?: string | null
          filling?: string | null
          flavor?: string | null
          id?: string
          number_of_people?: number | null
          occasion?: string | null
          order_id: string
          pricing_sent_at?: string | null
          pricing_sent_by?: string | null
          product_type: string
          reference_image_url?: string | null
          reference_order_id?: string | null
          sugar_level?: string | null
          updated_at?: string
          writing_text?: string | null
        }
        Update: {
          chef_feasibility?: string | null
          chef_notes?: string | null
          chef_preparation_time?: string | null
          chef_proposed_price?: number | null
          chef_rejection_reason?: string | null
          chef_reviewed_at?: string | null
          chef_reviewed_by?: string | null
          confirmed_by?: string | null
          created_at?: string
          customer_confirmed_at?: string | null
          customer_confirmed_price?: boolean | null
          customer_response?: string | null
          customer_response_at?: string | null
          customer_visible_notes?: string | null
          design_description?: string | null
          filling?: string | null
          flavor?: string | null
          id?: string
          number_of_people?: number | null
          occasion?: string | null
          order_id?: string
          pricing_sent_at?: string | null
          pricing_sent_by?: string | null
          product_type?: string
          reference_image_url?: string | null
          reference_order_id?: string | null
          sugar_level?: string | null
          updated_at?: string
          writing_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_order_details_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_order_details_reference_order_id_fkey"
            columns: ["reference_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      handover_barcodes: {
        Row: {
          barcode_code: string
          barcode_type: string
          expires_at: string | null
          generated_at: string
          id: string
          is_valid: boolean | null
          order_id: string
          scanned: boolean | null
          scanned_at: string | null
          scanned_by: string | null
          scanned_by_role: string | null
        }
        Insert: {
          barcode_code: string
          barcode_type: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_valid?: boolean | null
          order_id: string
          scanned?: boolean | null
          scanned_at?: string | null
          scanned_by?: string | null
          scanned_by_role?: string | null
        }
        Update: {
          barcode_code?: string
          barcode_type?: string
          expires_at?: string | null
          generated_at?: string
          id?: string
          is_valid?: boolean | null
          order_id?: string
          scanned?: boolean | null
          scanned_at?: string | null
          scanned_by?: string | null
          scanned_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_barcodes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_logs: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          order_id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note_content: string
          order_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note_content: string
          order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note_content?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_override: boolean | null
          admin_override_reason: string | null
          assigned_driver_id: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivered: boolean | null
          delivered_by_driver: string | null
          delivered_time: string | null
          delivery_date: string | null
          delivery_time: string | null
          handover_branch_by: string | null
          handover_branch_time: string | null
          handover_from_kitchen: boolean | null
          handover_kitchen_by_driver: string | null
          handover_kitchen_time: string | null
          handover_to_branch: boolean | null
          id: string
          notes: string | null
          order_number: string
          order_type: string | null
          payment_link: string | null
          payment_status: string | null
          picked_up_by: string | null
          pickup_at: string | null
          pickup_code: string | null
          status: Database["public"]["Enums"]["order_status"]
          status_changed_at: string | null
          status_changed_by: string | null
          status_changed_role: string | null
          total_amount: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          admin_override?: boolean | null
          admin_override_reason?: string | null
          assigned_driver_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered?: boolean | null
          delivered_by_driver?: string | null
          delivered_time?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          handover_branch_by?: string | null
          handover_branch_time?: string | null
          handover_from_kitchen?: boolean | null
          handover_kitchen_by_driver?: string | null
          handover_kitchen_time?: string | null
          handover_to_branch?: boolean | null
          id?: string
          notes?: string | null
          order_number: string
          order_type?: string | null
          payment_link?: string | null
          payment_status?: string | null
          picked_up_by?: string | null
          pickup_at?: string | null
          pickup_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_changed_role?: string | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          admin_override?: boolean | null
          admin_override_reason?: string | null
          assigned_driver_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered?: boolean | null
          delivered_by_driver?: string | null
          delivered_time?: string | null
          delivery_date?: string | null
          delivery_time?: string | null
          handover_branch_by?: string | null
          handover_branch_time?: string | null
          handover_from_kitchen?: boolean | null
          handover_kitchen_by_driver?: string | null
          handover_kitchen_time?: string | null
          handover_to_branch?: boolean | null
          id?: string
          notes?: string | null
          order_number?: string
          order_type?: string | null
          payment_link?: string | null
          payment_status?: string | null
          picked_up_by?: string | null
          pickup_at?: string | null
          pickup_code?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_changed_role?: string | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_available: boolean
          option_id: string
          price_adjustment: number
          value_name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean
          option_id: string
          price_adjustment?: number
          value_name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_available?: boolean
          option_id?: string
          price_adjustment?: number
          value_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_required: boolean
          option_name: string
          option_type: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_required?: boolean
          option_name: string
          option_type?: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_required?: boolean
          option_name?: string
          option_type?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          rich_description: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price?: number
          rich_description?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          rich_description?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_branch_assignments: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_branch_assignments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
      add_order_note: {
        Args: { _note_content: string; _order_id: string }
        Returns: string
      }
      admin_change_order_status: {
        Args: {
          _new_status: Database["public"]["Enums"]["order_status"]
          _order_id: string
          _reason: string
        }
        Returns: boolean
      }
      advance_order_workflow: { Args: { _order_id: string }; Returns: Json }
      can_access_order_customer: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      chef_review_custom_order:
        | {
            Args: {
              _feasibility: string
              _notes?: string
              _order_id: string
              _preparation_time: string
              _proposed_price: number
              _rejection_reason?: string
            }
            Returns: Json
          }
        | {
            Args: {
              _customer_notes?: string
              _feasibility: string
              _notes?: string
              _order_id: string
              _preparation_time: string
              _proposed_price: number
              _rejection_reason?: string
            }
            Returns: Json
          }
      confirm_custom_order_price: { Args: { _order_id: string }; Returns: Json }
      create_custom_order: {
        Args: {
          _branch_id: string
          _customer_address: string
          _customer_name: string
          _customer_phone: string
          _design_description?: string
          _filling?: string
          _flavor?: string
          _notes?: string
          _number_of_people?: number
          _occasion?: string
          _pickup_date: string
          _pickup_time: string
          _product_type: string
          _reference_image_url?: string
          _reference_order_id?: string
          _sugar_level?: string
          _writing_text?: string
        }
        Returns: string
      }
      create_customer_order: {
        Args: {
          _branch_id: string
          _delivery_date: string
          _delivery_time: string
          _items: Json
        }
        Returns: string
      }
      create_product_review: {
        Args: { _product_id: string; _rating: number; _review_text?: string }
        Returns: string
      }
      customer_respond_to_pricing: {
        Args: {
          _accepted: boolean
          _order_id: string
          _rejection_reason?: string
        }
        Returns: Json
      }
      generate_handover_barcode: {
        Args: { _barcode_type: string; _order_id: string }
        Returns: string
      }
      get_admin_access_logs: {
        Args: { _days?: number }
        Returns: {
          accessed_at: string
          action_type: string
          admin_id: string
          admin_name: string
          admin_role: string
          id: string
          justification: string
          resource_id: string
          resource_type: string
        }[]
      }
      get_all_profiles_for_admin: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }[]
      }
      get_branch_for_store: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      get_branch_orders_secure: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          tracking_code: string
        }[]
      }
      get_branches_for_authenticated_store: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
        }[]
      }
      get_branches_for_display: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_branches_for_public_store: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
        }[]
      }
      get_branches_full: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_branches_public: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
        }[]
      }
      get_contact_submission_details: {
        Args: { _submission_id: string }
        Returns: {
          created_at: string
          customer_name: string
          email: string
          id: string
          internal_notes: string
          message: string
          phone: string
          status: string
          submission_type: string
          updated_at: string
        }[]
      }
      get_contact_submissions_secure: {
        Args: never
        Returns: {
          assigned_to: string
          created_at: string
          customer_name: string
          email: string
          id: string
          internal_notes: string
          message: string
          phone: string
          status: string
          submission_type: string
          updated_at: string
        }[]
      }
      get_custom_orders_for_review: {
        Args: never
        Returns: {
          branch_name: string
          created_at: string
          customer_name: string
          design_description: string
          filling: string
          flavor: string
          id: string
          notes: string
          number_of_people: number
          occasion: string
          order_number: string
          pickup_date: string
          pickup_time: string
          product_type: string
          reference_image_url: string
          status: Database["public"]["Enums"]["order_status"]
          sugar_level: string
          writing_text: string
        }[]
      }
      get_customer_display_info: {
        Args: { _customer_id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_customer_name_for_order: {
        Args: { _order_id: string }
        Returns: string
      }
      get_customer_name_only: {
        Args: { _customer_id: string }
        Returns: string
      }
      get_customer_phone_audited: {
        Args: {
          _customer_id: string
          _justification?: string
          _order_id?: string
        }
        Returns: string
      }
      get_customer_safe_view: {
        Args: { _customer_id: string }
        Returns: {
          address: string
          created_at: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_driver_orders: {
        Args: never
        Returns: {
          branch_address: string
          branch_name: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          handover_from_kitchen: boolean
          handover_to_branch: boolean
          id: string
          items: Json
          order_number: string
          order_type: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_employees_for_admin: {
        Args: never
        Returns: {
          created_at: string
          full_name: string
          id: string
          roles: string[]
        }[]
      }
      get_employees_secure: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          phone: string
          roles: string[]
        }[]
      }
      get_handover_barcode: {
        Args: { _barcode_type: string; _order_id: string }
        Returns: string
      }
      get_kitchen_orders_secure: {
        Args: never
        Returns: {
          branch_id: string
          branch_name: string
          created_at: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      get_masked_customer_phone: {
        Args: { _customer_id: string }
        Returns: string
      }
      get_my_branch: {
        Args: never
        Returns: {
          id: string
          name: string
        }[]
      }
      get_my_customer_id: { Args: never; Returns: string }
      get_my_customer_profile: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
          phone: string
        }[]
      }
      get_my_order_details: {
        Args: { _order_id: string }
        Returns: {
          branch_address: string
          branch_name: string
          created_at: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          order_number: string
          payment_status: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }[]
      }
      get_my_orders: {
        Args: never
        Returns: {
          branch_name: string
          created_at: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_my_pickup_code: { Args: { _order_id: string }; Returns: string }
      get_my_pricing_requests: {
        Args: never
        Returns: {
          branch_name: string
          chef_notes: string
          id: string
          occasion: string
          order_number: string
          pickup_date: string
          pickup_time: string
          preparation_time: string
          pricing_sent_at: string
          product_type: string
          proposed_price: number
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      get_my_product_review: {
        Args: { _product_id: string }
        Returns: {
          id: string
          rating: number
          review_text: string
        }[]
      }
      get_my_roles: { Args: never; Returns: string[] }
      get_order_by_pickup_code: {
        Args: { _pickup_code: string }
        Returns: {
          branch_id: string
          branch_name: string
          can_process: boolean
          customer_name: string
          error_message: string
          id: string
          items: Json
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_order_by_tracking_code: {
        Args: { _tracking_code: string }
        Returns: {
          branch_name: string
          delivery_date: string
          delivery_time: string
          items: Json
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_order_customer_info: {
        Args: { _order_id: string }
        Returns: {
          customer_address: string
          customer_id: string
          customer_name: string
          customer_phone: string
        }[]
      }
      get_order_details_secure: {
        Args: { _order_id: string }
        Returns: {
          branch_address: string
          branch_id: string
          branch_name: string
          created_at: string
          customer_address: string
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          payment_link: string
          payment_status: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_code: string
          updated_at: string
        }[]
      }
      get_order_for_kitchen: {
        Args: { _order_id: string }
        Returns: {
          branch_name: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_order_logs_with_user: {
        Args: { _order_id: string }
        Returns: {
          action: string
          created_at: string
          description: string
          id: string
          user_name: string
          user_role: string
        }[]
      }
      get_order_notes: {
        Args: { _order_id: string }
        Returns: {
          created_at: string
          id: string
          note_content: string
          user_name: string
          user_role: string
        }[]
      }
      get_orders_for_admin: {
        Args: never
        Returns: {
          branch_address: string
          branch_id: string
          branch_name: string
          created_at: string
          customer_id: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          id: string
          notes: string
          order_number: string
          payment_link: string
          payment_status: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_code: string
          updated_at: string
        }[]
      }
      get_orders_for_branch: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          tracking_code: string
        }[]
      }
      get_orders_for_kitchen: {
        Args: never
        Returns: {
          branch_id: string
          branch_name: string
          created_at: string
          delivery_date: string
          delivery_time: string
          id: string
          items: Json
          notes: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_orders_for_realtime: {
        Args: never
        Returns: {
          branch_id: string
          branch_name: string
          created_at: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          id: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_orders_for_support: {
        Args: never
        Returns: {
          branch_name: string
          created_at: string
          customer_name: string
          delivery_date: string
          delivery_time: string
          id: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
        }[]
      }
      get_priced_orders_for_support: {
        Args: never
        Returns: {
          branch_name: string
          chef_preparation_time: string
          chef_proposed_price: number
          chef_reviewed_at: string
          created_at: string
          customer_name: string
          customer_visible_notes: string
          id: string
          order_number: string
          pickup_date: string
          pickup_time: string
          product_type: string
          status: Database["public"]["Enums"]["order_status"]
        }[]
      }
      get_product_rating: {
        Args: { _product_id: string }
        Returns: {
          average_rating: number
          review_count: number
        }[]
      }
      get_product_reviews: {
        Args: { _product_id: string }
        Returns: {
          created_at: string
          customer_name: string
          id: string
          rating: number
          review_text: string
        }[]
      }
      get_product_with_options: {
        Args: { _product_id: string }
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          images: Json
          name: string
          options: Json
          price: number
          rich_description: string
        }[]
      }
      get_products_for_authenticated_store: {
        Args: never
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      get_products_for_public_store: {
        Args: never
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      get_products_for_store: {
        Args: never
        Returns: {
          category: string
          description: string
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      get_profile_phone_audited: {
        Args: { _justification?: string; _profile_id: string }
        Returns: string
      }
      get_profiles_for_admin: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }[]
      }
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      get_user_for_impersonation: {
        Args: { _user_id: string }
        Returns: {
          full_name: string
          id: string
          roles: string[]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_support_access: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_customer: { Args: { _user_id: string }; Returns: boolean }
      kitchen_mark_order_ready: { Args: { _order_id: string }; Returns: Json }
      kitchen_send_to_branch: { Args: { _order_id: string }; Returns: Json }
      log_admin_action_safe: {
        Args: {
          _action_type: string
          _admin_id: string
          _justification?: string
          _resource_id: string
          _resource_type: string
        }
        Returns: undefined
      }
      log_impersonation_attempt: {
        Args: {
          _action_type: string
          _admin_id: string
          _failure_reason?: string
          _success: boolean
          _target_user_id: string
        }
        Returns: string
      }
      log_sensitive_data_access:
        | {
            Args: {
              _action: string
              _resource_id: string
              _resource_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _action: string
              _resource_id: string
              _resource_type: string
            }
            Returns: undefined
          }
      mask_address: { Args: { addr: string }; Returns: string }
      mask_phone: { Args: { phone_number: string }; Returns: string }
      process_pickup_by_code: { Args: { _pickup_code: string }; Returns: Json }
      register_customer_after_signup: {
        Args: { _address?: string; _name: string; _phone: string }
        Returns: string
      }
      scan_handover_barcode: { Args: { _barcode_code: string }; Returns: Json }
      search_customer_by_phone: {
        Args: { _phone: string }
        Returns: {
          address: string
          id: string
          name: string
          phone: string
        }[]
      }
      send_custom_order_to_chef: { Args: { _order_id: string }; Returns: Json }
      send_pricing_to_customer: { Args: { _order_id: string }; Returns: Json }
      sync_missing_profiles: { Args: never; Returns: number }
      transfer_order: {
        Args: {
          _order_id: string
          _to_branch_id: string
          _transfer_type?: string
        }
        Returns: boolean
      }
      update_contact_submission_secure: {
        Args: {
          _internal_notes?: string
          _status?: string
          _submission_id: string
        }
        Returns: boolean
      }
      update_my_customer_profile: {
        Args: { _address?: string; _name: string; _phone: string }
        Returns: boolean
      }
      upsert_customer_by_phone: {
        Args: { _address?: string; _name: string; _phone: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "call_center"
        | "kitchen"
        | "branch"
        | "customer"
        | "customer_support"
        | "driver"
      order_status:
        | "pending_approval"
        | "awaiting_payment"
        | "paid"
        | "preparing"
        | "ready_to_ship"
        | "in_transit"
        | "ready_for_pickup"
        | "completed"
        | "custom_pending_review"
        | "custom_chef_approved"
        | "custom_rejected"
        | "sent_to_chef"
        | "chef_priced"
        | "pricing_sent_to_customer"
        | "customer_accepted"
        | "customer_rejected"
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
        "admin",
        "call_center",
        "kitchen",
        "branch",
        "customer",
        "customer_support",
        "driver",
      ],
      order_status: [
        "pending_approval",
        "awaiting_payment",
        "paid",
        "preparing",
        "ready_to_ship",
        "in_transit",
        "ready_for_pickup",
        "completed",
        "custom_pending_review",
        "custom_chef_approved",
        "custom_rejected",
        "sent_to_chef",
        "chef_priced",
        "pricing_sent_to_customer",
        "customer_accepted",
        "customer_rejected",
      ],
    },
  },
} as const
