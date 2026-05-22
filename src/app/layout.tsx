import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./Guard/AuthProvider";





export const metadata: Metadata = {
  title: "Deal Na",
  description: "Real-time group voting app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
    
    >
      <body>
        <AuthProvider>
          {children}
          <div id="popup-root" />
        </AuthProvider>
      </body>
    </html>
  );
}
