'use client'
import AuthGuard from "../Guard/AuthGuard";


export default function RoomParentLayout({ children } : { children: React.ReactNode }) {
 
  return(
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}