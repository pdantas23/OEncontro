/**
 * src/types/database.ts
 *
 * Tipos do banco de dados Supabase.
 * Este arquivo será substituído pelo gerado via:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 *
 * NUNCA editar manualmente após conectar ao Supabase real.
 * Convenção: todas as tabelas usam sufixo _encontro
 *
 * ATENÇÃO: GenericTable requer Relationships: [] em todas as tabelas
 * para satisfazer a tipagem do @supabase/postgrest-js.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles_encontro: {
        Row: {
          uuid: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          uuid: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          uuid?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }

      event_config_encontro: {
        Row: {
          id: string
          name: string | null
          date: string | null
          location: string | null
          description: string | null
          group_link: string | null
          whatsapp_support: string | null
          total_ticket_limit: number | null
          low_stock_threshold: number
          sale_status: string
          meta_pixel_id: string | null
          gtm_id: string | null
          google_ads_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          date?: string | null
          location?: string | null
          description?: string | null
          group_link?: string | null
          whatsapp_support?: string | null
          total_ticket_limit?: number | null
          low_stock_threshold?: number
          sale_status?: string
          meta_pixel_id?: string | null
          gtm_id?: string | null
          google_ads_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          date?: string | null
          location?: string | null
          description?: string | null
          group_link?: string | null
          whatsapp_support?: string | null
          total_ticket_limit?: number | null
          low_stock_threshold?: number
          sale_status?: string
          meta_pixel_id?: string | null
          gtm_id?: string | null
          google_ads_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      ticket_lots_encontro: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          total_limit: number
          sold_count: number
          status: string
          benefits: Json | null
          display_order: number
          image_url: string | null
          label: string | null
          event_days: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          total_limit: number
          sold_count?: number
          status?: string
          benefits?: Json | null
          display_order?: number
          image_url?: string | null
          label?: string | null
          event_days?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          total_limit?: number
          sold_count?: number
          status?: string
          benefits?: Json | null
          display_order?: number
          image_url?: string | null
          label?: string | null
          event_days?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      order_bumps_encontro: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          stock_limit: number | null
          sold_count: number
          has_sizes: boolean
          active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          stock_limit?: number | null
          sold_count?: number
          has_sizes?: boolean
          active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          stock_limit?: number | null
          sold_count?: number
          has_sizes?: boolean
          active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      ticket_lot_bumps_encontro: {
        Row: {
          id: string
          principal_lot_id: string
          offered_lot_id: string
          discount_type: 'percent' | 'fixed' | null
          discount_value: number | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          principal_lot_id: string
          offered_lot_id: string
          discount_type?: 'percent' | 'fixed' | null
          discount_value?: number | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          principal_lot_id?: string
          offered_lot_id?: string
          discount_type?: 'percent' | 'fixed' | null
          discount_value?: number | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_lot_bumps_encontro_principal_lot_id_fkey'
            columns: ['principal_lot_id']
            isOneToOne: false
            referencedRelation: 'ticket_lots_encontro'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ticket_lot_bumps_encontro_offered_lot_id_fkey'
            columns: ['offered_lot_id']
            isOneToOne: false
            referencedRelation: 'ticket_lots_encontro'
            referencedColumns: ['id']
          },
        ]
      }

      speakers_encontro: {
        Row: {
          id: string
          name: string
          role: string | null
          bio: string | null
          photo_url: string | null
          social_links: Json | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string | null
          bio?: string | null
          photo_url?: string | null
          social_links?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string | null
          bio?: string | null
          photo_url?: string | null
          social_links?: Json | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      schedule_encontro: {
        Row: {
          id: string
          day: number
          start_time: string
          end_time: string | null
          talk_title: string
          speaker_id: string | null
          item_type: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day: number
          start_time: string
          end_time?: string | null
          talk_title: string
          speaker_id?: string | null
          item_type?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day?: number
          start_time?: string
          end_time?: string | null
          talk_title?: string
          speaker_id?: string | null
          item_type?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_encontro_speaker_id_fkey'
            columns: ['speaker_id']
            isOneToOne: false
            referencedRelation: 'speakers_encontro'
            referencedColumns: ['id']
          },
        ]
      }

      orders_encontro: {
        Row: {
          id: string
          buyer_name: string
          buyer_email: string
          buyer_whatsapp: string
          buyer_cpf: string | null
          ticket_lot_id: string
          ticket_quantity: number
          order_bumps: Json | null
          subtotal: number
          total: number
          payment_method: string
          payment_status: string
          payment_id: string | null
          pix_code: string | null
          pix_qrcode_url: string | null
          pix_expires_at: string | null
          has_inventory_issue: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_name: string
          buyer_email: string
          buyer_whatsapp: string
          buyer_cpf?: string | null
          ticket_lot_id: string
          ticket_quantity?: number
          order_bumps?: Json | null
          subtotal: number
          total: number
          payment_method: string
          payment_status?: string
          payment_id?: string | null
          pix_code?: string | null
          pix_qrcode_url?: string | null
          pix_expires_at?: string | null
          has_inventory_issue?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_name?: string
          buyer_email?: string
          buyer_whatsapp?: string
          buyer_cpf?: string | null
          ticket_lot_id?: string
          ticket_quantity?: number
          order_bumps?: Json | null
          subtotal?: number
          total?: number
          payment_method?: string
          payment_status?: string
          payment_id?: string | null
          pix_code?: string | null
          pix_qrcode_url?: string | null
          pix_expires_at?: string | null
          has_inventory_issue?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_encontro_ticket_lot_id_fkey'
            columns: ['ticket_lot_id']
            isOneToOne: false
            referencedRelation: 'ticket_lots_encontro'
            referencedColumns: ['id']
          },
        ]
      }

      email_logs_encontro: {
        Row: {
          id: string
          order_id: string
          template: string
          recipient: string
          status: string
          attempts: number
          last_attempt_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          template: string
          recipient: string
          status?: string
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          template?: string
          recipient?: string
          status?: string
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_logs_encontro_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders_encontro'
            referencedColumns: ['id']
          },
        ]
      }

      tracking_events_encontro: {
        Row: {
          id: string
          event_name: string
          order_id: string | null
          session_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          order_id?: string | null
          session_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          order_id?: string | null
          session_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {}
    Functions: {
      increment_ticket_sold_count: {
        Args: { lot_id: string; qty: number }
        Returns: boolean
      }
      reserve_ticket_slot: {
        Args: { p_lot_id: string; p_quantity?: number }
        Returns: boolean
      }
      release_ticket_slot: {
        Args: { p_lot_id: string; p_quantity?: number }
        Returns: undefined
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      get_order_status: {
        Args: { p_order_id: string }
        Returns: {
          id: string
          payment_status: string
          payment_method: string
          buyer_name: string
          buyer_email: string
          total: number
        }[]
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {}
  }
}
