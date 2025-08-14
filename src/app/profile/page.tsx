"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // User State
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch profile data from API
  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return;

      setLoading(true);
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch profile data");

        const data = await res.json();
        setUser({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [session]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Handle Profile Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setUpdating(false);
    }
  };

  // Show loading state
  if (loading) return <p className="text-center text-black">Loading profile...</p>;

  // Get redirect message
  const message = searchParams.get("message");
  const from = searchParams.get("from");

  return (
    <div className="min-h-screen flex flex-col items-center mx-auto justify-center px-4 sm:px-6 md:px-8 lg:px-16 pt-20 sm:pt-24 md:pt-28 pb-8">
      <div className="w-full max-w-2xl">
        {message === "phone-required" && from === "reminders" && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-l-4 border-[#25d366] rounded-r-md">
            <p className="text-gray-800 font-medium text-sm sm:text-base">
              📱 Phone number required to access your dashboard
            </p>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              We need your phone number to send WhatsApp reminders
            </p>
          </div>
        )}
        
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 leading-tight">
            complete your profile
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-4 sm:mb-6 max-w-xl leading-relaxed">
            {(!user.firstName || !user.lastName || !user.phoneNumber) 
              ? "just a few details to get your daily reminders started"
              : "manage your profile information"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">First Name</label>
              <input
                type="text"
                name="firstName"
                value={user.firstName}
                onChange={handleChange}
                className={`w-full p-3 sm:p-4 border-2 rounded-md text-black bg-white text-base sm:text-lg ${!user.firstName ? 'border-[#25d366] animate-pulse' : 'border-gray-300 focus:border-[#25d366]'} focus:outline-none transition-colors`}
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={user.lastName}
                onChange={handleChange}
                className={`w-full p-3 sm:p-4 border-2 rounded-md text-black bg-white text-base sm:text-lg ${!user.lastName ? 'border-[#25d366] animate-pulse' : 'border-gray-300 focus:border-[#25d366]'} focus:outline-none transition-colors`}
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Email</label>
            <input
              type="email"
              name="email"
              value={user.email}
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-md bg-gray-50 text-black text-base sm:text-lg"
              disabled
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 sm:mb-2 text-sm sm:text-base">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={user.phoneNumber}
              onChange={handleChange}
              className={`w-full p-3 sm:p-4 border-2 rounded-md text-black bg-white text-base sm:text-lg ${!user.phoneNumber ? 'border-[#25d366] animate-pulse' : 'border-gray-300 focus:border-[#25d366]'} focus:outline-none transition-colors`}
              placeholder="Enter your WhatsApp number"
              required
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-1">We will use this to send your daily reminders</p>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-[#25d366] text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-md shadow hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updating}
          >
            {updating ? "updating profile..." : "save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-center text-black mt-28">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}