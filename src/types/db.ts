export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          telegram_user_id: number | null;
          display_name: string;
          avatar_url: string;
          role: Database["public"]["Enums"]["app_user_role"];
          about: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          telegram_user_id?: number | null;
          display_name?: string;
          avatar_url?: string;
          role?: Database["public"]["Enums"]["app_user_role"];
          about?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          telegram_user_id?: number | null;
          display_name?: string;
          avatar_url?: string;
          role?: Database["public"]["Enums"]["app_user_role"];
          about?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string | null;
          name: string;
          description: string;
          emoji: string;
          sort_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug?: string | null;
          name: string;
          description?: string;
          emoji?: string;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string | null;
          name?: string;
          description?: string;
          emoji?: string;
          sort_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          title: string;
          description: string;
          price_text: string;
          status: Database["public"]["Enums"]["product_status"];
          materials: string[];
          is_visible: boolean;
          is_available: boolean;
          is_giveaway_eligible: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          title: string;
          description?: string;
          price_text?: string;
          status?: Database["public"]["Enums"]["product_status"];
          materials?: string[];
          is_visible?: boolean;
          is_available?: boolean;
          is_giveaway_eligible?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          title?: string;
          description?: string;
          price_text?: string;
          status?: Database["public"]["Enums"]["product_status"];
          materials?: string[];
          is_visible?: boolean;
          is_available?: boolean;
          is_giveaway_eligible?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          storage_path: string | null;
          is_primary: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          storage_path?: string | null;
          is_primary?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          storage_path?: string | null;
          is_primary?: boolean;
          position?: number;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          profile_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          profile_id?: string;
          product_id?: string;
          created_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          brand_slogan: string;
          hero_badge: string;
          mascot_emoji: string;
          store_description: string;
          welcome_text: string;
          info_block: string;
          promo_title: string;
          promo_text: string;
          admin_telegram_ids: number[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_name?: string;
          brand_slogan?: string;
          hero_badge?: string;
          mascot_emoji?: string;
          store_description?: string;
          welcome_text?: string;
          info_block?: string;
          promo_title?: string;
          promo_text?: string;
          admin_telegram_ids?: number[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string;
          brand_slogan?: string;
          hero_badge?: string;
          mascot_emoji?: string;
          store_description?: string;
          welcome_text?: string;
          info_block?: string;
          promo_title?: string;
          promo_text?: string;
          admin_telegram_ids?: number[];
          updated_at?: string;
        };
      };
      seller_settings: {
        Row: {
          id: string;
          seller_name: string;
          avatar_url: string;
          short_bio: string;
          brand_story: string;
          philosophy: string;
          materials_focus: string;
          telegram_username: string;
          telegram_link: string;
          contact_text: string;
          about_seller: string;
          city: string;
          purchase_message_template: string;
          purchase_button_label: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_name?: string;
          avatar_url?: string;
          short_bio?: string;
          brand_story?: string;
          philosophy?: string;
          materials_focus?: string;
          telegram_username?: string;
          telegram_link?: string;
          contact_text?: string;
          about_seller?: string;
          city?: string;
          purchase_message_template?: string;
          purchase_button_label?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_name?: string;
          avatar_url?: string;
          short_bio?: string;
          brand_story?: string;
          philosophy?: string;
          materials_focus?: string;
          telegram_username?: string;
          telegram_link?: string;
          contact_text?: string;
          about_seller?: string;
          city?: string;
          purchase_message_template?: string;
          purchase_button_label?: string;
          updated_at?: string;
        };
      };
      giveaway_sessions: {
        Row: {
          id: string;
          title: string;
          description: string;
          status: Database["public"]["Enums"]["giveaway_session_status"];
          draw_at: string;
          spin_duration_ms: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          status?: Database["public"]["Enums"]["giveaway_session_status"];
          draw_at: string;
          spin_duration_ms?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          status?: Database["public"]["Enums"]["giveaway_session_status"];
          draw_at?: string;
          spin_duration_ms?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      giveaway_items: {
        Row: {
          id: string;
          session_id: string;
          product_id: string;
          slots: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          product_id: string;
          slots?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          product_id?: string;
          slots?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      giveaway_results: {
        Row: {
          id: string;
          session_id: string;
          product_id: string;
          profile_id: string | null;
          winner_nickname: string;
          spin_duration_ms: number;
          won_at: string;
          note: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          product_id: string;
          profile_id?: string | null;
          winner_nickname?: string;
          spin_duration_ms?: number;
          won_at?: string;
          note?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          product_id?: string;
          profile_id?: string | null;
          winner_nickname?: string;
          spin_duration_ms?: number;
          won_at?: string;
          note?: string;
        };
      };
      homepage_sections: {
        Row: {
          id: string;
          section_type: string;
          title: string;
          subtitle: string;
          content: string;
          linked_category_id: string | null;
          linked_product_ids: string[];
          is_enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_type: string;
          title?: string;
          subtitle?: string;
          content?: string;
          linked_category_id?: string | null;
          linked_product_ids?: string[];
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_type?: string;
          title?: string;
          subtitle?: string;
          content?: string;
          linked_category_id?: string | null;
          linked_product_ids?: string[];
          is_enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_user_role: "user" | "admin";
      product_status: "new" | "popular" | "sold_out";
      giveaway_session_status: "draft" | "active" | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
}
