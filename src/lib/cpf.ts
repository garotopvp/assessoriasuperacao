import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";

/**
 * Valida CPF chamando a Edge Function do Supabase
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @param userId - ID do usuário (opcional, para permitir o próprio CPF)
 * @returns Promise com { valid: boolean, error?: string, normalizedCPF?: string }
 */
export async function validateCPF(
  cpf: string,
  userId?: string
): Promise<{ valid: boolean; error?: string; normalizedCPF?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("validate-cpf", {
      body: { cpf, userId },
    });

    if (error) {
      logger.error("Error validating CPF:", error);
      return { valid: false, error: "Erro ao validar CPF" };
    }

    return data;
  } catch (error) {
    logger.error("Exception validating CPF:", error);
    return { valid: false, error: "Erro ao validar CPF" };
  }
}

/**
 * Valida formato de CPF localmente (sem consultar banco)
 * @param cpf - CPF a ser validado
 * @returns boolean
 */
export function validateCPFFormat(cpf: string): boolean {
  const cleaned = cpf.replace(/[^\d]/g, "");

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  if (firstDigit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  if (secondDigit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Formata CPF para exibição (000.000.000-00)
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, "");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Remove formatação do CPF
 * @param cpf - CPF formatado
 * @returns CPF sem formatação (apenas números)
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/[^\d]/g, "");
}
