'use client'
import { useMockAuth } from '@/app/store/auth/useMockAuth';
import { useRoom } from '@/app/store/room/useRoomStore';
import { useParams, useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react'

function RoomLayout({ children } : { children : React.ReactNode }) {

    const [ isJoining , setIsJoining ] = useState(false);
    const { roomCode } : { roomCode : string } = useParams();
    const { joinRoom, error, currentRoom , clearRoom } = useRoom();
    const { mockUser } = useMockAuth();
    const router = useRouter()

    useEffect(() => {
       
        if(!mockUser || !roomCode || isJoining) return
        if(currentRoom?.roomCode === roomCode) return
        
        setIsJoining(true)
        const userId = mockUser.id
        joinRoom(roomCode , userId)
        .then(res => {
            if(!res) {
                alert("Failed to join room")
                router.push("/")
            } 
        })
        .finally(() => {
            setIsJoining(false)
        })
    },[roomCode , mockUser , router , joinRoom , isJoining , currentRoom])

    useEffect(() => {
        return () => {
            console.log('Leaving room')
            clearRoom()
        }
    },[])
    
 // Loading state
  if (isJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl">Joining room {roomCode}...</h2>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-red-600 mb-4">
            {error || "Room not found"}
          </h2>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ✅ Render children (page.tsx, vote/page.tsx, result/page.tsx)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{currentRoom.title}</h1>
          <p className="text-gray-600 text-sm">
            Room Code:{" "}
            <span className="font-mono font-semibold">
              {currentRoom.roomCode}
            </span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer (Optional) */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-600">
          <p>Status: {currentRoom.status}</p>
          <p>Created: {new Date(currentRoom.createdAt).toLocaleString()}</p>
        </div>
      </footer>
    </div>
  );
}

export default RoomLayout