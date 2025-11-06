"use client";

import LoginButton from "./component/button/LoginButton";
import { HeartHandshake } from 'lucide-react';
import TestUserLoginButton from "./component/button/TestUserLoginButton";

export default function Home() {
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* CONTAINER */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h1 className="flex items-center justify-center space-x-2 text-3xl md:text-4xl font-bold text-rose-600">
            <p>DEAL</p>
            <HeartHandshake size={34} />
            <p>NA</p>
          </h1>
          <p className=" md:text-lg text-rose-400">
            PREPARE YOURSELF FOR DECISION
          </p>
          <p className="text-sm md:text-base text-gray-600">
            CREATE TOPIC THEN VOTE
          </p>
        </div>

        

        {/* BUTTON */}
        <div className="space-y-3 text-center">
          <TestUserLoginButton />
          <LoginButton />    
        </div>
      </div>
    </div>
  );
}
