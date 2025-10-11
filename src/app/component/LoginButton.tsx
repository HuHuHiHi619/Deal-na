"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../store/auth/useAuth";

export default function LoginButton() {
  const { loginWithFacebook } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    try {
      loginWithFacebook();
      router.push("/room");
    } catch (error) {
      console.error("Login with facebook error :", error);
    }
  };
  
  return (
    <button className="bg-blue-500 text-white p-4" onClick={handleLogin}>
      Login with Facebook
    </button>
  );
}
