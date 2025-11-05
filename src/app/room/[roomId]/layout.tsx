"use client";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
 
  return (
   <div className="min-h-screen bg-gradient-to-br from-rose-50/40 to-lavender-50/40 backdrop-blur-md">
      {children}
    </div>
  );
}
