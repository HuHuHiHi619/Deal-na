import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../../lib/supabase";
import { useUiStore } from "../useUiStore";

export interface FacebookUserMetadata {
  avatar_url?: string;
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  picture?: string;
  provider_id?: string;
  sub?: string;
}

export interface AuthUser extends User {
  user_metadata: FacebookUserMetadata;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  loginWithFacebook : () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
 

  setUser: (user: AuthUser | null) => set({ user }),
  setSession: (session: Session | null) =>
    set({
      session,
      user: session?.user,
    }),
 
  loginWithFacebook: async () => {
    useUiStore.getState().setLoading('authLoading', true)
    try{
        const { data , error } = await supabase.auth.signInWithOAuth({
            provider : 'facebook',
            options : {
                redirectTo : 'http://localhost:3000/room'
            }
        })
        if(error) throw error
        console.log(data)
    }catch(error){
        console.error(error)
    } finally {
       useUiStore.getState().setLoading('authLoading', false)
    }
  },

  signOut: async () => {
    useUiStore.getState().setLoading('authLoading', true)
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        set({ user: null, session: null });
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      useUiStore.getState().setLoading('authLoading', false)
    }
  },
}));
