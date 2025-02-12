"use client";

import { ReminderFrequency } from "@prisma/client";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [frequency, setFrequency] = useState<ReminderFrequency>(ReminderFrequency.DAILY);

  async function handleSaveReminder() {
    if (!selectedDate || !title) {
      setMessage("Please select a date and enter a title.");
      return;
    }

    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, scheduledAt: selectedDate, frequency }),
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
      <Calendar
  onChange={(value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof Date) {
      setSelectedDate(value[0]); // Pick the first date in range
    } else {
      setSelectedDate(null);
    }
  }}
  value={selectedDate}
  locale="en-GB"
  className="text-black"
/>
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
      {/* ✅ Frequency Selection with Radio Buttons */}
      <div className="mt-2">
        <p className="font-bold">Reminder Frequency</p>
        {Object.values(ReminderFrequency).map((option) => (
          <label key={option} className="block">
            <input
            type="radio"
            name="frequency"
            value={option}
            checked={frequency === option}
            onChange={() => setFrequency(option as ReminderFrequency)} // ✅ Explicitly cast to ReminderFrequency
            className="mr-2"
          />
            {option}
          </label>
        ))}
      </div>
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