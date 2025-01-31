"use server";

import { signIn, signOut } from "@/auth";


export const login = async () => {
    await signIn("email");
};


export const logout = async () => {
    await signOut();
};