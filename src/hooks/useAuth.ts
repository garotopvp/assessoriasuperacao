import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isMarketing, setIsMarketing] = useState(false);
  const [isComercial, setIsComercial] = useState(false);
  const [isOperacional, setIsOperacional] = useState(false);
  const [isFinanceiro, setIsFinanceiro] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  // Nova verificação: consulta todas as permissões em user_roles
  const checkRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        logger.error("Error checking roles (user_roles):", error);
        setIsAdmin(false);
        setIsTeacher(false);
        setIsMarketing(false);
        setIsComercial(false);
        setIsOperacional(false);
        setIsFinanceiro(false);
        return;
      }

      logger.info("Roles check result (user_roles):", { rawData: data });

      const roles = data ? data.map((r) => r.role) : [];

      setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
      setIsTeacher(roles.includes("teacher"));
      setIsMarketing(
        roles.includes("marketing") || roles.includes("admin") || roles.includes("super_admin")
      );
      setIsComercial(
        roles.includes("comercial") || roles.includes("admin") || roles.includes("super_admin")
      );
      setIsOperacional(
        roles.includes("operacional") || roles.includes("admin") || roles.includes("super_admin")
      );
      setIsFinanceiro(
        roles.includes("financeiro") || roles.includes("admin") || roles.includes("super_admin")
      );
    } catch (err) {
      logger.error("Error checking roles (user_roles):", err);
      setIsAdmin(false);
      setIsTeacher(false);
      setIsMarketing(false);
      setIsComercial(false);
      setIsOperacional(false);
      setIsFinanceiro(false);
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        logger.error("Error checking subscription status:", error);
        return;
      }

      if (data) {
        setSubscriptionStatus(data.subscription_status);
      }
    } catch (err) {
      logger.error("Error fetching profile:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async (session: Session | null) => {
      if (!mounted) return;
      try {
        setSession(session);
        setUser(session?.user ?? null);

        if (session && window.location.hash.includes("access_token")) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        if (session?.user) {
          await Promise.all([
            checkRoles(session.user.id),
            checkSubscriptionStatus(session.user.id),
          ]);
        } else {
          setIsAdmin(false);
          setIsTeacher(false);
          setIsMarketing(false);
          setIsComercial(false);
          setIsOperacional(false);
          setIsFinanceiro(false);
          setSubscriptionStatus(null);
        }
      } catch (error) {
        logger.error("Error inside initAuth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      initAuth(session);
    });

    // THEN check for existing session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          logger.error("Error getting session:", error);
          if (mounted) setLoading(false);
          return;
        }
        initAuth(session);
      })
      .catch((error) => {
        logger.error("Exception getting session:", error);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkRoles, checkSubscriptionStatus]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsTeacher(false);
      setIsMarketing(false);
      setIsComercial(false);
      setIsOperacional(false);
      setIsFinanceiro(false);
      setSubscriptionStatus(null);
    }
    return { error };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    isTeacher,
    isMarketing,
    isComercial,
    isOperacional,
    isFinanceiro,
    subscriptionStatus,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resendConfirmationEmail,
  };
}
