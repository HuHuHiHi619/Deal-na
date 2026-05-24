"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../store/auth/useAuth";
import { supabase } from "../lib/supabase";
import { useUiStore } from "../store/useUiStore";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setSession } = useAuth();
  const { setLoading } = useUiStore();

  useEffect(() => {
    setLoading("loadingSession", true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading("loadingSession", false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  return <>{children}</>;
}
