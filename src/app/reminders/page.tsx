"use client";

import { useState } from "react";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
}


export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description, scheduledAt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Failed to create reminder.");
        return;
      }

      const newReminder = await response.json();
      setReminders((prevReminders) => [...prevReminders, newReminder]);
      setSuccessMessage("Reminder created successfully!");
      setTitle("");
      setDescription("");
      setScheduledAt("");
    } catch (error) {
      setErrorMessage("An error occurred. Please try again.");
      console.error("Error creating reminder:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-md">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">NeverForget</h1>
          <p className="text-gray-700">The tool for managing WhatsApp reminders.</p>
        </header>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a New Reminder</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Reminder title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Details about the reminder"
              ></textarea>
            </div>

            <div>
              <label htmlFor="scheduledAt" className="block text-gray-700 font-medium mb-1">
                Scheduled At
              </label>
              <input
                type="datetime-local"
                id="scheduledAt"
                name="scheduledAt"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {errorMessage && (
              <p className="text-red-600 font-medium text-sm">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-green-600 font-medium text-sm">{successMessage}</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Reminder
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Reminders</h2>
          {reminders.length === 0 ? (
            <p className="text-gray-600">No reminders yet. Start by adding one!</p>
          ) : (
            <ul className="space-y-4">
              {reminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-md border"
                >
                  <h3 className="text-lg font-medium text-gray-800">
                    {reminder.title}
                  </h3>
                  <p className="text-gray-600">{reminder.description || "No description"}</p>
                  <p className="text-sm text-gray-500">
                    Scheduled for: {new Date(reminder.scheduledAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}