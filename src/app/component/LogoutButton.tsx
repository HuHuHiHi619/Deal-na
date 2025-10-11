"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../store/auth/useAuth";

export default function LogoutButton() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <button className="bg-lavender-700 text-white p-4" onClick={handleLogout}>
      Logout
    </button>
  );
}
