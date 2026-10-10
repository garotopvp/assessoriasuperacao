/**
 * Schemas de Validação com Zod
 *
 * Define estruturas de dados com validação forte para prevenir
 * injeção de dados maliciosos e garantir integridade dos dados.
 */

import { z } from "zod";

// Schema para criação de pedidos (produtos)
export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "ID do item é obrigatório"),
        name: z.string().min(1, "Nome do item é obrigatório").max(200),
        price: z.number().positive("Preço deve ser positivo").max(100000, "Preço muito alto"),
        quantity: z
          .number()
          .int("Quantidade deve ser inteiro")
          .positive()
          .min(1)
          .max(10, "Quantidade máxima: 10"),
        size: z.string().optional(),
      })
    )
    .min(1, "Pelo menos um item é obrigatório")
    .max(20, "Máximo 20 itens por pedido"),

  userId: z.string().uuid("userId deve ser um UUID válido"),

  customer: z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
    email: z.string().email("Email inválido"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, "Telefone inválido")
      .optional(),
  }),

  includeStripeFee: z.boolean().default(true),
  cancelUrl: z.string().url("cancelUrl deve ser uma URL válida").optional(),
});

// Schema para criação de assinaturas (planos)
export const CreateSubscriptionSchema = z.object({
  planId: z.enum(["mensal", "trimestral", "semestral", "anual", "plano_teste"], {
    errorMap: () => ({ message: "Plano inválido" }),
  }),

  userId: z.string().uuid("userId deve ser um UUID válido"),

  includeStripeFee: z.boolean().default(true),
  cancelUrl: z.string().url("cancelUrl deve ser uma URL válida").optional(),
});

// Schema para login
export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Schema para registro com senha forte
export const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100).optional(),
  dicaSenha: z.string().max(100, "Dica muito longa (máx 100 caracteres)").optional(),
});

// Schema para atualização de perfil
export const UpdateProfileSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
});

// Schema para criação de produto (admin)
export const CreateProductSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200),
  preco: z.number().positive("Preço deve ser positivo").max(100000),
  descricao: z.string().min(10, "Descrição muito curta").max(1000),
  detalhes: z.string().max(5000).optional(),
  tamanhos: z.array(z.string()).min(1, "Pelo menos um tamanho é obrigatório"),
  categoria: z.enum(["roupas", "acessorios", "calcados", "outros"]).optional(),
  estoque: z.record(z.string(), z.number().int().min(0)).optional(),
});

// Type exports para uso no TypeScript
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
