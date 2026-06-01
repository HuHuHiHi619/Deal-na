import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./Guard/AuthProvider";
import Providers from "./Providers";

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
    <html lang="th">
      <body>
        <Providers>
          <AuthProvider>
            {children}
            <div id="popup-root" />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
