'use client'; // This makes it a client component

import { useState } from 'react';

export default function AddReminderForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
      alert('Reminder added successfully');
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-2">Add New Reminder</h2>
      
      {error && <p className="text-red-500">{error}</p>}

      <div className="mb-2">
        <label className="block font-medium text-secondary">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md text-primary"
          required
        />
      </div>

      <div className="mb-2">
        <label className="block font-medium text-secondary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-md text-primary"
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