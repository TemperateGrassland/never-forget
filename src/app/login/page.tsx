"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and sign-up
  const [email, setEmail] = useState(""); // Email state
  const [password, setPassword] = useState(""); // Password state
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirm password state
  const [firstName, setFirstName] = useState(""); // First name state
  const [lastName, setLastName] = useState(""); // Last name state
  const [phoneNumber, setPhoneNumber] = useState(""); // Phone number state
  const [dateOfBirth, setDateOfBirth] = useState(""); // Date of birth state
  const [errorMessage, setErrorMessage] = useState(""); // Error message state

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");

    if (!isLogin) {
      // Sign-up logic
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match. Please try again.");
        return;
      }

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            phoneNumber,
            dateOfBirth,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (errorData.errors) {
            const detailedErrors = errorData.errors.map((err: string) => `- ${err}`).join("\n");
            setErrorMessage(`Sign-up failed for the following reasons:\n${detailedErrors}`);
          } else if (errorData.message) {
            setErrorMessage(errorData.message);
          } else {
            setErrorMessage("Something went wrong. Please try again.");
          }

          return;
        }

        alert("Sign-up successful! Please log in.");
        toggleForm(); // Switch to login form
      } catch (err) {
        if (err instanceof Error) {
          setErrorMessage(`Failed to sign up: ${err.message}`);
        } else {
          setErrorMessage("An unknown error occurred during sign-up.");
        }
      }
    } else {
      // Login logic
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setErrorMessage(
            errorData.message || "Login failed. Please check your email and password."
          );
          return;
        }

        const data = await response.json();
        alert(`Welcome back, ${data.firstName || "user"}!`);
        // Optionally, store user info in state or localStorage
      } catch (err) {
        if (err instanceof Error) {
          setErrorMessage(`Login failed: ${err.message}`);
        } else {
          setErrorMessage("An unknown error occurred during login.");
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isLogin ? "Login to NeverForget" : "Sign Up for NeverForget"}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="mb-4">
                <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                  placeholder="Enter your first name"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                  placeholder="Enter your last name"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                  placeholder="Enter your phone number (optional)"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="dateOfBirth" className="block text-gray-700 font-medium mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-black"
                placeholder="Confirm your password"
              />
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 text-red-600 font-medium text-sm whitespace-pre-wrap">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleForm}
            className="text-indigo-600 font-medium hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
}