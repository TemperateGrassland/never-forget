"use client";

import { useState, useEffect } from "react";
import { Reminder } from "@/types";
import * as Ably from "ably";


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

  const deleteReminder = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete reminder");

      // Update state immediately before Ably event is received
      setReminders((prevReminders) => prevReminders.filter((reminder) => reminder.id !== id));
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  // Fetch reminders initially
  useEffect(() => {
    fetchReminders();
  }, []);

  // WebSocket Connection to Listen for Updates
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/ably-token" }); // Secure authentication
    const channel = client.channels.get("reminders");

    channel.subscribe("newReminder", (message) => {
      setReminders((prevReminders) => [message.data, ...prevReminders]);
    });

    // Listen for deleted reminders
    channel.subscribe("reminderDeleted", (message) => {
      setReminders((prevReminders) => prevReminders.filter((reminder) => reminder.id !== message.data.id));
    });

    return () => {
      channel.unsubscribe();
      client.close();
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
                <td className="border p-2">
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}