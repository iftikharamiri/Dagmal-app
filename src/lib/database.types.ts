export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          phone: string | null
          cuisines: string[]
          dietary: string[]
          favorites: string[]
          favorite_deals: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          phone?: string | null
          cuisines?: string[]
          dietary?: string[]
          favorites?: string[]
          favorite_deals?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          phone?: string | null
          cuisines?: string[]
          dietary?: string[]
          favorites?: string[]
          favorite_deals?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          phone: string | null
          address: string | null
          city: string | null
          lat: number
          lng: number
          categories: string[]
          dine_in: boolean
          takeaway: boolean
          menu_pdf_url: string | null
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          lat: number
          lng: number
          categories?: string[]
          dine_in?: boolean
          takeaway?: boolean
          menu_pdf_url?: string | null
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          lat?: number
          lng?: number
          categories?: string[]
          dine_in?: boolean
          takeaway?: boolean
          menu_pdf_url?: string | null
          owner_id?: string | null
          created_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          price: number
          category: string | null
          dietary_info: string[]
          image_url: string | null
          is_available: boolean
          price_tiers: Array<{ type: string; amount_ore: number }> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          description?: string | null
          price: number
          category?: string | null
          dietary_info?: string[]
          image_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          dietary_info?: string[]
          image_url?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          restaurant_id: string
          title: string
          description: string | null
          image_url: string | null
          original_price: number
          discount_percentage: number
          final_price: number
          available_for: string[]
          dietary_info: string[]
          available_days: string[]
          start_time: string
          end_time: string
          per_user_limit: number
          total_limit: number | null
          claimed_count: number
          is_active: boolean
          verification_code: string
          menu_item_id: string | null
          selected_price_tiers: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          title: string
          description?: string | null
          image_url?: string | null
          original_price: number
          discount_percentage: number
          available_for?: string[]
          dietary_info?: string[]
          available_days?: string[]
          start_time: string
          end_time: string
          per_user_limit?: number
          total_limit?: number | null
          claimed_count?: number
          is_active?: boolean
          verification_code?: string
          menu_item_id?: string | null
          selected_price_tiers?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          original_price?: number
          discount_percentage?: number
          available_for?: string[]
          dietary_info?: string[]
          available_days?: string[]
          start_time?: string
          end_time?: string
          per_user_limit?: number
          total_limit?: number | null
          claimed_count?: number
          is_active?: boolean
          verification_code?: string
          created_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          restaurant_id: string
          quantity: number
          service_type: 'dine_in' | 'takeaway'
          phone: string | null
          special_requests: string | null
          status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
          redeemed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          restaurant_id: string
          quantity?: number
          service_type: 'dine_in' | 'takeaway'
          phone?: string | null
          special_requests?: string | null
          status?: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
          redeemed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          user_id?: string
          restaurant_id?: string
          quantity?: number
          service_type?: 'dine_in' | 'takeaway'
          phone?: string | null
          special_requests?: string | null
          status?: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
          redeemed_at?: string | null
          created_at?: string
        }
      }
      restaurant_applications: {
        Row: {
          id: string
          user_id: string
          restaurant_name: string
          owner_name: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          lat: number | null
          lng: number | null
          description: string
          cuisine_types: string[]
          org_number: string
          website_url: string | null
          opening_hours: any
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          restaurant_name: string
          owner_name: string
          email: string
          phone: string
          address: string
          city: string
          postal_code: string
          lat?: number | null
          lng?: number | null
          description: string
          cuisine_types: string[]
          org_number: string
          website_url?: string | null
          opening_hours?: any
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          restaurant_name?: string
          owner_name?: string
          email?: string
          phone?: string
          address?: string
          city?: string
          postal_code?: string
          lat?: number | null
          lng?: number | null
          description?: string
          cuisine_types?: string[]
          org_number?: string
          website_url?: string | null
          opening_hours?: any
          status?: string
          created_at?: string
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

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type Deal = Database['public']['Tables']['deals']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']

export type DealWithRestaurant = Deal & {
  restaurant: Restaurant
}

export type ClaimWithDealAndRestaurant = Claim & {
  deal: Deal & { restaurant: Restaurant }
}

export type RestaurantApplication = Database['public']['Tables']['restaurant_applications']['Row']



