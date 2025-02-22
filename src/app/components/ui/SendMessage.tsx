"use client";

import { useState } from "react";

export default function SendMessage() {
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  async function handleSendMessage() {
    setLoading(true);

    try {
      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello from the client!" }),
      });

      const data = await response.json();
      setResponseMessage(data.message || "Message sent!");

    } catch (error) {
      console.error("Error sending message:", error);
      setResponseMessage("Failed to send message");
    }

    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleSendMessage}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
      
      {responseMessage && <p className="mt-2">{responseMessage}</p>}
    </div>
  );
}