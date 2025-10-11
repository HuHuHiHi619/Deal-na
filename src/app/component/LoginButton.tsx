"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../store/auth/useAuth";
import { Facebook } from "lucide-react";

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
    <div className="flex justify-center bg-blue-500 text-white hover:scale-105 p-4 space-x-3 rounded-3xl transition-all ease-in-out duration-250">
      <Facebook />

      <button className=" " onClick={handleLogin}>
        Login with Facebook
      </button>
    </div>
  );
}
