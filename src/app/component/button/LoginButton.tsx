"use client";

import { useAuth } from "../../store/auth/useAuth";
import { Facebook } from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";


export default function LoginButton() {
const { loginWithFacebook , loginWithGoogle  } = useAuth();

const fb = useAsyncAction("loginWithFacebook", {
  onError: (err) => {
    console.log("Login with facebook error:", err);
  },
});
const gg = useAsyncAction("loginWithGoogle", {
  onError: (err) => {
    console.log("Login with facebook error:", err);
  },
});

const GoogleIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.1 2.35 30.07 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C14.65 11.53 19.82 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.57 2.96-2.24 5.33-4.75 6.95l7.98 6.19c4.69-4.42 7.42-10.8 7.42-18.51z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.98-6.19c-2.07 1.35-4.85 2.15-7.91 2.15-5.16 0-9.52-3.5-11.06-8.22L2.56 34.78C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

return (
  <>
    <div className="flex justify-center bg-blue-500 text-white cursor-pointer hover:scale-105 p-4 space-x-3 rounded-3xl transition-all ease-in-out duration-250 disabled:opacity-50">
      <Facebook />
      <button 
        onClick={() => fb.execute(() => loginWithFacebook())}
        disabled={fb.isLoading}
        >
        {fb.isLoading ? "Logging in..." : "Login with Facebook"}
      </button>
    </div>
    <div className="flex justify-center bg-gray-200 cursor-pointer hover:scale-105 p-4 space-x-3 rounded-3xl transition-all ease-in-out duration-250 disabled:opacity-50">
      <GoogleIcon/>
      <button 
        onClick={() => fb.execute(() => loginWithGoogle())}
        disabled={fb.isLoading}
        >
        {fb.isLoading ? "Logging in..." : "Login with Facebook"}
      </button>
    </div>
  </>
);

}
