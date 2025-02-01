"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return <button onClick={() => signIn("email", {"callbackUrl": "http://localhost:3000/"})}>Sign in with Email</button>;
}

