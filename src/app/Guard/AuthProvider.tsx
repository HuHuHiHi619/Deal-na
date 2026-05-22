"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useAuth } from "../store/auth/useAuth";
import { supabase } from "../lib/supabase";
import { useUiStore } from "../store/useUiStore";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession  } = useAuth();
  const { setLoading } = useUiStore();
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if(initializedRef.current) return;
    
    initializedRef.current = true

    const initilizeAuth = async () => {
     
      try {
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
          }

      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading("loadingSession", false);
        }
      }
    };

    initilizeAuth()

    const { data : { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
      
        if(mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading('loadingSession', false)
      }
    )
    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [setUser, setSession, setLoading]);
  return <>{children}</>;
}
