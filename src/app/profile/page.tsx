"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // User State
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    async function fetchProfile() {
      if (session?.user) {
        setLoading(true);
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setUser({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
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

      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    setUpdating(false);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-center text-black">Your Profile</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-gray-700 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={user.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-black"
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
            name="phone"
            value={user.phone}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md text-black"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-700"
          disabled={updating}
        >
          {updating ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}