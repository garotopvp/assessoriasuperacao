import React, { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isMarketing: boolean;
  isComercial: boolean;
  isOperacional: boolean;
  isFinanceiro: boolean;
  subscriptionStatus: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: Record<string, unknown>; error: unknown }>;
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<{ data: Record<string, unknown>; error: unknown }>;
  signInWithGoogle: () => Promise<{ data: Record<string, unknown>; error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
