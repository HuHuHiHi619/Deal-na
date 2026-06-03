import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import AuthProvider from "./Guard/AuthProvider";
import Providers from "./Providers";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

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
    <html lang="th" className={fredoka.variable}>
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
