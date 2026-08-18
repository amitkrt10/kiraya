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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  kiraya: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_profile_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          bill_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          metadata: Json
          organization_id: string
          reason: string | null
        }
        Insert: {
          adjustment_type: string
          amount: number
          bill_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          metadata?: Json
          organization_id: string
          reason?: string | null
        }
        Update: {
          adjustment_type?: string
          amount?: number
          bill_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          metadata?: Json
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_adjustments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_adjustments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "bill_adjustments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_adjustments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_items: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          description: string
          discount_amount: number
          id: string
          item_type: string
          metadata: Json
          meter_id: string | null
          organization_id: string
          quantity: number | null
          sort_order: number
          tax_amount: number
          unit_name: string | null
          unit_rate: number | null
          updated_at: string
          utility_id: string | null
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          description: string
          discount_amount?: number
          id?: string
          item_type: string
          metadata?: Json
          meter_id?: string | null
          organization_id: string
          quantity?: number | null
          sort_order?: number
          tax_amount?: number
          unit_name?: string | null
          unit_rate?: number | null
          updated_at?: string
          utility_id?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          description?: string
          discount_amount?: number
          id?: string
          item_type?: string
          metadata?: Json
          meter_id?: string | null
          organization_id?: string
          quantity?: number | null
          sort_order?: number
          tax_amount?: number
          unit_name?: string | null
          unit_rate?: number | null
          updated_at?: string
          utility_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "bill_items_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_runs: {
        Row: {
          bill_date: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          failed_bills: number
          id: string
          initiated_by: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          property_id: string | null
          run_code: string
          started_at: string | null
          status: Database["kiraya"]["Enums"]["billing_run_status"]
          successful_bills: number
          total_bills: number
          updated_at: string
        }
        Insert: {
          bill_date: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          failed_bills?: number
          id?: string
          initiated_by?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          property_id?: string | null
          run_code: string
          started_at?: string | null
          status?: Database["kiraya"]["Enums"]["billing_run_status"]
          successful_bills?: number
          total_bills?: number
          updated_at?: string
        }
        Update: {
          bill_date?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          failed_bills?: number
          id?: string
          initiated_by?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          property_id?: string | null
          run_code?: string
          started_at?: string | null
          status?: Database["kiraya"]["Enums"]["billing_run_status"]
          successful_bills?: number
          total_bills?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_runs_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "billing_runs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
        ]
      }
      bills: {
        Row: {
          adjustment_amount: number
          bill_date: string
          bill_number: string
          billing_run_id: string | null
          created_at: string
          currency_code: string
          discount_amount: number
          due_date: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          previous_balance_amount: number
          status: Database["kiraya"]["Enums"]["bill_status"]
          subtotal: number
          tenant_id: string
          total_amount: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          adjustment_amount?: number
          bill_date: string
          bill_number: string
          billing_run_id?: string | null
          created_at?: string
          currency_code?: string
          discount_amount?: number
          due_date?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          lease_id: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          previous_balance_amount?: number
          status?: Database["kiraya"]["Enums"]["bill_status"]
          subtotal?: number
          tenant_id: string
          total_amount?: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          adjustment_amount?: number
          bill_date?: string
          bill_number?: string
          billing_run_id?: string | null
          created_at?: string
          currency_code?: string
          discount_amount?: number
          due_date?: string | null
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          lease_id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          previous_balance_amount?: number
          status?: Database["kiraya"]["Enums"]["bill_status"]
          subtotal?: number
          tenant_id?: string
          total_amount?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_billing_run_id_fkey"
            columns: ["billing_run_id"]
            isOneToOne: false
            referencedRelation: "billing_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "bills_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      deposit_refunds: {
        Row: {
          amount: number
          created_at: string
          currency_code: string
          exit_settlement_id: string
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          payment_method_id: string | null
          processed_by: string | null
          refund_date: string | null
          refund_reference: string
          security_deposit_id: string
          status: string
          tenant_exit_id: string
          tenant_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency_code?: string
          exit_settlement_id: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          payment_method_id?: string | null
          processed_by?: string | null
          refund_date?: string | null
          refund_reference: string
          security_deposit_id: string
          status?: string
          tenant_exit_id: string
          tenant_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency_code?: string
          exit_settlement_id?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          payment_method_id?: string | null
          processed_by?: string | null
          refund_date?: string | null
          refund_reference?: string
          security_deposit_id?: string
          status?: string
          tenant_exit_id?: string
          tenant_id?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_refunds_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "exit_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "deposit_refunds_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "deposit_refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "v_collection_by_payment_method"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "deposit_refunds_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "v_payment_method_collection"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "deposit_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_security_deposit_id_fkey"
            columns: ["security_deposit_id"]
            isOneToOne: false
            referencedRelation: "security_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_exit_id_fkey"
            columns: ["tenant_exit_id"]
            isOneToOne: false
            referencedRelation: "tenant_exits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "deposit_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      documents: {
        Row: {
          bill_id: string | null
          checksum: string | null
          created_at: string
          description: string | null
          document_type: string
          exit_settlement_id: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          lease_id: string | null
          metadata: Json
          mime_type: string | null
          organization_id: string
          property_id: string | null
          storage_bucket: string
          storage_path: string
          tenant_id: string | null
          unit_id: string | null
          updated_at: string
          uploaded_by: string | null
          visibility: Database["kiraya"]["Enums"]["document_visibility"]
        }
        Insert: {
          bill_id?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          exit_settlement_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          metadata?: Json
          mime_type?: string | null
          organization_id: string
          property_id?: string | null
          storage_bucket: string
          storage_path: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["kiraya"]["Enums"]["document_visibility"]
        }
        Update: {
          bill_id?: string | null
          checksum?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          exit_settlement_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          lease_id?: string | null
          metadata?: Json
          mime_type?: string | null
          organization_id?: string
          property_id?: string | null
          storage_bucket?: string
          storage_path?: string
          tenant_id?: string | null
          unit_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
          visibility?: Database["kiraya"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "documents_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "exit_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "documents_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_settlement_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          exit_settlement_id: string
          id: string
          is_credit: boolean
          item_type: string
          metadata: Json
          organization_id: string
          sort_order: number
          source_bill_id: string | null
          source_ledger_entry_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          exit_settlement_id: string
          id?: string
          is_credit?: boolean
          item_type: string
          metadata?: Json
          organization_id: string
          sort_order?: number
          source_bill_id?: string | null
          source_ledger_entry_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          exit_settlement_id?: string
          id?: string
          is_credit?: boolean
          item_type?: string
          metadata?: Json
          organization_id?: string
          sort_order?: number
          source_bill_id?: string | null
          source_ledger_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_settlement_items_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "exit_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlement_items_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "exit_settlement_items_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "exit_settlement_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlement_items_source_bill_id_fkey"
            columns: ["source_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlement_items_source_bill_id_fkey"
            columns: ["source_bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "exit_settlement_items_source_ledger_entry_id_fkey"
            columns: ["source_ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlement_items_source_ledger_entry_id_fkey"
            columns: ["source_ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ledger"
            referencedColumns: ["ledger_entry_id"]
          },
        ]
      }
      exit_settlements: {
        Row: {
          created_at: string
          currency_code: string
          deposit_deduction: number
          final_amount_due: number
          final_amount_refundable: number
          final_charges: number
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          previous_dues: number
          settlement_date: string
          settlement_reference: string
          status: Database["kiraya"]["Enums"]["settlement_status"]
          tenant_credit: number
          tenant_exit_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          deposit_deduction?: number
          final_amount_due?: number
          final_amount_refundable?: number
          final_charges?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          lease_id: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          previous_dues?: number
          settlement_date: string
          settlement_reference: string
          status?: Database["kiraya"]["Enums"]["settlement_status"]
          tenant_credit?: number
          tenant_exit_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          deposit_deduction?: number
          final_amount_due?: number
          final_amount_refundable?: number
          final_charges?: number
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          lease_id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          previous_dues?: number
          settlement_date?: string
          settlement_reference?: string
          status?: Database["kiraya"]["Enums"]["settlement_status"]
          tenant_credit?: number
          tenant_exit_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_settlements_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_exit_id_fkey"
            columns: ["tenant_exit_id"]
            isOneToOne: false
            referencedRelation: "tenant_exits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      import_errors: {
        Row: {
          created_at: string
          error_code: string
          error_message: string
          field_name: string | null
          id: string
          import_id: string
          raw_value: string | null
          row_data: Json | null
          row_number: number
        }
        Insert: {
          created_at?: string
          error_code: string
          error_message: string
          field_name?: string | null
          id?: string
          import_id: string
          raw_value?: string | null
          row_data?: Json | null
          row_number: number
        }
        Update: {
          created_at?: string
          error_code?: string
          error_message?: string
          field_name?: string | null
          id?: string
          import_id?: string
          raw_value?: string | null
          row_data?: Json | null
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          completed_at: string | null
          created_at: string
          error_summary: string | null
          failed_rows: number
          file_name: string
          id: string
          import_type: string
          imported_rows: number
          invalid_rows: number
          metadata: Json
          organization_id: string | null
          started_at: string | null
          status: Database["kiraya"]["Enums"]["import_status"]
          storage_bucket: string | null
          storage_path: string | null
          total_rows: number
          updated_at: string
          uploaded_by: string
          valid_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          failed_rows?: number
          file_name: string
          id?: string
          import_type: string
          imported_rows?: number
          invalid_rows?: number
          metadata?: Json
          organization_id?: string | null
          started_at?: string | null
          status?: Database["kiraya"]["Enums"]["import_status"]
          storage_bucket?: string | null
          storage_path?: string | null
          total_rows?: number
          updated_at?: string
          uploaded_by: string
          valid_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_summary?: string | null
          failed_rows?: number
          file_name?: string
          id?: string
          import_type?: string
          imported_rows?: number
          invalid_rows?: number
          metadata?: Json
          organization_id?: string | null
          started_at?: string | null
          status?: Database["kiraya"]["Enums"]["import_status"]
          storage_bucket?: string | null
          storage_path?: string | null
          total_rows?: number
          updated_at?: string
          uploaded_by?: string
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "imports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_billing_configs: {
        Row: {
          bill_in_advance: boolean
          billing_anchor_month: number | null
          billing_day: number | null
          billing_frequency: Database["kiraya"]["Enums"]["billing_frequency"]
          created_at: string
          due_days_after_bill: number
          effective_from: string
          effective_to: string | null
          final_bill_prorate: boolean
          first_bill_prorate: boolean
          id: string
          is_active: boolean
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          proration_method: Database["kiraya"]["Enums"]["proration_method"]
          updated_at: string
        }
        Insert: {
          bill_in_advance?: boolean
          billing_anchor_month?: number | null
          billing_day?: number | null
          billing_frequency?: Database["kiraya"]["Enums"]["billing_frequency"]
          created_at?: string
          due_days_after_bill?: number
          effective_from: string
          effective_to?: string | null
          final_bill_prorate?: boolean
          first_bill_prorate?: boolean
          id?: string
          is_active?: boolean
          lease_id: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          proration_method?: Database["kiraya"]["Enums"]["proration_method"]
          updated_at?: string
        }
        Update: {
          bill_in_advance?: boolean
          billing_anchor_month?: number | null
          billing_day?: number | null
          billing_frequency?: Database["kiraya"]["Enums"]["billing_frequency"]
          created_at?: string
          due_days_after_bill?: number
          effective_from?: string
          effective_to?: string | null
          final_bill_prorate?: boolean
          first_bill_prorate?: boolean
          id?: string
          is_active?: boolean
          lease_id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          proration_method?: Database["kiraya"]["Enums"]["proration_method"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_billing_configs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_billing_configs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_billing_configs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_billing_configs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_billing_configs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_billing_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_parties: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          party_role: Database["kiraya"]["Enums"]["lease_party_role"]
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          lease_id: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          party_role: Database["kiraya"]["Enums"]["lease_party_role"]
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          lease_id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          party_role?: Database["kiraya"]["Enums"]["lease_party_role"]
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_parties_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_parties_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_parties_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_parties_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_parties_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_parties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lease_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lease_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "lease_parties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      lease_rent_rules: {
        Row: {
          auto_apply: boolean
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          lease_id: string
          metadata: Json
          monthly_rent: number
          notes: string | null
          organization_id: string
          rule_name: string
          updated_at: string
        }
        Insert: {
          auto_apply?: boolean
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          lease_id: string
          metadata?: Json
          monthly_rent: number
          notes?: string | null
          organization_id: string
          rule_name: string
          updated_at?: string
        }
        Update: {
          auto_apply?: boolean
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          lease_id?: string
          metadata?: Json
          monthly_rent?: number
          notes?: string | null
          organization_id?: string
          rule_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_rent_rules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_rent_rules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_rent_rules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_rent_rules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_rent_rules_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "lease_rent_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          actual_end_date: string | null
          agreement_end_date: string | null
          agreement_start_date: string
          created_at: string
          currency_code: string
          id: string
          lease_code: string
          metadata: Json
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          notice_date: string | null
          occupancy_start_date: string
          organization_id: string
          status: Database["kiraya"]["Enums"]["lease_status"]
          tenant_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          agreement_end_date?: string | null
          agreement_start_date: string
          created_at?: string
          currency_code?: string
          id?: string
          lease_code: string
          metadata?: Json
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          notice_date?: string | null
          occupancy_start_date: string
          organization_id: string
          status?: Database["kiraya"]["Enums"]["lease_status"]
          tenant_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          agreement_end_date?: string | null
          agreement_start_date?: string
          created_at?: string
          currency_code?: string
          id?: string
          lease_code?: string
          metadata?: Json
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          notice_date?: string | null
          occupancy_start_date?: string
          organization_id?: string
          status?: Database["kiraya"]["Enums"]["lease_status"]
          tenant_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          bill_id: string | null
          created_at: string
          created_by: string | null
          credit_amount: number
          currency_code: string
          debit_amount: number
          description: string
          entry_date: string
          entry_type: Database["kiraya"]["Enums"]["ledger_entry_type"]
          exit_settlement_id: string | null
          id: string
          is_reversal: boolean
          lease_id: string | null
          metadata: Json
          organization_id: string
          payment_allocation_id: string | null
          payment_id: string | null
          reference_code: string | null
          reverses_entry_id: string | null
          tenant_id: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_amount?: number
          currency_code?: string
          debit_amount?: number
          description: string
          entry_date: string
          entry_type: Database["kiraya"]["Enums"]["ledger_entry_type"]
          exit_settlement_id?: string | null
          id?: string
          is_reversal?: boolean
          lease_id?: string | null
          metadata?: Json
          organization_id: string
          payment_allocation_id?: string | null
          payment_id?: string | null
          reference_code?: string | null
          reverses_entry_id?: string | null
          tenant_id: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_amount?: number
          currency_code?: string
          debit_amount?: number
          description?: string
          entry_date?: string
          entry_type?: Database["kiraya"]["Enums"]["ledger_entry_type"]
          exit_settlement_id?: string | null
          id?: string
          is_reversal?: boolean
          lease_id?: string | null
          metadata?: Json
          organization_id?: string
          payment_allocation_id?: string | null
          payment_id?: string | null
          reference_code?: string | null
          reverses_entry_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "ledger_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "exit_settlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "ledger_entries_exit_settlement_id_fkey"
            columns: ["exit_settlement_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["exit_settlement_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_allocation_id_fkey"
            columns: ["payment_allocation_id"]
            isOneToOne: false
            referencedRelation: "payment_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ledger"
            referencedColumns: ["ledger_entry_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      meter_reading_batches: {
        Row: {
          batch_code: string
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          property_id: string | null
          reading_date: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          batch_code: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          property_id?: string | null
          reading_date: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          batch_code?: string
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          property_id?: string | null
          reading_date?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_reading_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meter_reading_batches_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_readings: {
        Row: {
          created_at: string
          entered_by: string | null
          id: string
          image_document_id: string | null
          metadata: Json
          meter_id: string
          notes: string | null
          organization_id: string
          reading_batch_id: string | null
          reading_date: string
          reading_event_type: Database["kiraya"]["Enums"]["reading_event_type"]
          reading_source: Database["kiraya"]["Enums"]["reading_source"]
          reading_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          id?: string
          image_document_id?: string | null
          metadata?: Json
          meter_id: string
          notes?: string | null
          organization_id: string
          reading_batch_id?: string | null
          reading_date: string
          reading_event_type?: Database["kiraya"]["Enums"]["reading_event_type"]
          reading_source?: Database["kiraya"]["Enums"]["reading_source"]
          reading_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          id?: string
          image_document_id?: string | null
          metadata?: Json
          meter_id?: string
          notes?: string | null
          organization_id?: string
          reading_batch_id?: string | null
          reading_date?: string
          reading_event_type?: Database["kiraya"]["Enums"]["reading_event_type"]
          reading_source?: Database["kiraya"]["Enums"]["reading_source"]
          reading_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_reading_batch_id_fkey"
            columns: ["reading_batch_id"]
            isOneToOne: false
            referencedRelation: "meter_reading_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          created_at: string
          id: string
          initial_reading: number | null
          installed_on: string | null
          is_active: boolean
          metadata: Json
          meter_code: string
          meter_type: Database["kiraya"]["Enums"]["meter_type"]
          multiplier: number
          notes: string | null
          organization_id: string
          property_id: string | null
          removed_on: string | null
          serial_number: string | null
          unit_id: string | null
          unit_name: string
          updated_at: string
          utility_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_reading?: number | null
          installed_on?: string | null
          is_active?: boolean
          metadata?: Json
          meter_code: string
          meter_type: Database["kiraya"]["Enums"]["meter_type"]
          multiplier?: number
          notes?: string | null
          organization_id: string
          property_id?: string | null
          removed_on?: string | null
          serial_number?: string | null
          unit_id?: string | null
          unit_name?: string
          updated_at?: string
          utility_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_reading?: number | null
          installed_on?: string | null
          is_active?: boolean
          metadata?: Json
          meter_code?: string
          meter_type?: Database["kiraya"]["Enums"]["meter_type"]
          multiplier?: number
          notes?: string | null
          organization_id?: string
          property_id?: string | null
          removed_on?: string | null
          serial_number?: string | null
          unit_id?: string | null
          unit_name?: string
          updated_at?: string
          utility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_member_roles: {
        Row: {
          created_at: string
          organization_member_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          organization_member_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          organization_member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_member_roles_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          joined_at: string | null
          organization_id: string
          profile_id: string
          status: Database["kiraya"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          joined_at?: string | null
          organization_id: string
          profile_id: string
          status?: Database["kiraya"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          joined_at?: string | null
          organization_id?: string
          profile_id?: string
          status?: Database["kiraya"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          currency_code: string
          email: string | null
          id: string
          legal_name: string | null
          locale: string
          name: string
          organization_code: string
          phone: string | null
          postal_code: string | null
          settings: Json
          state: string | null
          status: Database["kiraya"]["Enums"]["organization_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          name: string
          organization_code: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json
          state?: string | null
          status?: Database["kiraya"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          name?: string
          organization_code?: string
          phone?: string | null
          postal_code?: string | null
          settings?: Json
          state?: string | null
          status?: Database["kiraya"]["Enums"]["organization_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          country_code: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          legal_name: string | null
          locality: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          owner_code: string
          owner_type: Database["kiraya"]["Enums"]["owner_type"]
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_identifier: string | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          owner_code: string
          owner_type?: Database["kiraya"]["Enums"]["owner_type"]
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_identifier?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          owner_code?: string
          owner_type?: Database["kiraya"]["Enums"]["owner_type"]
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_identifier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          allocation_date: string
          bill_id: string
          created_at: string
          created_by: string | null
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          allocation_date?: string
          bill_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          allocation_date?: string
          bill_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          metadata: Json
          method_type: Database["kiraya"]["Enums"]["payment_method_type"]
          name: string
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          method_type: Database["kiraya"]["Enums"]["payment_method_type"]
          name: string
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json
          method_type?: Database["kiraya"]["Enums"]["payment_method_type"]
          name?: string
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_name: string | null
          cheque_number: string | null
          created_at: string
          currency_code: string
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method_id: string
          payment_number: string
          received_by: string | null
          reference_number: string | null
          status: Database["kiraya"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          cheque_number?: string | null
          created_at?: string
          currency_code?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          payment_date: string
          payment_method_id: string
          payment_number: string
          received_by?: string | null
          reference_number?: string | null
          status?: Database["kiraya"]["Enums"]["payment_status"]
          tenant_id: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          cheque_number?: string | null
          created_at?: string
          currency_code?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method_id?: string
          payment_number?: string
          received_by?: string | null
          reference_number?: string | null
          status?: Database["kiraya"]["Enums"]["payment_status"]
          tenant_id?: string
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "v_collection_by_payment_method"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "v_payment_method_collection"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          resource: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          resource: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          resource?: string
        }
        Relationships: []
      }
      profile_roles: {
        Row: {
          created_at: string
          profile_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          status: Database["kiraya"]["Enums"]["profile_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          status?: Database["kiraya"]["Enums"]["profile_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          status?: Database["kiraya"]["Enums"]["profile_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          area_unit: string | null
          city: string | null
          country_code: string
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          locality: string | null
          longitude: number | null
          metadata: Json
          name: string
          organization_id: string
          postal_code: string | null
          property_code: string
          property_type_id: string | null
          state: string | null
          status: Database["kiraya"]["Enums"]["property_status"]
          total_area: number | null
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          area_unit?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json
          name: string
          organization_id: string
          postal_code?: string | null
          property_code: string
          property_type_id?: string | null
          state?: string | null
          status?: Database["kiraya"]["Enums"]["property_status"]
          total_area?: number | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          area_unit?: string | null
          city?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          locality?: string | null
          longitude?: number | null
          metadata?: Json
          name?: string
          organization_id?: string
          postal_code?: string | null
          property_code?: string
          property_type_id?: string | null
          state?: string | null
          status?: Database["kiraya"]["Enums"]["property_status"]
          total_area?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_property_type_id_fkey"
            columns: ["property_type_id"]
            isOneToOne: false
            referencedRelation: "property_types"
            referencedColumns: ["id"]
          },
        ]
      }
      property_ownerships: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          organization_id: string
          owner_id: string
          ownership_end_date: string | null
          ownership_percentage: number
          ownership_start_date: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          owner_id: string
          ownership_end_date?: string | null
          ownership_percentage: number
          ownership_start_date?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          owner_id?: string
          ownership_end_date?: string | null
          ownership_percentage?: number
          ownership_start_date?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ownerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_ownerships_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_ownerships_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
        ]
      }
      property_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          organization_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          organization_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          scope: Database["kiraya"]["Enums"]["role_scope"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          scope: Database["kiraya"]["Enums"]["role_scope"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          scope?: Database["kiraya"]["Enums"]["role_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_deposit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency_code: string
          description: string
          exit_settlement_id: string | null
          id: string
          lease_id: string
          metadata: Json
          organization_id: string
          payment_id: string | null
          reference_code: string | null
          security_deposit_id: string
          tenant_id: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description: string
          exit_settlement_id?: string | null
          id?: string
          lease_id: string
          metadata?: Json
          organization_id: string
          payment_id?: string | null
          reference_code?: string | null
          security_deposit_id: string
          tenant_id: string
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency_code?: string
          description?: string
          exit_settlement_id?: string | null
          id?: string
          lease_id?: string
          metadata?: Json
          organization_id?: string
          payment_id?: string | null
          reference_code?: string | null
          security_deposit_id?: string
          tenant_id?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_deposit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_security_deposit_id_fkey"
            columns: ["security_deposit_id"]
            isOneToOne: false
            referencedRelation: "security_deposits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposit_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      security_deposits: {
        Row: {
          created_at: string
          currency_code: string
          deducted_amount: number
          deposit_reference: string
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          outstanding_amount: number
          received_amount: number
          refunded_amount: number
          required_amount: number
          status: Database["kiraya"]["Enums"]["deposit_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code?: string
          deducted_amount?: number
          deposit_reference: string
          id?: string
          lease_id: string
          metadata?: Json
          notes?: string | null
          organization_id: string
          outstanding_amount?: number
          received_amount?: number
          refunded_amount?: number
          required_amount?: number
          status?: Database["kiraya"]["Enums"]["deposit_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          deducted_amount?: number
          deposit_reference?: string
          id?: string
          lease_id?: string
          metadata?: Json
          notes?: string | null
          organization_id?: string
          outstanding_amount?: number
          received_amount?: number
          refunded_amount?: number
          required_amount?: number
          status?: Database["kiraya"]["Enums"]["deposit_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "security_deposits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "security_deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_exits: {
        Row: {
          actual_exit_date: string | null
          created_at: string
          exit_reference: string
          final_meter_reading_date: string | null
          handover_date: string | null
          id: string
          initiated_by: string | null
          lease_id: string
          metadata: Json
          notes: string | null
          notice_date: string | null
          organization_id: string
          planned_exit_date: string | null
          reason: string | null
          status: Database["kiraya"]["Enums"]["exit_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_exit_date?: string | null
          created_at?: string
          exit_reference: string
          final_meter_reading_date?: string | null
          handover_date?: string | null
          id?: string
          initiated_by?: string | null
          lease_id: string
          metadata?: Json
          notes?: string | null
          notice_date?: string | null
          organization_id: string
          planned_exit_date?: string | null
          reason?: string | null
          status?: Database["kiraya"]["Enums"]["exit_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_exit_date?: string | null
          created_at?: string
          exit_reference?: string
          final_meter_reading_date?: string | null
          handover_date?: string | null
          id?: string
          initiated_by?: string | null
          lease_id?: string
          metadata?: Json
          notes?: string | null
          notice_date?: string | null
          organization_id?: string
          planned_exit_date?: string | null
          reason?: string | null
          status?: Database["kiraya"]["Enums"]["exit_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_exits_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_exits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_exits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "tenant_exits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "tenant_exits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "tenant_exits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "tenant_exits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_exits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_exits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_exits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_exits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_exits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenant_user_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          linked_at: string
          notes: string | null
          profile_id: string
          tenant_id: string
          unlinked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          linked_at?: string
          notes?: string | null
          profile_id: string
          tenant_id: string
          unlinked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          linked_at?: string
          notes?: string | null
          profile_id?: string
          tenant_id?: string
          unlinked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_user_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_user_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_user_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_user_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_user_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_user_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      tenants: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alternate_phone: string | null
          city: string | null
          company_registration_number: string | null
          country_code: string
          created_at: string
          date_of_birth: string | null
          display_name: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          legal_name: string | null
          locality: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          status: Database["kiraya"]["Enums"]["tenant_status"]
          tax_identifier: string | null
          tenant_code: string
          tenant_type: Database["kiraya"]["Enums"]["tenant_type"]
          updated_at: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_phone?: string | null
          city?: string | null
          company_registration_number?: string | null
          country_code?: string
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["kiraya"]["Enums"]["tenant_status"]
          tax_identifier?: string | null
          tenant_code: string
          tenant_type?: Database["kiraya"]["Enums"]["tenant_type"]
          updated_at?: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alternate_phone?: string | null
          city?: string | null
          company_registration_number?: string | null
          country_code?: string
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          legal_name?: string | null
          locality?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: Database["kiraya"]["Enums"]["tenant_status"]
          tax_identifier?: string | null
          tenant_code?: string
          tenant_type?: Database["kiraya"]["Enums"]["tenant_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          organization_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          organization_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          organization_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area: number | null
          area_unit: string | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          description: string | null
          floor_number: number | null
          id: string
          metadata: Json
          name: string | null
          organization_id: string
          property_id: string
          status: Database["kiraya"]["Enums"]["unit_status"]
          unit_code: string
          unit_type_id: string | null
          updated_at: string
        }
        Insert: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          metadata?: Json
          name?: string | null
          organization_id: string
          property_id: string
          status?: Database["kiraya"]["Enums"]["unit_status"]
          unit_code: string
          unit_type_id?: string | null
          updated_at?: string
        }
        Update: {
          area?: number | null
          area_unit?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          description?: string | null
          floor_number?: number | null
          id?: string
          metadata?: Json
          name?: string | null
          organization_id?: string
          property_id?: string
          status?: Database["kiraya"]["Enums"]["unit_status"]
          unit_code?: string
          unit_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "unit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      utilities: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_metered: boolean
          is_system: boolean
          metadata: Json
          name: string
          organization_id: string | null
          sort_order: number
          unit_name: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_metered?: boolean
          is_system?: boolean
          metadata?: Json
          name: string
          organization_id?: string | null
          sort_order?: number
          unit_name?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_metered?: boolean
          is_system?: boolean
          metadata?: Json
          name?: string
          organization_id?: string | null
          sort_order?: number
          unit_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_configurations: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          is_tenant_chargeable: boolean
          metadata: Json
          meter_type: Database["kiraya"]["Enums"]["meter_type"]
          notes: string | null
          organization_id: string
          property_id: string | null
          unit_id: string | null
          updated_at: string
          utility_id: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          is_tenant_chargeable?: boolean
          metadata?: Json
          meter_type?: Database["kiraya"]["Enums"]["meter_type"]
          notes?: string | null
          organization_id: string
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
          utility_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          is_tenant_chargeable?: boolean
          metadata?: Json
          meter_type?: Database["kiraya"]["Enums"]["meter_type"]
          notes?: string | null
          organization_id?: string
          property_id?: string | null
          unit_id?: string | null
          updated_at?: string
          utility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_meter_consumption_trend"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_portfolio"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_property_occupancy"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "utility_configurations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "utility_configurations_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      utility_rates: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          metadata: Json
          notes: string | null
          organization_id: string
          rate: number
          unit_name: string
          updated_at: string
          utility_configuration_id: string | null
          utility_id: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          notes?: string | null
          organization_id: string
          rate: number
          unit_name: string
          updated_at?: string
          utility_configuration_id?: string | null
          utility_id: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          notes?: string | null
          organization_id?: string
          rate?: number
          unit_name?: string
          updated_at?: string
          utility_configuration_id?: string | null
          utility_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_rates_utility_configuration_id_fkey"
            columns: ["utility_configuration_id"]
            isOneToOne: false
            referencedRelation: "utility_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_rates_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          bill_id: string | null
          created_at: string
          delivered_at: string | null
          document_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          message_type: string
          metadata: Json
          organization_id: string
          provider: string | null
          provider_message_id: string | null
          queued_at: string
          read_at: string | null
          recipient_phone: string
          retry_count: number
          sent_at: string | null
          status: Database["kiraya"]["Enums"]["message_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          bill_id?: string | null
          created_at?: string
          delivered_at?: string | null
          document_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message_type?: string
          metadata?: Json
          organization_id: string
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          read_at?: string | null
          recipient_phone: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["kiraya"]["Enums"]["message_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          bill_id?: string | null
          created_at?: string
          delivered_at?: string | null
          document_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message_type?: string
          metadata?: Json
          organization_id?: string
          provider?: string | null
          provider_message_id?: string | null
          queued_at?: string
          read_at?: string | null
          recipient_phone?: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["kiraya"]["Enums"]["message_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
    }
    Views: {
      v_collection_by_payment_method: {
        Row: {
          collected_amount: number | null
          organization_id: string | null
          payment_count: number | null
          payment_method_code: string | null
          payment_method_id: string | null
          payment_method_name: string | null
          period_month: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_collection_performance: {
        Row: {
          bill_count: number | null
          billed_amount: number | null
          collected_amount: number | null
          collection_gap: number | null
          collection_percentage: number | null
          organization_id: string | null
          payment_count: number | null
          period_month: string | null
        }
        Relationships: []
      }
      v_exit_tenant_dues: {
        Row: {
          deposit_deduction: number | null
          exit_settlement_id: string | null
          final_amount_due: number | null
          final_amount_refundable: number | null
          final_charges: number | null
          lease_code: string | null
          lease_id: string | null
          organization_id: string | null
          previous_dues: number | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          settlement_code: string | null
          settlement_date: string | null
          settlement_direction: string | null
          settlement_status:
            | Database["kiraya"]["Enums"]["settlement_status"]
            | null
          tenant_code: string | null
          tenant_credit: number | null
          tenant_id: string | null
          tenant_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_settlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exit_tenant_statement: {
        Row: {
          actual_end_date: string | null
          created_at: string | null
          deposit_deducted: number | null
          deposit_deduction: number | null
          deposit_held: number | null
          deposit_received: number | null
          deposit_refunded: number | null
          deposit_required: number | null
          exit_settlement_id: string | null
          final_amount_due: number | null
          final_amount_refundable: number | null
          final_charges: number | null
          finalized_at: string | null
          lease_code: string | null
          lease_id: string | null
          occupancy_start_date: string | null
          organization_id: string | null
          phone: string | null
          previous_dues: number | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          settlement_code: string | null
          settlement_credit: number | null
          settlement_date: string | null
          settlement_status:
            | Database["kiraya"]["Enums"]["settlement_status"]
            | null
          tenant_code: string | null
          tenant_credit: number | null
          tenant_due: number | null
          tenant_id: string | null
          tenant_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "exit_settlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "exit_settlements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      v_lease_expiry_alerts: {
        Row: {
          agreement_end_date: string | null
          alert_status: string | null
          days_until_expiry: number | null
          lease_code: string | null
          lease_id: string | null
          organization_id: string | null
          phone: string | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_meter_consumption_trend: {
        Row: {
          consumption: number | null
          meter_code: string | null
          meter_id: string | null
          meter_type: Database["kiraya"]["Enums"]["meter_type"] | null
          organization_id: string | null
          previous_reading: number | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          reading_date: string | null
          reading_event_type:
            | Database["kiraya"]["Enums"]["reading_event_type"]
            | null
          reading_id: string | null
          reading_value: number | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
          utility_id: string | null
          utility_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "meters_utility_id_fkey"
            columns: ["utility_id"]
            isOneToOne: false
            referencedRelation: "utilities"
            referencedColumns: ["id"]
          },
        ]
      }
      v_monthly_collection: {
        Row: {
          collection_month: string | null
          organization_id: string | null
          payment_count: number | null
          reversed_amount: number | null
          successful_payment_count: number | null
          total_collected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_organization_dashboard: {
        Row: {
          active_tenant_count: number | null
          active_tenant_credits: number | null
          active_tenant_dues: number | null
          billed_amount: number | null
          collected_amount: number | null
          collection_percentage: number | null
          occupancy_percentage: number | null
          occupied_unit_count: number | null
          organization_id: string | null
          period_collection_gap: number | null
          period_month: string | null
          property_count: number | null
          unit_count: number | null
          vacant_unit_count: number | null
        }
        Relationships: []
      }
      v_owner_portfolio: {
        Row: {
          occupancy_percentage: number | null
          occupied_units: number | null
          organization_id: string | null
          owner_code: string | null
          owner_id: string | null
          owner_name: string | null
          owner_type: Database["kiraya"]["Enums"]["owner_type"] | null
          ownership_percentage: number | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          tenant_credits: number | null
          tenant_dues: number | null
          total_units: number | null
          vacant_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_ownerships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_payment_method_collection: {
        Row: {
          collected_amount: number | null
          collection_month: string | null
          organization_id: string | null
          payment_count: number | null
          payment_method_code: string | null
          payment_method_id: string | null
          payment_method_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_platform_dashboard: {
        Row: {
          active_tenant_count: number | null
          active_tenant_credits: number | null
          active_tenant_dues: number | null
          billed_amount: number | null
          collected_amount: number | null
          collection_percentage: number | null
          occupancy_percentage: number | null
          occupied_unit_count: number | null
          organization_count: number | null
          period_month: string | null
          property_count: number | null
          unit_count: number | null
          vacant_unit_count: number | null
        }
        Relationships: []
      }
      v_property_occupancy: {
        Row: {
          maintenance_units: number | null
          occupancy_percentage: number | null
          occupied_units: number | null
          organization_id: string | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          total_units: number | null
          unavailable_units: number | null
          vacant_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tenant_bill_summary: {
        Row: {
          adjustment_amount: number | null
          balance_amount: number | null
          bill_date: string | null
          bill_id: string | null
          bill_number: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          discount_amount: number | null
          due_date: string | null
          lease_code: string | null
          lease_id: string | null
          organization_id: string | null
          paid_amount: number | null
          payment_state: string | null
          phone: string | null
          previous_balance_amount: number | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          status: Database["kiraya"]["Enums"]["bill_status"] | null
          subtotal: number | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
          total_amount: number | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "bills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "bills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      v_tenant_ledger: {
        Row: {
          bill_id: string | null
          bill_number: string | null
          created_at: string | null
          credit_amount: number | null
          currency_code: string | null
          debit_amount: number | null
          description: string | null
          entry_date: string | null
          entry_type: Database["kiraya"]["Enums"]["ledger_entry_type"] | null
          is_reversal: boolean | null
          lease_code: string | null
          lease_id: string | null
          ledger_entry_id: string | null
          organization_id: string | null
          payment_id: string | null
          payment_number: string | null
          reference_code: string | null
          reverses_entry_id: string | null
          running_balance: number | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["lease_id"]
          },
          {
            foreignKeyName: "ledger_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_ledger"
            referencedColumns: ["ledger_entry_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "ledger_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_outstanding"
            referencedColumns: ["tenant_id"]
          },
        ]
      }
      v_tenant_milestones: {
        Row: {
          actual_end_date: string | null
          completed_months: number | null
          lease_code: string | null
          lease_id: string | null
          milestone_month: boolean | null
          milestone_number: number | null
          occupancy_days: number | null
          occupancy_start_date: string | null
          organization_id: string | null
          phone: string | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_tenant_outstanding: {
        Row: {
          amount_due: number | null
          balance_status: string | null
          credit_balance: number | null
          lease_code: string | null
          lease_id: string | null
          organization_id: string | null
          phone: string | null
          property_code: string | null
          property_id: string | null
          property_name: string | null
          tenant_code: string | null
          tenant_id: string | null
          tenant_name: string | null
          unit_code: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_dues"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_exit_tenant_statement"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_lease_expiry_alerts"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_bill_summary"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "v_tenant_milestones"
            referencedColumns: ["unit_id"]
          },
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      allocate_payment_to_bills: {
        Args: { p_payment_id: string }
        Returns: number
      }
      apply_tenant_credit_to_bill: {
        Args: { p_amount: number; p_bill_id: string; p_created_by?: string }
        Returns: string
      }
      assert_same_organization: {
        Args: {
          actual_organization_id: string
          expected_organization_id: string
        }
        Returns: undefined
      }
      billing_period_days: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: number
      }
      calculate_exit_settlement: {
        Args: { p_exit_settlement_id: string }
        Returns: {
          created_at: string
          currency_code: string
          deposit_deduction: number
          final_amount_due: number
          final_amount_refundable: number
          final_charges: number
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          previous_dues: number
          settlement_date: string
          settlement_reference: string
          status: Database["kiraya"]["Enums"]["settlement_status"]
          tenant_credit: number
          tenant_exit_id: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "exit_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_prorated_rent: {
        Args: {
          p_charge_end_date: string
          p_charge_start_date: string
          p_monthly_rent: number
          p_period_end: string
          p_period_start: string
          p_proration_method: Database["kiraya"]["Enums"]["proration_method"]
        }
        Returns: number
      }
      can_access_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_access_tenant: {
        Args: { p_organization_id: string; p_tenant_id: string }
        Returns: boolean
      }
      can_import_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_write_organization: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_write_tenant_data: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      current_profile_id: { Args: never; Returns: string }
      days_in_month: { Args: { p_date: string }; Returns: number }
      finalize_bill: {
        Args: { p_bill_id: string; p_finalized_by: string }
        Returns: {
          adjustment_amount: number
          bill_date: string
          bill_number: string
          billing_run_id: string | null
          created_at: string
          currency_code: string
          discount_amount: number
          due_date: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          previous_balance_amount: number
          status: Database["kiraya"]["Enums"]["bill_status"]
          subtotal: number
          tenant_id: string
          total_amount: number
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bills"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finalize_billing_run: {
        Args: { p_billing_run_id: string; p_finalized_by: string }
        Returns: number
      }
      finalize_exit_settlement: {
        Args: { p_exit_settlement_id: string; p_finalized_by: string }
        Returns: {
          created_at: string
          currency_code: string
          deposit_deduction: number
          final_amount_due: number
          final_amount_refundable: number
          final_charges: number
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          previous_dues: number
          settlement_date: string
          settlement_reference: string
          status: Database["kiraya"]["Enums"]["settlement_status"]
          tenant_credit: number
          tenant_exit_id: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "exit_settlements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_bill: {
        Args: {
          p_bill_date: string
          p_billing_run_id?: string
          p_created_by?: string
          p_due_date?: string
          p_lease_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      generate_billing_run: {
        Args: {
          p_bill_date: string
          p_due_date?: string
          p_initiated_by?: string
          p_organization_id: string
          p_period_end: string
          p_period_start: string
          p_property_id?: string
        }
        Returns: string
      }
      generate_rent_bill_item: {
        Args: {
          p_bill_id: string
          p_lease_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      generate_utility_bill_items: {
        Args: {
          p_bill_id: string
          p_lease_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: number
      }
      get_applicable_rent_rule: {
        Args: {
          p_lease_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: {
          auto_apply: boolean
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          lease_id: string
          metadata: Json
          monthly_rent: number
          notes: string | null
          organization_id: string
          rule_name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "lease_rent_rules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_bill_balance: { Args: { p_bill_id: string }; Returns: number }
      get_bill_current_charge_amount: {
        Args: { p_bill_id: string }
        Returns: number
      }
      get_bill_paid_amount: { Args: { p_bill_id: string }; Returns: number }
      get_bill_total_payable: { Args: { p_bill_id: string }; Returns: number }
      get_lease_charge_end: {
        Args: { p_lease_id: string; p_period_end: string }
        Returns: string
      }
      get_lease_charge_start: {
        Args: { p_lease_id: string; p_period_start: string }
        Returns: string
      }
      get_security_deposit_deducted: {
        Args: { p_security_deposit_id: string }
        Returns: number
      }
      get_security_deposit_held: {
        Args: { p_security_deposit_id: string }
        Returns: number
      }
      get_security_deposit_received: {
        Args: { p_security_deposit_id: string }
        Returns: number
      }
      get_security_deposit_refunded: {
        Args: { p_security_deposit_id: string }
        Returns: number
      }
      get_tenant_balance: { Args: { p_tenant_id: string }; Returns: number }
      get_tenant_credit: { Args: { p_tenant_id: string }; Returns: number }
      get_tenant_credit_total: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_tenant_debit_total: { Args: { p_tenant_id: string }; Returns: number }
      get_tenant_due: { Args: { p_tenant_id: string }; Returns: number }
      has_organization_permission: {
        Args: { p_organization_id: string; p_permission_code: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_meter_user: { Args: { p_meter_id: string }; Returns: boolean }
      is_tenant_user: { Args: { p_tenant_id: string }; Returns: boolean }
      post_bill_to_ledger: {
        Args: { p_bill_id: string; p_created_by?: string }
        Returns: string
      }
      post_exit_settlement_to_ledger: {
        Args: { p_created_by?: string; p_exit_settlement_id: string }
        Returns: string
      }
      post_payment_to_ledger: {
        Args: { p_created_by?: string; p_payment_id: string }
        Returns: string
      }
      require_financial_context: { Args: never; Returns: undefined }
      reverse_payment: {
        Args: { p_payment_id: string; p_reason: string; p_reversed_by: string }
        Returns: string
      }
      reverse_payment_allocations: {
        Args: { p_payment_id: string; p_reason: string; p_reversed_by: string }
        Returns: number
      }
      sync_bill_payment_status: {
        Args: { p_bill_id: string }
        Returns: undefined
      }
      sync_security_deposit_summary: {
        Args: { p_security_deposit_id: string }
        Returns: undefined
      }
      validate_property_ownership_complete: {
        Args: { p_as_of_date?: string; p_property_id: string }
        Returns: boolean
      }
      void_bill: {
        Args: { p_bill_id: string; p_reason: string; p_voided_by: string }
        Returns: {
          adjustment_amount: number
          bill_date: string
          bill_number: string
          billing_run_id: string | null
          created_at: string
          currency_code: string
          discount_amount: number
          due_date: string | null
          finalized_at: string | null
          finalized_by: string | null
          id: string
          lease_id: string
          metadata: Json
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          previous_balance_amount: number
          status: Database["kiraya"]["Enums"]["bill_status"]
          subtotal: number
          tenant_id: string
          total_amount: number
          unit_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bills"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      bill_status: "DRAFT" | "FINALIZED" | "PARTIALLY_PAID" | "PAID" | "VOID"
      billing_frequency:
        | "MONTHLY"
        | "QUARTERLY"
        | "YEARLY"
        | "WEEKLY"
        | "CUSTOM"
      billing_run_status:
        | "DRAFT"
        | "RUNNING"
        | "COMPLETED"
        | "PARTIAL"
        | "FAILED"
        | "FINALIZED"
      deposit_status: "PENDING" | "PARTIALLY_RECEIVED" | "RECEIVED"
      document_visibility: "INTERNAL" | "CLIENT" | "TENANT" | "SHARED"
      exit_status:
        | "INITIATED"
        | "PENDING_SETTLEMENT"
        | "COMPLETED"
        | "CANCELLED"
      import_status:
        | "UPLOADED"
        | "PROCESSING"
        | "COMPLETED"
        | "PARTIAL"
        | "FAILED"
        | "CANCELLED"
      lease_party_role: "CO_TENANT" | "OCCUPANT" | "GUARANTOR" | "OTHER"
      lease_status: "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED"
      ledger_entry_type:
        | "BILL"
        | "PAYMENT"
        | "ADJUSTMENT"
        | "CREDIT_APPLICATION"
        | "REVERSAL"
        | "ALLOCATION_REVERSAL"
        | "EXIT_SETTLEMENT"
        | "DEPOSIT_RECEIPT"
        | "DEPOSIT_DEDUCTION"
        | "DEPOSIT_REFUND"
      member_status: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED"
      message_status:
        | "QUEUED"
        | "SENT"
        | "DELIVERED"
        | "READ"
        | "FAILED"
        | "CANCELLED"
      meter_type: "FIXED" | "SUB_METER" | "SELF_METER" | "OTHER"
      organization_status: "ACTIVE" | "SUSPENDED" | "ARCHIVED"
      owner_type: "INDIVIDUAL" | "COMPANY" | "TRUST" | "OTHER"
      payment_method_type: "CASH" | "ONLINE" | "DISCOUNT" | "OTHER"
      payment_status: "POSTED" | "REVERSED"
      profile_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
      property_status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
      proration_method:
        | "CALENDAR_DAYS"
        | "FIXED_30_DAYS"
        | "DATE_TO_DATE"
        | "NONE"
      reading_event_type: "NORMAL" | "METER_RESET" | "METER_REPLACEMENT"
      reading_source: "MANUAL" | "IMPORT" | "API" | "OTHER"
      role_scope: "PLATFORM" | "ORGANIZATION"
      settlement_status: "DRAFT" | "FINALIZED" | "SETTLED" | "CANCELLED"
      tenant_status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
      tenant_type: "INDIVIDUAL" | "COMPANY" | "OTHER"
      unit_status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE"
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
  kiraya: {
    Enums: {
      bill_status: ["DRAFT", "FINALIZED", "PARTIALLY_PAID", "PAID", "VOID"],
      billing_frequency: ["MONTHLY", "QUARTERLY", "YEARLY", "WEEKLY", "CUSTOM"],
      billing_run_status: [
        "DRAFT",
        "RUNNING",
        "COMPLETED",
        "PARTIAL",
        "FAILED",
        "FINALIZED",
      ],
      deposit_status: ["PENDING", "PARTIALLY_RECEIVED", "RECEIVED"],
      document_visibility: ["INTERNAL", "CLIENT", "TENANT", "SHARED"],
      exit_status: [
        "INITIATED",
        "PENDING_SETTLEMENT",
        "COMPLETED",
        "CANCELLED",
      ],
      import_status: [
        "UPLOADED",
        "PROCESSING",
        "COMPLETED",
        "PARTIAL",
        "FAILED",
        "CANCELLED",
      ],
      lease_party_role: ["CO_TENANT", "OCCUPANT", "GUARANTOR", "OTHER"],
      lease_status: ["DRAFT", "ACTIVE", "ENDED", "CANCELLED"],
      ledger_entry_type: [
        "BILL",
        "PAYMENT",
        "ADJUSTMENT",
        "CREDIT_APPLICATION",
        "REVERSAL",
        "ALLOCATION_REVERSAL",
        "EXIT_SETTLEMENT",
        "DEPOSIT_RECEIPT",
        "DEPOSIT_DEDUCTION",
        "DEPOSIT_REFUND",
      ],
      member_status: ["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"],
      message_status: [
        "QUEUED",
        "SENT",
        "DELIVERED",
        "READ",
        "FAILED",
        "CANCELLED",
      ],
      meter_type: ["FIXED", "SUB_METER", "SELF_METER", "OTHER"],
      organization_status: ["ACTIVE", "SUSPENDED", "ARCHIVED"],
      owner_type: ["INDIVIDUAL", "COMPANY", "TRUST", "OTHER"],
      payment_method_type: ["CASH", "ONLINE", "DISCOUNT", "OTHER"],
      payment_status: ["POSTED", "REVERSED"],
      profile_status: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      property_status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      proration_method: [
        "CALENDAR_DAYS",
        "FIXED_30_DAYS",
        "DATE_TO_DATE",
        "NONE",
      ],
      reading_event_type: ["NORMAL", "METER_RESET", "METER_REPLACEMENT"],
      reading_source: ["MANUAL", "IMPORT", "API", "OTHER"],
      role_scope: ["PLATFORM", "ORGANIZATION"],
      settlement_status: ["DRAFT", "FINALIZED", "SETTLED", "CANCELLED"],
      tenant_status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      tenant_type: ["INDIVIDUAL", "COMPANY", "OTHER"],
      unit_status: ["VACANT", "OCCUPIED", "MAINTENANCE", "UNAVAILABLE"],
    },
  },
} as const
