"use client";

import { supabase } from '@/app/lib/supabase';
import React from 'react'

function TestUserLoginButton() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) window.location.href = '/room';
    else console.error(error.message);
  };

  return (
    <>
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded"
        />
        <button 
          type="submit"
          className="w-full bg-gray-600 text-white p-3 rounded"
        >
          Login with Email
        </button>
      </form>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-bold mb-2">🧪 Quick Test Login</p>
          <div className="space-y-2">
            {['test1@test.com', 'test2@test.com', 'test3@test.com'].map((testEmail) => (
              <button
                key={testEmail}
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithPassword({
                    email: testEmail,
                    password: 'test123',
                  });
                  if (!error) window.location.href = '/';
                  else console.error(error.message);
                }}
                className="w-full text-left p-2 bg-white border rounded hover:bg-gray-50 text-sm"
              >
                {testEmail}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default TestUserLoginButton;
