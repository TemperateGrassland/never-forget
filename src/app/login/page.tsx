"use server";

import CheckUser from "../components/ui/CheckUser";

export default async function Page() {

  return (
    <>
    <div className="flex flex-col items-center gap-y-6 bg-white min-h-screen">
    <img
      src="/NeverForgetLogo.svg"
      alt="Never Forget Banner"
      className="w-full max-h-96 object-contain mt-0"
    />
      <h1 className="font-agrandir text-3xl text-[#25D366]">building stronger habits</h1>
       <CheckUser />
      </div>
    </>
  );
}