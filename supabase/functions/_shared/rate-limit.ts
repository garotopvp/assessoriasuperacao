/**
 * Rate Limiting Middleware para Edge Functions
 *
 * Protege contra abuso de API limitando número de requisições por usuário/IP
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface RateLimitConfig {
  points: number; // Número de requisições permitidas
  duration: number; // Janela de tempo em segundos
  blockDuration?: number; // Tempo de bloqueio após exceder limite (segundos)
}

interface RateLimitRecord {
  count: number;
  first_request: number;
  blocked_until?: number;
}

/**
 * Verifica e aplica rate limiting
 *
 * @param key - Identificador único (userId, IP, etc)
 * @param action - Nome da ação sendo limitada
 * @param config - Configuração de limite
 * @throws Error se limite for excedido
 */
export async function checkRateLimit(
  key: string,
  action: string,
  config: RateLimitConfig = { points: 10, duration: 60, blockDuration: 300 }
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("[RATE-LIMIT] Supabase not configured, skipping rate limit");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = Date.now();
  const identifier = `${action}:${key}`;

  // Buscar registro de rate limit
  const { data: existing, error } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    console.error("[RATE-LIMIT] Error checking rate limit:", error);
    return; // Falha aberta - não bloquear em caso de erro
  }

  const record: RateLimitRecord | null = existing
    ? {
        count: existing.count,
        first_request: new Date(existing.first_request).getTime(),
        blocked_until: existing.blocked_until
          ? new Date(existing.blocked_until).getTime()
          : undefined,
      }
    : null;

  // Verificar se está bloqueado
  if (record?.blocked_until && now < record.blocked_until) {
    const remainingSeconds = Math.ceil((record.blocked_until - now) / 1000);
    throw new Error(`Muitas requisições. Tente novamente em ${remainingSeconds} segundos.`);
  }

  // Calcular janela de tempo
  const windowMs = config.duration * 1000;
  const windowStart = now - windowMs;

  // Se não existe registro ou janela expirou, criar novo
  if (!record || record.first_request < windowStart) {
    await supabase.from("rate_limits").upsert({
      identifier,
      count: 1,
      first_request: new Date(now).toISOString(),
      blocked_until: null,
    });
    return;
  }

  // Incrementar contador
  const newCount = record.count + 1;

  // Verificar se excedeu limite
  if (newCount > config.points) {
    const blockedUntil = config.blockDuration
      ? new Date(now + config.blockDuration * 1000).toISOString()
      : null;

    await supabase
      .from("rate_limits")
      .update({
        count: newCount,
        blocked_until: blockedUntil,
      })
      .eq("identifier", identifier);

    const blockDuration = config.blockDuration || config.duration;
    throw new Error(
      `Limite de requisições excedido. Tente novamente em ${blockDuration} segundos.`
    );
  }

  // Atualizar contador
  await supabase.from("rate_limits").update({ count: newCount }).eq("identifier", identifier);
}

/**
 * Limpa registros expirados de rate limit (chamada periódica)
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !supabaseServiceKey) return;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("rate_limits").delete().lt("first_request", oneDayAgo);
}
