"use client";

import { supabase } from "@/app/lib/supabase";
import React, { useState } from "react";

function TestUserLoginButton() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error , setError] = useState<string | null>(null)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const THROTTLE_MS = 2000
  

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null)
    
    if(!email || !password) {
      setError('Email and password are required')
      return
    }

    const now = Date.now()
    if(now - lastSubmitTime < THROTTLE_MS) {
      setError('Please wait before submitting another login')
      return
    }

    setLastSubmitTime(now)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) window.location.href = "/room";
      else console.error(error.message);
    } catch (err : unknown) {
      console.error("Login with email error:", err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message)
    }
  };

  return (
    <>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setError(null)
            setEmail(e.target.value)}
          } 
          className="w-full p-3 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setError(null)
            setPassword(e.target.value)}
          } 
          className="w-full p-3 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-gray-600 text-white p-3 rounded cursor-pointer hover:bg-gray-700"
        >
          Login with Email
        </button>
      </form>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-bold mb-2">🧪 Quick Test Login</p>
          <div className="space-y-2">
            {["test1@test.com", "test2@test.com", "test3@test.com"].map(
              (testEmail) => (
                <button
                  key={testEmail}
                  onClick={async () => {
                    const { error } = await supabase.auth.signInWithPassword({
                      email: testEmail,
                      password: "test123",
                    });
                    if (!error) window.location.href = "/";
                    else console.error(error.message);
                  }}
                  className="w-full text-left p-2 bg-white border rounded hover:bg-gray-50 text-sm"
                >
                  {testEmail}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TestUserLoginButton;
