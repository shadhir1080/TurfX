export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      system_settings: {
        Row: {
          id: number
          default_commission_rate: number
        }
        Insert: {
          id?: number
          default_commission_rate?: number
        }
        Update: {
          id?: number
          default_commission_rate?: number
        }
      }
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'owner' | 'user'
          full_name: string | null
          avatar_url: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id: string
          role?: 'admin' | 'owner' | 'user'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          role?: 'admin' | 'owner' | 'user'
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_active?: boolean
        }
      }
      turfs: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          description: string | null
          location: Json | null
          coordinates: Json | null
          price_per_hour: number
          images: string[] | null
          is_verified: boolean
          is_premium: boolean
          is_24hours: boolean
          sports: string[] | null
          timings: string | null
          amenities: string[] | null
          rating: number | null
          review_count: number | null
          custom_commission_rate: number | null
          razorpay_linked_account_id: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name: string
          description?: string | null
          location?: Json | null
          coordinates?: Json | null
          price_per_hour: number
          images?: string[] | null
          is_verified?: boolean
          is_premium?: boolean
          is_24hours?: boolean
          sports?: string[] | null
          timings?: string | null
          amenities?: string[] | null
          rating?: number | null
          review_count?: number | null
          custom_commission_rate?: number | null
          razorpay_linked_account_id?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          owner_id?: string | null
          name?: string
          description?: string | null
          location?: Json | null
          coordinates?: Json | null
          price_per_hour?: number
          images?: string[] | null
          is_verified?: boolean
          is_premium?: boolean
          is_24hours?: boolean
          sports?: string[] | null
          timings?: string | null
          amenities?: string[] | null
          rating?: number | null
          review_count?: number | null
          custom_commission_rate?: number | null
          razorpay_linked_account_id?: string | null
          created_at?: string
          is_active?: boolean
        }
      }

      bookings: {
        Row: {
          id: string
          user_id: string | null
          turf_id: string
          start_time: string
          end_time: string
          total_amount: number
          commission_amount: number
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
          payment_type: string | null
          advance_amount: number | null
          balance_amount: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          turf_id: string
          start_time: string
          end_time: string
          total_amount: number
          commission_amount: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          payment_type?: string | null
          advance_amount?: number | null
          balance_amount?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          turf_id?: string
          start_time?: string
          end_time?: string
          total_amount?: number
          commission_amount?: number
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
          payment_type?: string | null
          advance_amount?: number | null
          balance_amount?: number | null
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: 'created' | 'authorized' | 'captured' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: 'created' | 'authorized' | 'captured' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: 'created' | 'authorized' | 'captured' | 'failed'
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: 'admin' | 'owner' | 'user'
      booking_status: 'pending' | 'confirmed' | 'cancelled'
      payment_status: 'created' | 'authorized' | 'captured' | 'failed'
    }
  }
}
