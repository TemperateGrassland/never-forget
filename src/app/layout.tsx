import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
// import AuthProvider from "./components/ui/AuthProvider";
import NavMenu from "./components/ui/NavMenu";

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

export default async function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {

  const session = getServerSession();

  return (
    <html lang="en">
      <body>
        {/* <AuthProvider>
          <main className="mx-auto max-w-5xl text-2xl flex gap-2 text-white">
            <NavMenu />
            {children}
          </main>
        </AuthProvider> */}
      </body>
    </html>   
  );
}
