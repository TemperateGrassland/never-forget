import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import CookieConsent from "./components/ui/CookieConsent";

export const metadata: Metadata = {
  title: "NeverForget",
  description: "Improve your life, use NeverForget",
  icons: {
    icon: '/favicon.ico',
  },
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
        {/* <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-RG9V6NQR4C"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RG9V6NQR4C');
            `,
          }}
        /> */}

        <link
          href="https://fonts.googleapis.com/css2?family=Agrandir:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
        <body className="flex flex-col min-h-screen font-agrandir">
          <CookieConsent />
          <Navbar />
          <div className="flex flex-col justify-center items-center bg-white mb-2 text-black">
            <Logo />
          </div>

          <main className="flex-1">
            {children}
          </main>
          <Toaster position="bottom-right" />
          <Footer />
        </body>
      </html>  
    </SessionProvider>
  );
}