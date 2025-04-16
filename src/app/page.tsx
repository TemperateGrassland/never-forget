"use server";

import CheckUser from "./components/ui/CheckUser";
import { auth } from "@/auth";

export default async function Page() {
  const session = await auth();

  return (
    <>
    <div className="bg-white min-h-screen">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-48 object-contain mt-0"
    />
      <h1 className="text-center font-agrandir text-3xl text-black">helping you build strong habits</h1>

      <div className="flex flex-col items-center mt-4">
        {session?.user ? (
          <>
            <p> welcome to the club </p>
          </>
        ) : (
          <>
       <CheckUser />
          </>
        )}


      </div>
      </div>
    </>
  );
}