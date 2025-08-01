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
  if (loading) return <p className="text-center">Loading profile...</p>;

  // Get redirect message
  const message = searchParams.get("message");
  const from = searchParams.get("from");

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-28">
      {message === "phone-required" && from === "reminders" && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 rounded-md">
          <p className="text-blue-800 font-medium text-center">
            📱 Phone number required to access your dashboard
          </p>
          <p className="text-blue-600 text-sm text-center mt-1">
            We need your phone number to send WhatsApp reminders
          </p>
        </div>
      )}
      {(!user.firstName || !user.lastName || !user.phoneNumber) && (
        <p className="mb-4 text-center text-red-600 font-agrandir">
          Please complete your profile before moving on to set reminders.
        </p>
      )}
      <h1 className="text-2xl font-bold text-center text-black">Your Profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={user.firstName}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md text-black ${!user.firstName ? 'border-green-500 animate-pulse' : 'border-gray-300'}`}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={user.lastName}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md text-black ${!user.lastName ? 'border-green-500 animate-pulse' : 'border-gray-300'}`}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={user.email}
            className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-black"
            disabled
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium">Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            value={user.phoneNumber}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md text-black ${!user.phoneNumber ? 'border-green-500 animate-pulse' : 'border-gray-300'}`}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#25d366] text-black p-2 rounded-md hover:bg-blue-700"
          disabled={updating}
        >
          {updating ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-center mt-28">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}