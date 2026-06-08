export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          member_since: string;
          role: 'member' | 'crew' | 'admin';
          avatar_url: string | null;
          settings: Json;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          member_since?: string;
          role?: 'member' | 'crew' | 'admin';
          avatar_url?: string | null;
          settings?: Json;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          edition_number: number;
          name: string;
          tagline: string | null;
          date: string;
          doors_open: string;
          doors_close: string;
          venue_name: string;
          venue_address: string;
          venue_lat: number | null;
          venue_lng: number | null;
          capacity: number;
          max_tickets_per_user: number;
          status: 'upcoming' | 'live' | 'past' | 'cancelled';
          hero_image_url: string | null;
          faqs: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          tier_id: string;
          quantity: number;
          subtotal_cents: number;
          discount_cents: number;
          fee_cents: number;
          total_cents: number;
          stripe_payment_intent_id: string;
          status: 'pending' | 'completed' | 'refunded' | 'cancelled';
          discount_code_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          tier_id: string;
          quantity: number;
          subtotal_cents: number;
          discount_cents?: number;
          fee_cents?: number;
          total_cents: number;
          stripe_payment_intent_id: string;
          status?: 'pending' | 'completed' | 'refunded' | 'cancelled';
          discount_code_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      ticket_tiers: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          display_name: string;
          description: string | null;
          price_cents: number;
          fee_cents: number;
          capacity: number;
          doors_start: string | null;
          doors_end: string | null;
          status: 'available' | 'sold_out' | 'hidden';
          stripe_price_id: string | null;
          sort_order: number;
        };
        Insert: Omit<Database['public']['Tables']['ticket_tiers']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['ticket_tiers']['Insert']>;
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          code: string;
          event_id: string;
          tier_id: string;
          holder_id: string | null;
          order_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          amount_cents: number;
          fee_cents: number;
          status: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
          purchased_at: string;
          used_at: string | null;
          checked_in_at: string | null;
          source: 'online' | 'door';
          metadata: Json;
          qr_data: string;
        };
        Insert: {
          id?: string;
          code: string;
          event_id: string;
          tier_id: string;
          holder_id?: string | null;
          order_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          amount_cents: number;
          fee_cents?: number;
          status?: 'valid' | 'used' | 'transferred' | 'refunded' | 'cancelled';
          purchased_at?: string;
          used_at?: string | null;
          checked_in_at?: string | null;
          source?: 'online' | 'door';
          metadata?: Json;
          qr_data: string;
        };
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          event_id: string | null;
          author_id: string;
          channel: 'general' | 'lineup' | 'recap' | 'help' | 'crew';
          title: string;
          body: string | null;
          is_anonymous: boolean;
          is_pinned: boolean;
          moderation_status: 'pending' | 'approved' | 'hidden' | 'draft' | 'rejected';
          moderation_note: string | null;
          media_urls: Json;
          reply_count: number;
          reaction_counts: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          author_id: string;
          channel: 'general' | 'lineup' | 'recap' | 'help' | 'crew';
          title: string;
          body?: string | null;
          is_anonymous?: boolean;
          is_pinned?: boolean;
          moderation_status?: 'pending' | 'approved' | 'hidden' | 'draft' | 'rejected';
          moderation_note?: string | null;
          media_urls?: Json;
          reply_count?: number;
          reaction_counts?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['posts']['Insert']>;
        Relationships: [];
      };
      moderation_actions: {
        Row: {
          id: string;
          post_id: string;
          moderator_id: string;
          action: 'approved' | 'rejected' | 'hidden' | 'deleted' | 'pinned' | 'unpinned';
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          moderator_id: string;
          action: 'approved' | 'rejected' | 'hidden' | 'deleted' | 'pinned' | 'unpinned';
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['moderation_actions']['Insert']>;
        Relationships: [];
      };
      replies: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          is_anonymous: boolean;
          reaction_counts: Json;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['replies']['Row'],
          'id' | 'reaction_counts' | 'created_at'
        > & {
          id?: string;
          reaction_counts?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['replies']['Insert']>;
        Relationships: [];
      };
      post_reactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          emoji: 'fire' | 'eyes' | 'heart' | 'music' | 'pray';
        };
        Insert: Omit<Database['public']['Tables']['post_reactions']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['post_reactions']['Insert']>;
        Relationships: [];
      };
      reply_reactions: {
        Row: {
          id: string;
          reply_id: string;
          user_id: string;
          emoji: 'fire' | 'eyes' | 'heart' | 'music' | 'pray';
        };
        Insert: Omit<Database['public']['Tables']['reply_reactions']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['reply_reactions']['Insert']>;
        Relationships: [];
      };
      ticket_transfers: {
        Row: {
          id: string;
          ticket_id: string;
          from_user_id: string;
          to_email: string;
          to_user_id: string | null;
          status: 'pending' | 'accepted' | 'expired' | 'cancelled';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          from_user_id: string;
          to_email: string;
          to_user_id?: string | null;
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
          expires_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ticket_transfers']['Insert']>;
        Relationships: [];
      };
      refund_requests: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          reason: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'processed';
          stripe_refund_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id: string;
          reason?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'processed';
          stripe_refund_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['refund_requests']['Insert']>;
        Relationships: [];
      };
      event_photos: {
        Row: {
          id: string;
          event_id: string;
          uploader_id: string;
          storage_path: string;
          public_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          uploader_id: string;
          storage_path: string;
          public_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['event_photos']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['notifications']['Row'],
          'id' | 'read' | 'created_at'
        > & {
          id?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
          source: string;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
          source?: string;
        };
        Update: Partial<Database['public']['Tables']['newsletter_subscribers']['Insert']>;
        Relationships: [];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          kind: string;
          value: number;
          max_uses: number | null;
          uses: number;
          event_id: string | null;
          active: boolean;
          expires_at: string | null;
          note: string | null;
          pool: 'crew' | 'press' | 'goodwill' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          kind?: string;
          value: number;
          max_uses?: number | null;
          uses?: number;
          event_id?: string | null;
          active?: boolean;
          expires_at?: string | null;
          note?: string | null;
          pool?: 'crew' | 'press' | 'goodwill' | null;
          created_at?: string;
        };
        Update: Partial<{
          code: string;
          kind: string;
          value: number;
          max_uses: number | null;
          uses: number;
          event_id: string | null;
          active: boolean;
          expires_at: string | null;
          note: string | null;
        }>;
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: string;
          reporter_id: string | null;
          post_id: string | null;
          reply_id: string | null;
          reason: string;
          status: 'open' | 'dismissed' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id?: string | null;
          post_id?: string | null;
          reply_id?: string | null;
          reason: string;
          status?: 'open' | 'dismissed' | 'resolved';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['content_reports']['Insert']>;
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          created_at: string;
          sent_at: string | null;
          status: 'queued' | 'sent' | 'failed';
          provider: string;
          provider_message_id: string | null;
          app: 'mobile' | 'admin';
          kind: string | null;
          project_id: string | null;
          to_address: string;
          subject: string;
          text_body: string | null;
          html_body: string | null;
          from_email: string | null;
          reply_to: string | null;
          error_message: string | null;
          meta: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          sent_at?: string | null;
          status: 'queued' | 'sent' | 'failed';
          provider?: string;
          provider_message_id?: string | null;
          app: 'mobile' | 'admin';
          kind?: string | null;
          project_id?: string | null;
          to_address: string;
          subject: string;
          text_body?: string | null;
          html_body?: string | null;
          from_email?: string | null;
          reply_to?: string | null;
          error_message?: string | null;
          meta?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['email_logs']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'email_logs_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      sync_discount_code_uses: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
