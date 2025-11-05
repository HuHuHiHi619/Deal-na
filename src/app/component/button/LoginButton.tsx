"use client";

import { useAuth } from "../../store/auth/useAuth";
import { Facebook } from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";


export default function LoginButton() {
const { loginWithFacebook } = useAuth();

const { execute, isLoading } = useAsyncAction("loginWithFacebook", {
  onError: (err) => {
    console.log("Login with facebook error:", err);
  },
});

const handleLogin = async () => {
  await execute(async () => {
    return await loginWithFacebook();
  });
};

return (
  <div className="flex justify-center bg-blue-500 text-white hover:scale-105 p-4 space-x-3 rounded-3xl transition-all ease-in-out duration-250 disabled:opacity-50">
    <Facebook />
    <button 
      onClick={handleLogin}
      disabled={isLoading}
    >
      {isLoading ? "Logging in..." : "Login with Facebook"}
    </button>
  </div>
);

}
