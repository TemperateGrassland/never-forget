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
import { Toaster } from "react-hot-toast";
import Footer from "./components/ui/Footer";
import Logo from "./components/ui/Logo";

export default async function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Agrandir:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
        <body className={`flex flex-col min-h-screen ${geistSans.variable} ${geistMono.variable} font-agrandir`}>
          <Navbar />
          <div className="flex flex-col justify-center items-center bg-white mb-4 text-black">
            <Logo />
          </div>
          {/* <div className="flex flex-col justify-center bg-white mb-0 text-black">
              <img
                src="/NeverForgetLogo.svg"
                alt="Never Forget Banner"
                className="w-full max-h-96 object-contain mt-0"
              />
          </div> */}
          <main className="flex-grow">
            {children}
          </main>
          <Toaster position="bottom-right" />
          <Footer />
        </body>
      </html>  
    </SessionProvider>
  );
}