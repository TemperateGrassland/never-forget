"use server";

import CheckUser from "./components/ui/CheckUser";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  return (
    <>
    <div className="flex flex-col items-center gap-y-6 bg-white min-h-screen">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-48 object-contain mt-0"
    />
      <h1 className="font-agrandir text-3xl text-[#25D366] font-style: italic">helping you build strong habits</h1>
       <CheckUser />
      </div>
    </>
  );
}