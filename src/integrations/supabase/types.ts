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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          payload: Json | null
          response: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          payload?: Json | null
          response?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          payload?: Json | null
          response?: string | null
        }
        Relationships: []
      }
      artigos: {
        Row: {
          ativo: boolean | null
          author: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          ordem: number | null
          read_time: string | null
          slug: string
          tag: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          ordem?: number | null
          read_time?: string | null
          slug: string
          tag?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          author?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          ordem?: number | null
          read_time?: string | null
          slug?: string
          tag?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          distance_meters: number | null
          id: string
          latitude: number
          longitude: number
          student_phone: string
          training_day: string | null
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          id?: string
          latitude: number
          longitude: number
          student_phone: string
          training_day?: string | null
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          id?: string
          latitude?: number
          longitude?: number
          student_phone?: string
          training_day?: string | null
        }
        Relationships: []
      }
      bot_flow_nodes: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          node_key: string
          options: Json | null
          position_x: number | null
          position_y: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          node_key: string
          options?: Json | null
          position_x?: number | null
          position_y?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          node_key?: string
          options?: Json | null
          position_x?: number | null
          position_y?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      broadcast_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          id: string
          message: string
          read_count: number | null
          scheduled_at: string | null
          sent_count: number | null
          status: string
          target_audience: Json
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          message: string
          read_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string
          target_audience: Json
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          id?: string
          message?: string
          read_count?: number | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string
          target_audience?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_campaign_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_recipients: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          read_at: string | null
          sent_at: string | null
          status: string
          student_phone: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          student_phone: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
          student_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_analytics: {
        Row: {
          active_sessions: number | null
          admin_messages: number | null
          avg_response_time_seconds: number | null
          bot_messages: number | null
          closed_sessions: number | null
          created_at: string | null
          date: string
          id: string
          negative_sentiment_count: number | null
          neutral_sentiment_count: number | null
          positive_sentiment_count: number | null
          student_messages: number | null
          total_messages: number | null
          total_sessions: number | null
        }
        Insert: {
          active_sessions?: number | null
          admin_messages?: number | null
          avg_response_time_seconds?: number | null
          bot_messages?: number | null
          closed_sessions?: number | null
          created_at?: string | null
          date: string
          id?: string
          negative_sentiment_count?: number | null
          neutral_sentiment_count?: number | null
          positive_sentiment_count?: number | null
          student_messages?: number | null
          total_messages?: number | null
          total_sessions?: number | null
        }
        Update: {
          active_sessions?: number | null
          admin_messages?: number | null
          avg_response_time_seconds?: number | null
          bot_messages?: number | null
          closed_sessions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          negative_sentiment_count?: number | null
          neutral_sentiment_count?: number | null
          positive_sentiment_count?: number | null
          student_messages?: number | null
          total_messages?: number | null
          total_sessions?: number | null
        }
        Relationships: []
      }
      debug_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          message: string
          source: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message: string
          source: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string
          source?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          active: boolean | null
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          max_discount_amount: number | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          id?: string
          max_discount_amount?: number | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_discount_amount?: number | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      feedback_reminders_log: {
        Row: {
          channel: string | null
          email: string
          email_type: string | null
          id: string
          sent_at: string
          user_id: string | null
          week_start_date: string
        }
        Insert: {
          channel?: string | null
          email: string
          email_type?: string | null
          id?: string
          sent_at?: string
          user_id?: string | null
          week_start_date: string
        }
        Update: {
          channel?: string | null
          email?: string
          email_type?: string | null
          id?: string
          sent_at?: string
          user_id?: string | null
          week_start_date?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          category: string | null
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          status: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          status?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      financial_expenses: {
        Row: {
          amount: number
          bank_account: string | null
          category: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          paid_at: string | null
          receipt_url: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          category?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          receipt_url?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      financial_revenue: {
        Row: {
          amount: number
          bank_account: string | null
          category: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          description: string
          id: string
          receipt_url: string | null
          received_at: string
          source: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          category?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          description: string
          id?: string
          receipt_url?: string | null
          received_at: string
          source?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          category?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          description?: string
          id?: string
          receipt_url?: string | null
          received_at?: string
          source?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          scheduled_for: string
          session_id: string | null
          status: string | null
          student_phone: string
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for: string
          session_id?: string | null
          status?: string | null
          student_phone: string
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for?: string
          session_id?: string | null
          status?: string | null
          student_phone?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_enrollments: {
        Row: {
          completed_at: string | null
          current_step: number | null
          enrolled_at: string | null
          funnel_id: string | null
          id: string
          status: string
          student_phone: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          funnel_id?: string | null
          id?: string
          status?: string
          student_phone: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          funnel_id?: string | null
          id?: string
          status?: string
          student_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_enrollments_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_steps: {
        Row: {
          created_at: string | null
          delay_days: number
          funnel_id: string | null
          id: string
          message: string
          step_order: number
        }
        Insert: {
          created_at?: string | null
          delay_days: number
          funnel_id?: string | null
          id?: string
          message: string
          step_order: number
        }
        Update: {
          created_at?: string | null
          delay_days?: number
          funnel_id?: string | null
          id?: string
          message?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_images: {
        Row: {
          created_at: string | null
          id: string
          pagina: string
          posicao: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pagina: string
          posicao?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pagina?: string
          posicao?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          emitted_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          status: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          emitted_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          emitted_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "recurring_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_image: string | null
          product_name: string
          product_size: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_image?: string | null
          product_name: string
          product_size?: string | null
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_image?: string | null
          product_name?: string
          product_size?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          correlation_id: string | null
          created_at: string
          customer_email: string
          customer_name: string | null
          id: string
          items: Json | null
          openpix_correlation_id: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_status: string | null
          shipping_address: Json | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total: number
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          customer_email: string
          customer_name?: string | null
          id?: string
          items?: Json | null
          openpix_correlation_id?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total: number
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          id?: string
          items?: Json | null
          openpix_correlation_id?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_status?: string | null
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total?: number
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean | null
          category: string
          code: string | null
          created_at: string | null
          description: string | null
          discount: string
          id: string
          image_url: string | null
          name: string
          position: number | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount: string
          id?: string
          image_url?: string | null
          name: string
          position?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          discount?: string
          id?: string
          image_url?: string | null
          name?: string
          position?: number | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      pending_admin_roles: {
        Row: {
          created_at: string | null
          email: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          cta: string | null
          description: string | null
          features: string[] | null
          hidden: boolean | null
          highlight: boolean | null
          id: string
          monthly_price: string | null
          name: string
          position: number | null
          price: number
          savings: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          cta?: string | null
          description?: string | null
          features?: string[] | null
          hidden?: boolean | null
          highlight?: boolean | null
          id: string
          monthly_price?: string | null
          name: string
          position?: number | null
          price: number
          savings?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          cta?: string | null
          description?: string | null
          features?: string[] | null
          hidden?: boolean | null
          highlight?: boolean | null
          id?: string
          monthly_price?: string | null
          name?: string
          position?: number | null
          price?: number
          savings?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      poll_responses: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          option_text: string | null
          poll_id: string | null
          student_phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          option_text?: string | null
          poll_id?: string | null
          student_phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          option_text?: string | null
          poll_id?: string | null
          student_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          auto_send: boolean | null
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          options: Json
          question: string
          starts_at: string | null
          status: string
          target_audience: string | null
          title: string
        }
        Insert: {
          auto_send?: boolean | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          options: Json
          question: string
          starts_at?: string | null
          status?: string
          target_audience?: string | null
          title: string
        }
        Update: {
          auto_send?: boolean | null
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          question?: string
          starts_at?: string | null
          status?: string
          target_audience?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          detalhes: string | null
          estoque: Json | null
          id: number
          imagem: string | null
          imagem_principal: string | null
          imagens: string[] | null
          nome: string
          ordem: number
          preco: number
          tabela_tamanhos: string | null
          tamanhos: string[] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          detalhes?: string | null
          estoque?: Json | null
          id: number
          imagem?: string | null
          imagem_principal?: string | null
          imagens?: string[] | null
          nome: string
          ordem: number
          preco: number
          tabela_tamanhos?: string | null
          tamanhos?: string[] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          detalhes?: string | null
          estoque?: Json | null
          id?: number
          imagem?: string | null
          imagem_principal?: string | null
          imagens?: string[] | null
          nome?: string
          ordem?: number
          preco?: number
          tabela_tamanhos?: string | null
          tamanhos?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          blocked_at: string | null
          cep: string | null
          cidade: string | null
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          dica_senha: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          is_admin: boolean | null
          nome_completo: string | null
          sisrun_bot_error: string | null
          sisrun_bot_status: string | null
          squad_id: string | null
          subscription_status: string | null
          telefone: string | null
          tem_conta_sisrun: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dica_senha?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          is_admin?: boolean | null
          nome_completo?: string | null
          sisrun_bot_error?: string | null
          sisrun_bot_status?: string | null
          squad_id?: string | null
          subscription_status?: string | null
          telefone?: string | null
          tem_conta_sisrun?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          cep?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          dica_senha?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          is_admin?: boolean | null
          nome_completo?: string | null
          sisrun_bot_error?: string | null
          sisrun_bot_status?: string | null
          squad_id?: string | null
          subscription_status?: string | null
          telefone?: string | null
          tem_conta_sisrun?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_profiles_fk"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_weekly_feedbacks_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          message: string
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords: string[]
          message: string
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          message?: string
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      race_registrations: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          pace: string | null
          payment_status: string | null
          phone: string | null
          race_id: string
          selected_distance: string | null
          status: string | null
          tshirt_size: string | null
          updated_at: string | null
          used_coupon: string | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          pace?: string | null
          payment_status?: string | null
          phone?: string | null
          race_id: string
          selected_distance?: string | null
          status?: string | null
          tshirt_size?: string | null
          updated_at?: string | null
          used_coupon?: string | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          pace?: string | null
          payment_status?: string | null
          phone?: string | null
          race_id?: string
          selected_distance?: string | null
          status?: string | null
          tshirt_size?: string | null
          updated_at?: string | null
          used_coupon?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_registrations_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          available_distances: string[] | null
          available_paces: string[] | null
          created_at: string | null
          description: string | null
          event_date: string
          external_link: string | null
          id: string
          image_url: string | null
          location: string | null
          price: number | null
          registration_deadline: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available_distances?: string[] | null
          available_paces?: string[] | null
          created_at?: string | null
          description?: string | null
          event_date: string
          external_link?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          registration_deadline?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available_distances?: string[] | null
          available_paces?: string[] | null
          created_at?: string | null
          description?: string | null
          event_date?: string
          external_link?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          registration_deadline?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "race_registrations_race_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_subscriptions: {
        Row: {
          amount: number
          auto_billing_enabled: boolean | null
          canceled_at: string | null
          created_at: string | null
          id: string
          last_payment_at: string | null
          next_billing_date: string
          plan_id: string | null
          plan_name: string | null
          started_at: string | null
          status: string
          student_email: string
          student_name: string
          student_phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          auto_billing_enabled?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          id?: string
          last_payment_at?: string | null
          next_billing_date: string
          plan_id?: string | null
          plan_name?: string | null
          started_at?: string | null
          status?: string
          student_email: string
          student_name: string
          student_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          auto_billing_enabled?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          id?: string
          last_payment_at?: string | null
          next_billing_date?: string
          plan_id?: string | null
          plan_name?: string | null
          started_at?: string | null
          status?: string
          student_email?: string
          student_name?: string
          student_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "recurring_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "recurring_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_funnels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_enrollments_funnel_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          scheduled_for: string
          sent_at: string | null
          status: string
          student_phone: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          student_phone: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          student_phone?: string
        }
        Relationships: []
      }
      squad_notices: {
        Row: {
          active: boolean | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          important: boolean | null
          squad_id: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          important?: boolean | null
          squad_id?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          important?: boolean | null
          squad_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_notices_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      student_anamnesis: {
        Row: {
          accepted_ip: string | null
          altura: number | null
          carga_horaria: string | null
          created_at: string
          data_nascimento: string | null
          dias_favoraveis: string[] | null
          frequencia_semanal: number | null
          hipertensao_diabetes: string | null
          historico_lesoes_cirurgias: string | null
          id: string
          medicamento_controlado: string | null
          nivel_corrida: number | null
          objetivo_principal: string | null
          pace_atual: string | null
          peso: number | null
          profissao: string | null
          restricao_fisica: string | null
          terms_accepted: boolean | null
          terms_version: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          uso_gps_app: string | null
        }
        Insert: {
          accepted_ip?: string | null
          altura?: number | null
          carga_horaria?: string | null
          created_at?: string
          data_nascimento?: string | null
          dias_favoraveis?: string[] | null
          frequencia_semanal?: number | null
          hipertensao_diabetes?: string | null
          historico_lesoes_cirurgias?: string | null
          id?: string
          medicamento_controlado?: string | null
          nivel_corrida?: number | null
          objetivo_principal?: string | null
          pace_atual?: string | null
          peso?: number | null
          profissao?: string | null
          restricao_fisica?: string | null
          terms_accepted?: boolean | null
          terms_version?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          uso_gps_app?: string | null
        }
        Update: {
          accepted_ip?: string | null
          altura?: number | null
          carga_horaria?: string | null
          created_at?: string
          data_nascimento?: string | null
          dias_favoraveis?: string[] | null
          frequencia_semanal?: number | null
          hipertensao_diabetes?: string | null
          historico_lesoes_cirurgias?: string | null
          id?: string
          medicamento_controlado?: string | null
          nivel_corrida?: number | null
          objetivo_principal?: string | null
          pace_atual?: string | null
          peso?: number | null
          profissao?: string | null
          restricao_fisica?: string | null
          terms_accepted?: boolean | null
          terms_version?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          uso_gps_app?: string | null
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_alert: boolean | null
          note: string
          student_phone: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_alert?: boolean | null
          note: string
          student_phone: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_alert?: boolean | null
          note?: string
          student_phone?: string
        }
        Relationships: []
      }
      subscription_invoices: {
        Row: {
          abacate_payment_id: string | null
          amount: number
          created_at: string | null
          due_date: string
          id: string
          last_reminder_at: string | null
          paid_at: string | null
          payment_link: string | null
          reminder_count: number | null
          sent_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          abacate_payment_id?: string | null
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          last_reminder_at?: string | null
          paid_at?: string | null
          payment_link?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          abacate_payment_id?: string | null
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          last_reminder_at?: string | null
          paid_at?: string | null
          payment_link?: string | null
          reminder_count?: number | null
          sent_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "recurring_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_internal: boolean | null
          media_type: string | null
          media_url: string | null
          sender_type: string
          session_id: string
          status: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_type: string
          session_id: string
          status?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
          session_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_sessions: {
        Row: {
          admin_phone: string | null
          created_at: string
          id: string
          last_interaction: string
          sector: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          status: string
          student_phone: string
          summary: string | null
          tags: string[] | null
          trial_date: string | null
          trial_time: string | null
        }
        Insert: {
          admin_phone?: string | null
          created_at?: string
          id?: string
          last_interaction?: string
          sector?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string
          student_phone: string
          summary?: string | null
          tags?: string[] | null
          trial_date?: string | null
          trial_time?: string | null
        }
        Update: {
          admin_phone?: string | null
          created_at?: string
          id?: string
          last_interaction?: string
          sector?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          status?: string
          student_phone?: string
          summary?: string | null
          tags?: string[] | null
          trial_date?: string | null
          trial_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_session_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "support_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_session_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          category: string
          created_at: string
          details: Json | null
          id: string
          level: string
          message: string
          user_id: string | null
        }
        Insert: {
          action: string
          category: string
          created_at?: string
          details?: Json | null
          id?: string
          level: string
          message: string
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          level?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_feedbacks: {
        Row: {
          adherence_level: number | null
          comments: string | null
          created_at: string
          feeling_level: number | null
          id: string
          improvement_suggestions: string | null
          intensity_level: number | null
          missed_workout_reason: string | null
          pain_area: string[] | null
          pain_details: string | null
          pain_discomfort: boolean | null
          pain_intensity: number | null
          user_id: string
          week_start_date: string | null
        }
        Insert: {
          adherence_level?: number | null
          comments?: string | null
          created_at?: string
          feeling_level?: number | null
          id?: string
          improvement_suggestions?: string | null
          intensity_level?: number | null
          missed_workout_reason?: string | null
          pain_area?: string[] | null
          pain_details?: string | null
          pain_discomfort?: boolean | null
          pain_intensity?: number | null
          user_id: string
          week_start_date?: string | null
        }
        Update: {
          adherence_level?: number | null
          comments?: string | null
          created_at?: string
          feeling_level?: number | null
          id?: string
          improvement_suggestions?: string | null
          intensity_level?: number | null
          missed_workout_reason?: string | null
          pain_area?: string[] | null
          pain_details?: string | null
          pain_discomfort?: boolean | null
          pain_intensity?: number | null
          user_id?: string
          week_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_weekly_feedbacks_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
