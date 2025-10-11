"use client";

import { ReactNode, useEffect } from "react";
import { useAuth } from "../store/auth/useAuth";
import { supabase } from "../lib/supabase";
import { useUiStore } from "../store/useUiStore";
import { useMockAuth } from "../store/auth/useMockAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession } = useAuth();
  const { mockUser } = useMockAuth();
  const { setLoading } = useUiStore();

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      setLoading("loadingSession", true);

      if (mockUser) {
        const { data, error } = await supabase
          .from("test_user")
          .select("*")
          .eq("id", mockUser.id)
          .single();

        if (error) throw error;
        if (mounted) {
          const fakeSession = {
            access_token: "mock-token",
            refresh_token: "mock-refresh",
            user: {
              id: data.id,
              email: data.email ?? `${mockUser.username}@mock.local`,
              user_metadata: { name: data.username ?? mockUser.username },
            },
          } as any;
          setSession(fakeSession);
          setUser(fakeSession.user);
        }
      }

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error(error);
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      }
    };
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }

      if (event !== "INITIAL_SESSION") setLoading("loadingSession", false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setSession, setLoading]);
  return <>{children}</>;
}
