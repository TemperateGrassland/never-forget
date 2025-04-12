import { signIn } from "next-auth/react";

export function LoginButton({ email }: { email?: string }) {
  const handleClick = async () => {
    // Pass email both as a parameter and as part of callbackUrl if needed.
    await signIn("email", {
      email: email,
      redirect: true,
      // Ensure email is passed as its own query parameter.
      callbackUrl: `/?email=${encodeURIComponent(email || "")}`,
    });
  };

  return (
    <button
      onClick={handleClick} 
      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md shadow-md transition duration-300"
    >
      Sign in with {email || "email"}
    </button>
  );
}