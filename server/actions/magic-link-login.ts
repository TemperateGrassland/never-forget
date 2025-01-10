"use server"

import { signIn } from "@/lib/auth" 

export default async function magicLinkLogin(formData: FormData) {
    await signIn("email", formData)
}