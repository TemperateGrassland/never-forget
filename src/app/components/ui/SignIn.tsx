"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
  <button onClick={() => signIn("email", { callbackUrl: "/" })}
  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md shadow-md transition duration-300"
  >
    Sign in</button>
  )
}