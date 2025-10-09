"use client";

import { supabase } from "../lib/supabase";
import { useAuth } from "../store/auth/useAuth";

export default function LoginButton() {
  const { loginWithFacebook } = useAuth();
  return (
    <button className="bg-blue-500 text-white p-4" onClick={loginWithFacebook}>
      Login with Facebook
    </button>
  );
}
