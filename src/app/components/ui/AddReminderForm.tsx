'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const REMINDER_FREQUENCY = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function AddReminderForm() {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [frequency, setFrequency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestBody = {
        title,
        dueDate: dueDate ? dueDate.toISOString() : null,
        frequency,
      };

      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) throw new Error('Failed to add reminder');

      setTitle('');
      setDueDate(null);
      setFrequency('');
      setSuccess('🎉'); // ✅ Success message

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

  const showFrequencyStep = title.trim() !== '' && dueDate !== null;

  return (
    <form onSubmit={handleSubmit} className="p-4 border-2 border-[#25d366] rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-black">small gains, big wins</h2>
        {/* ✅ Success & Error Message Display */}
        {success && <p className="text-green-500 animate-spinGrowFade text-xl">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md text-black"
          placeholder="create new reminder..."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium text-secondary text-black mb-2">
          due date (optional)
        </label>
        <DatePicker
          selected={dueDate}
          onChange={(date) => setDueDate(date)}
          minDate={new Date()}
          className="w-full p-2 border rounded-md text-black"
          placeholderText="Select a due date (optional)"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
      </div>

      {showFrequencyStep && (
        <div
          className="mb-4 transition-opacity duration-500 ease-in-out opacity-100"
          style={{ animation: 'fadeIn 0.5s ease-in-out' }}
        >
          <label className="block font-medium text-secondary text-black mb-2">
            reminder frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full p-2 border rounded-md text-black"
            required
          >
            <option value="" disabled>
              Select frequency
            </option>
            {REMINDER_FREQUENCY.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="bg-[#25d366] hover:bg-[#128C7E] text-black p-2 rounded-md w-full transition-colors font-semibold"
        disabled={loading || (showFrequencyStep && frequency === '')}
      >
        {loading ? 'adding...' : 'add reminder'}
      </button>
    </form>
  );
}