"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useAuth } from "../store/auth/useAuth";
import { supabase } from "../lib/supabase";
import { useUiStore } from "../store/useUiStore";
import { useMockAuth } from "../store/auth/useMockAuth";
import { access } from "fs";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession } = useAuth();
  const { mockUser } = useMockAuth();
  const { setLoading } = useUiStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const initilizeAuth = async () => {
      setLoading("loadingSession", true);

      try {
        if (mockUser) {
          console.log("Using mock authen");
          const { data, error } = await supabase
            .from("test_users")
            .select("*")
            .eq("id", mockUser.id)
            .single();

          if (error) {
            console.error("mock user error", error);
            throw error;
          }

          if (mountedRef.current) {
            const fakeSession = {
              access_token: "mock-token",
              refresh_token: "mock-refresh-token",
              user: {
                id: data?.id,
                email: data.email ?? `${mockUser.username}@mock.local`,
                user_metadata: {
                  name: data.username ?? mockUser.username,
                },
              },
            } as any;
            setSession(fakeSession);
            setUser(fakeSession.user);
            setLoading("loadingSession", false);
          }
        } else {
          console.log("Using real authentication");
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) {
            console.error("Session error", error);
          }

          if (mountedRef.current) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading("loadingSession", false);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setLoading("loadingSession", false);
        }
      } finally {
        setLoading("loadingSession", false);
      }
    };

    initilizeAuth()

    const { data : { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        if(mockUser) return 
        if(mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);
        }

        if(event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          setLoading('loadingSession', false)
        }
      }
    )
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [setUser , setSession , setLoading , mockUser]);
  return <>{children}</>;
}
