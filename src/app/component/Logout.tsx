"use client";

import { supabase } from "../lib/supabase";
import { useAuth } from "../store/auth/useAuth";

export default function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button className="bg-red-500 text-white p-4" onClick={signOut}>
      Logout
    </button>
  );
}
