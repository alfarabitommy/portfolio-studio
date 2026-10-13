/*
 * Database typings for the Supabase schema defined in docs/PRD.md §5.
 *
 * This file is HAND-AUTHORED in the exact shape that `supabase gen types
 * typescript` emits, so that regenerating it later against a linked project is
 * a drop-in replacement (see plan/01-phase1-foundation-plan.md A4).
 *
 * Column fidelity notes:
 * - Every `timestamptz` column is typed `string`, not `Date`: PostgREST returns
 *   ISO-8601 strings over the wire.
 * - A column is `| null` in `Row` whenever the PRD SQL does not declare NOT NULL.
 *   Several defaulted columns (`is_published`, `display_order`, `tags`,
 *   `reading_time_minutes`, `is_read`) are technically nullable because their
 *   DDL uses `DEFAULT` without `NOT NULL`.
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
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          category: string
          summary: string
          problem_statement: string
          solution_statement: string
          cover_image_url: string
          gallery_images: string[] | null
          tech_stack: string[]
          live_url: string | null
          repo_url: string | null
          display_order: number | null
          is_published: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          category: string
          summary: string
          problem_statement: string
          solution_statement: string
          cover_image_url: string
          gallery_images?: string[] | null
          tech_stack: string[]
          live_url?: string | null
          repo_url?: string | null
          display_order?: number | null
          is_published?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          category?: string
          summary?: string
          problem_statement?: string
          solution_statement?: string
          cover_image_url?: string
          gallery_images?: string[] | null
          tech_stack?: string[]
          live_url?: string | null
          repo_url?: string | null
          display_order?: number | null
          is_published?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string
          content: string
          cover_image_url: string
          tags: string[] | null
          reading_time_minutes: number | null
          is_published: boolean | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt: string
          content: string
          cover_image_url: string
          tags?: string[] | null
          reading_time_minutes?: number | null
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          cover_image_url?: string
          tags?: string[] | null
          reading_time_minutes?: number | null
          is_published?: boolean | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          id: string
          name: string
          email: string
          intent_type: string
          message: string
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          intent_type?: string
          message: string
          is_read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          intent_type?: string
          message?: string
          is_read?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      site_configs: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Article = Database['public']['Tables']['articles']['Row']
export type ArticleInsert = Database['public']['Tables']['articles']['Insert']
export type ArticleUpdate = Database['public']['Tables']['articles']['Update']

export type InboxMessage = Database['public']['Tables']['inbox_messages']['Row']
export type InboxMessageInsert = Database['public']['Tables']['inbox_messages']['Insert']
export type InboxMessageUpdate = Database['public']['Tables']['inbox_messages']['Update']

export type SiteConfig = Database['public']['Tables']['site_configs']['Row']
export type SiteConfigInsert = Database['public']['Tables']['site_configs']['Insert']
export type SiteConfigUpdate = Database['public']['Tables']['site_configs']['Update']

/*
 * Typed shape of the two canonical `site_configs` keys, seeded by
 * supabase/migrations/20261008120000_init_schema.sql.
 *
 * `value` is `jsonb` in Postgres, so the generic column type is `Json`. This map
 * narrows the two keys the application actually reads — see
 * docs/UX_UX_Spec.md §3B (availability pill) and §3F / §7 (CV download).
 */

/** Availability state surfaced by the dynamic status pill. */
export type SiteAvailabilityStatus = 'available' | 'busy'

export interface SiteConfigValueMap {
  availability: {
    status: SiteAvailabilityStatus
    label: string
  }
  /**
   * The downloadable CV asset. The key is `resume`, matching the already
   * deployed Supabase project — not `cv`. Verified against the live
   * `site_configs` table during Phase 1 execution.
   */
  resume: {
    url: string | null
    updated_at: string | null
  }
}

export type SiteConfigKey = keyof SiteConfigValueMap
