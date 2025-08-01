"use client";

import { usePathname } from "next/navigation";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <body className={`flex flex-col min-h-screen font-agrandir ${isHomepage ? "" : "bg-white"}`}>
      {children}
    </body>
  );
}