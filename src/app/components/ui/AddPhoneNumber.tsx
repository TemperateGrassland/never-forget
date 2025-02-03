"use client";

import { useState } from "react";

export default function UpdatePhone() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdatePhone() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/user/update-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setMessage("Phone number updated successfully!");
    } else {
      setMessage(data.error || "Failed to update phone number");
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-3">Update Phone Number</h2>
      <input
        type="text"
        placeholder="Enter phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="w-full p-2 border rounded text-black"
      />
      <button
        onClick={handleUpdatePhone}
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded mt-2"
      >
        {loading ? "Updating..." : "Update"}
      </button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}