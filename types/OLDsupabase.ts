export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  pgbouncer: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth: {
        Args: {
          p_usename: string;
        };
        Returns: {
          username: string;
          password: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      divisions: {
        Row: {
          created_at: string;
          div_alt_leg_rep: string;
          div_alt_sec_treas: string;
          div_chaplin: string | null;
          div_fifth_vice_lc: string | null;
          div_first_alt_trustee: string;
          div_first_trustee: string;
          div_first_vice_lc: string;
          div_fourth_vice_lc: string | null;
          div_guide: string | null;
          div_leg_rep: string;
          div_local_chair: string;
          div_number: number;
          div_president: string;
          div_sec_treas: string;
          div_second_alt_trustee: string | null;
          div_second_trustee: string | null;
          div_second_vice_lc: string | null;
          div_third_alt_trustee: string | null;
          div_third_trustee: string | null;
          div_third_vice_lc: string | null;
          div_vice_president: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          div_alt_leg_rep: string;
          div_alt_sec_treas: string;
          div_chaplin?: string | null;
          div_fifth_vice_lc?: string | null;
          div_first_alt_trustee: string;
          div_first_trustee: string;
          div_first_vice_lc: string;
          div_fourth_vice_lc?: string | null;
          div_guide?: string | null;
          div_leg_rep: string;
          div_local_chair: string;
          div_number: number;
          div_president: string;
          div_sec_treas: string;
          div_second_alt_trustee?: string | null;
          div_second_trustee?: string | null;
          div_second_vice_lc?: string | null;
          div_third_alt_trustee?: string | null;
          div_third_trustee?: string | null;
          div_third_vice_lc?: string | null;
          div_vice_president: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          div_alt_leg_rep?: string;
          div_alt_sec_treas?: string;
          div_chaplin?: string | null;
          div_fifth_vice_lc?: string | null;
          div_first_alt_trustee?: string;
          div_first_trustee?: string;
          div_first_vice_lc?: string;
          div_fourth_vice_lc?: string | null;
          div_guide?: string | null;
          div_leg_rep?: string;
          div_local_chair?: string;
          div_number?: number;
          div_president?: string;
          div_sec_treas?: string;
          div_second_alt_trustee?: string | null;
          div_second_trustee?: string | null;
          div_second_vice_lc?: string | null;
          div_third_alt_trustee?: string | null;
          div_third_trustee?: string | null;
          div_third_vice_lc?: string | null;
          div_vice_president?: string;
          id?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          deleted: boolean | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone_number: string | null;
          pin_number: number | null;
          company_hire_date: string | null;
          engineer_date: string | null;
          division: Database["public"]["Enums"]["division"] | null;
          zone: Database["public"]["Enums"]["zone"] | null;
          role: Database["public"]["Enums"]["role"] | null;
          is_active: boolean | null;
          last_login: string | null;
          date_of_birth: string | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          updated_at?: string | null;
          deleted?: boolean | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          pin_number?: number | null;
          company_hire_date?: string | null;
          engineer_date?: string | null;
          division?: Database["public"]["Enums"]["division"] | null;
          zone?: Database["public"]["Enums"]["zone"] | null;
          role?: Database["public"]["Enums"]["role"] | null;
          is_active?: boolean | null;
          last_login?: string | null;
          date_of_birth?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          deleted?: boolean | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          pin_number?: number | null;
          company_hire_date?: string | null;
          engineer_date?: string | null;
          division?: Database["public"]["Enums"]["division"] | null;
          zone?: Database["public"]["Enums"]["zone"] | null;
          role?: Database["public"]["Enums"]["role"] | null;
          is_active?: boolean | null;
          last_login?: string | null;
          date_of_birth?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "members_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      division: "163" | "173" | "174" | "175" | "184" | "185" | "188" | "209" | "520";
      sys_seniority_type: "WC" | "DMIR" | "DWP" | "SYS1" | "EJ&E" | "SYS2";
      zone:
        | "zone 1"
        | "zone 2"
        | "zone 3"
        | "zone 4"
        | "zone 5"
        | "zone 6"
        | "zone 7"
        | "zone 8"
        | "zone 9"
        | "zone 10"
        | "zone 11"
        | "zone 12"
        | "zone 13";
      role: "user" | "division_admin" | "union_admin" | "application_admin" | "company_admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          }
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          }
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey";
            columns: ["bucket_id"];
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey";
            columns: ["upload_id"];
            referencedRelation: "s3_multipart_uploads";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
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

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;
