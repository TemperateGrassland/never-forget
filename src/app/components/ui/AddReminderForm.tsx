'use client'; // This makes it a client component

import { useState } from 'react';

export default function AddReminderForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) throw new Error('Failed to add reminder');

      setTitle('');
      setDescription('');
      setSuccess('Reminder added successfully!'); // ✅ Success message

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to add reminder. Please try again.'); // ✅ Error message

      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Add New Reminder</h2>
        {/* ✅ Success & Error Message Display */}
        {success && <p className="text-green-500">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>

      <div className="mb-2">
        <label className="block font-medium text-secondary">What do you want to remember?</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md text-black"
          required
        />
      </div>

      <div className="mb-2">
        <label className="block font-medium text-secondary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md text-black"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded-md"
        disabled={loading}
      >
        {loading ? 'Adding...' : 'Add Reminder'}
      </button>
    </form>
  );
}