"use client";

import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function handleSaveReminder() {
    if (!selectedDate || !title) {
      setMessage("Please select a date and enter a title.");
      return;
    }

    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, scheduledAt: selectedDate }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage("Reminder saved successfully!");
    } else {
      setMessage(data.error || "Error saving reminder.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-3">Select a Date</h2>
      <Calendar onChange={setSelectedDate} value={selectedDate} className="text-black" />
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded mt-2 text-black"
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded mt-2 text-black"
      />
      <button
        onClick={handleSaveReminder}
        className="w-full bg-blue-500 text-white p-2 rounded mt-2"
      >
        Save Reminder
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}