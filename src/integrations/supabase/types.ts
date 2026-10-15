export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      articulos: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string
          id: number
          precio_unitario: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion: string
          id?: never
          precio_unitario: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string
          id?: never
          precio_unitario?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          created_at: string
          cuenta_contable: string
          id: number
          nombre: string
          rnc_cedula: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          cuenta_contable?: string
          id?: never
          nombre: string
          rnc_cedula: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          cuenta_contable?: string
          id?: never
          nombre?: string
          rnc_cedula?: string
        }
        Relationships: []
      }
      condiciones_pago: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string
          dias: number
          id: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion: string
          dias?: number
          id?: never
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string
          dias?: number
          id?: never
        }
        Relationships: []
      }
      factura_detalle: {
        Row: {
          articulo_id: number
          cantidad: number
          factura_id: number
          id: number
          precio: number
          subtotal: number
        }
        Insert: {
          articulo_id: number
          cantidad: number
          factura_id: number
          id?: never
          precio: number
          subtotal: number
        }
        Update: {
          articulo_id?: number
          cantidad?: number
          factura_id?: number
          id?: never
          precio?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "factura_detalle_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "v_facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          cliente_id: number
          comentario: string
          comision: number
          comision_pct: number
          condicion_id: number
          created_at: string
          created_by: string | null
          dias: number
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          id: number
          total: number
          vendedor_id: number
        }
        Insert: {
          cliente_id: number
          comentario?: string
          comision?: number
          comision_pct?: number
          condicion_id: number
          created_at?: string
          created_by?: string | null
          dias?: number
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: never
          total?: number
          vendedor_id: number
        }
        Update: {
          cliente_id?: number
          comentario?: string
          comision?: number
          comision_pct?: number
          condicion_id?: number
          created_at?: string
          created_by?: string | null
          dias?: number
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          id?: never
          total?: number
          vendedor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_condicion_id_fkey"
            columns: ["condicion_id"]
            isOneToOne: false
            referencedRelation: "condiciones_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          nombre?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          activo: boolean
          comision: number
          created_at: string
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          comision?: number
          created_at?: string
          id?: never
          nombre: string
        }
        Update: {
          activo?: boolean
          comision?: number
          created_at?: string
          id?: never
          nombre?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_factura_lineas: {
        Row: {
          articulo: string | null
          articulo_id: number | null
          cantidad: number | null
          cliente: string | null
          cliente_id: number | null
          condicion: string | null
          condicion_id: number | null
          estado: string | null
          factura_id: number | null
          fecha: string | null
          id: number | null
          precio: number | null
          subtotal: number | null
          vendedor: string | null
          vendedor_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "factura_detalle_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factura_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "v_facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_condicion_id_fkey"
            columns: ["condicion_id"]
            isOneToOne: false
            referencedRelation: "condiciones_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_facturas: {
        Row: {
          cliente: string | null
          cliente_id: number | null
          comentario: string | null
          comision: number | null
          comision_pct: number | null
          condicion: string | null
          condicion_id: number | null
          created_at: string | null
          created_by: string | null
          dias: number | null
          estado: string | null
          fecha: string | null
          fecha_vencimiento: string | null
          id: number | null
          rnc_cedula: string | null
          total: number | null
          vendedor: string | null
          vendedor_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_condicion_id_fkey"
            columns: ["condicion_id"]
            isOneToOne: false
            referencedRelation: "condiciones_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anular_factura: { Args: { p_id: number }; Returns: undefined }
      crear_factura: {
        Args: {
          p_cliente: number
          p_comentario: string
          p_condicion: number
          p_fecha: string
          p_lineas: Json
          p_vendedor: number
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "facturador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "facturador"],
    },
  },
} as const
