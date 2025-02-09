import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { getServerSession } from "next-auth";
// import AuthProvider from "./components/ui/AuthProvider";
// import NavMenu from "./components/ui/NavMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

import { SessionProvider } from "next-auth/react";

export default async function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
        <body>
        <main>{children}</main>
        </body>
      </html>  
    </SessionProvider> 
  );
}
