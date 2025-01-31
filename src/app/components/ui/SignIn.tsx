"use client";

import { signIn, signOut } from "next-auth/react";

export function LoginButton() {
  return <button onClick={() => signIn("email")}>Sign in with Email</button>;
}

export function LogoutButton() {
  return <button onClick={() => signOut()}>Sign out</button>;
}