/**
 * Supabase Database Types
 * 
 * These types are generated from the database schema.
 * They provide type safety when using Supabase client.
 * 
 * To regenerate: npx supabase gen types typescript --project-id <project-id> > types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          image: string | null
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email: string
          image?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          image?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          description: string | null
          subdomain: string
          custom_domain: string | null
          logo: string | null
          user_id: string
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          subdomain: string
          custom_domain?: string | null
          logo?: string | null
          user_id: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          subdomain?: string
          custom_domain?: string | null
          logo?: string | null
          user_id?: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image: string | null
          store_id: string
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image?: string | null
          store_id: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image?: string | null
          store_id?: string
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: Json
          layout_id: string
          is_home: boolean
          meta_title: string | null
          meta_description: string | null
          store_id: string
          is_published: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: Json
          layout_id?: string
          is_home?: boolean
          meta_title?: string | null
          meta_description?: string | null
          store_id: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: Json
          layout_id?: string
          is_home?: boolean
          meta_title?: string | null
          meta_description?: string | null
          store_id?: string
          is_published?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          type: string
          content: Json
          is_active: boolean
          conditions: Json
          store_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          content?: Json
          is_active?: boolean
          conditions?: Json
          store_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          content?: Json
          is_active?: boolean
          conditions?: Json
          store_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      popups: {
        Row: {
          id: string
          name: string
          content: Json
          trigger: Json
          conditions: Json
          is_active: boolean
          store_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          content?: Json
          trigger?: Json
          conditions?: Json
          is_active?: boolean
          store_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          content?: Json
          trigger?: Json
          conditions?: Json
          is_active?: boolean
          store_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource: string
          resource_id: string
          metadata: Json | null
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource: string
          resource_id: string
          metadata?: Json | null
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource?: string
          resource_id?: string
          metadata?: Json | null
          timestamp?: string
        }
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
  }
}
