import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NeverForget",
  description: "Improve your life, use NeverForget",
};

import { SessionProvider } from "next-auth/react";
import Navbar from "./components/ui/NavBar";

export default async function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
        <body>
        <Navbar />
        <main>{children}</main>
        </body>
      </html>  
    </SessionProvider>
  );
}
