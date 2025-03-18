"use client";

import { useState, useEffect } from "react";
import { Reminder } from "@/types";

export default function DashboardTable() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Function to fetch reminders from the API
  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      if (!res.ok) throw new Error("Failed to fetch reminders");

      const data = await res.json();
      setReminders(data.reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    }
  };

  // Fetch reminders initially
  useEffect(() => {
    fetchReminders();
  }, []);

  // WebSocket Connection to Listen for Updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000"); // Replace with deployment URL

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === "newReminder") {
        fetchReminders(); // Re-fetch reminders on WebSocket event
      }
    };

    ws.onclose = () => console.log("WebSocket disconnected");
    // ws.onerror = (error) => console.error("WebSocket error:", error);

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">Reminders</h2>
      {reminders.length === 0 ? (
        <p>No reminders found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <tr key={reminder.id} className="border">
                <td className="border p-2">{reminder.title}</td>
                <td className="border p-2">{reminder.description || "N/A"}</td>
                <td className="border p-2">
                  {new Date(reminder.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}