import { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../../lib/supabase";

interface ProviderUserMetadata {
  // common fields
  avatar_url?: string;
  email?: string;
  email_verified?: boolean;
  full_name?: string;
  iss?: string;
  name?: string;
  picture?: string;
  provider_id?: string;
  sub?: string;

  // google 
  given_name?: string;
  family_name?: string;
  locale?: string;
}

type AuthProvider = 'facebook' | 'google' | 'email'
type FacebookOptions = never                         
type GoogleOptions   = never
type EmailOptions    = { email: string; password: string }
type ProviderOptions = {
  facebook: FacebookOptions
  google:   GoogleOptions
  email:    EmailOptions
}

export interface AuthUser extends User {
  user_metadata: ProviderUserMetadata;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
}

 interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;

  loginWithProvider: <P extends AuthProvider>(
    provider : P,
    options? : ProviderOptions[P]
  ) => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  
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

  loginWithProvider : async <P extends AuthProvider>(provider : P , options? : ProviderOptions[P]) => {
    switch (provider) {
      case 'facebook' : 
      case 'google' : 
        const { error : oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options : {
              redirectTo: `${window.location.origin}/room`,
          },
        });
        if (oauthError) throw oauthError;
      break;

      case 'email' :
        if (!options) throw new Error('Options are required for email login');
        const { email , password } = options 
        if(!email || !password ) throw new Error('Email and password are required');
        const { error : emailError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (emailError) throw emailError;
      break;
    }
  },

  loginWithFacebook : async () => {
    await useAuth.getState().loginWithProvider('facebook')
  },
  loginWithGoogle: async () => {
    await useAuth.getState().loginWithProvider('google');
  },
  loginWithEmail : async (email : string , password : string) => {
    await useAuth.getState().loginWithProvider('email' , { email , password })
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
}));
