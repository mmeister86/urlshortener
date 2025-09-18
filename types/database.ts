export interface Database {
  public: {
    Tables: {
      urls: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          original_url: string;
          short_code: string;
          custom_code: string | null;
          title: string | null;
          description: string | null;
          expires_at: string | null;
          is_active: boolean;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          original_url: string;
          short_code: string;
          custom_code?: string | null;
          title?: string | null;
          description?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          original_url?: string;
          short_code?: string;
          custom_code?: string | null;
          title?: string | null;
          description?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          user_id?: string | null;
        };
      };
      clicks: {
        Row: {
          id: string;
          created_at: string;
          url_id: string;
          ip_address: string | null;
          user_agent: string | null;
          referer: string | null;
          country: string | null;
          city: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          url_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          country?: string | null;
          city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          url_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          country?: string | null;
          city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        };
      };
    };
  };
}
