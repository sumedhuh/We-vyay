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
      workouts: {
        Row: {
          id: string
          name: string
          animation_url: string
          thumbnail_url: string
          emojis: string[]
          metadata: Json
          author_id: string
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          animation_url: string
          thumbnail_url: string
          emojis?: string[]
          metadata?: Json
          author_id: string
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          animation_url?: string
          thumbnail_url?: string
          emojis?: string[]
          metadata?: Json
          author_id?: string
          is_published?: boolean
          created_at?: string
        }
      }
      routines: {
        Row: {
          id: string
          title: string
          creator_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          creator_id: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          creator_id?: string
          created_at?: string
        }
      }
      routine_workouts: {
        Row: {
          id: string
          routine_id: string
          workout_id: string
          order_index: number
        }
        Insert: {
          id?: string
          routine_id: string
          workout_id: string
          order_index: number
        }
        Update: {
          id?: string
          routine_id?: string
          workout_id?: string
          order_index?: number
        }
      }
    }
  }
}
