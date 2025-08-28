'use client';

import { useState, useEffect } from 'react';
import { useReminderContext } from '../../../context/ReminderContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const REMINDER_FREQUENCY = [
  { label: 'None (one-time reminder)', value: 'NONE' },
  { label: 'Daily - remind me every day', value: 'DAILY' },
  { label: 'Weekly - you want to be reminded about this every week', value: 'WEEKLY' },
  { label: 'Monthly - for events that repeat once a month', value: 'MONTHLY' },
  { label: 'Yearly - birthdays and anniversaries', value: 'YEARLY' }
];

export default function AddReminderForm() {
  const { selectedReminder, setSelectedReminder, refetchReminders } = useReminderContext();  
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [frequency, setFrequency] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If editing, populate fields from selectedReminder
  useEffect(() => {
    if (selectedReminder) {
      setTitle(selectedReminder.title || '');
      setDueDate(selectedReminder.dueDate ? new Date(selectedReminder.dueDate) : null);
      setFrequency((selectedReminder.frequency || '').toUpperCase());
    } else {
      setTitle('');
      setDueDate(null);
      setFrequency('');
    }
  }, [selectedReminder]);

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

      let res;
      if (selectedReminder && selectedReminder.id) {
        // Editing existing reminder
        res = await fetch(`/api/reminders/${selectedReminder.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Creating new reminder
        res = await fetch('/api/reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!res.ok) throw new Error(selectedReminder ? 'Failed to update reminder' : 'Failed to add reminder');

      setTitle('');
      setDueDate(null);
      setFrequency('');
      setSuccess('🎉');

      // Reset selectedReminder after submit
      setSelectedReminder(null);
      // Refresh reminders in the dashboard
      refetchReminders?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(selectedReminder ? 'Failed to update reminder. Please try again.' : 'Failed to add reminder. Please try again.');

      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-2 border-[#25d366] rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-black">small gains, big wins</h2>
        {/* ✅ Success & Error Message Display */}
        {success && <p className="text-green-500 animate-spinGrowFade text-xl">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <div className="mb-4">
        <label className="block font-medium text-secondary text-black mb-2">
          reminder
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-md text-black placeholder-gray-500 bg-white"
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
          className="w-full p-2 border rounded-md text-black placeholder-gray-500 bg-white"
          placeholderText="Select a due date (optional)"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
      </div>

      <div className="mb-6">
        <label className="block font-medium text-secondary text-black mb-2">
          reminder frequency
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full p-2 border rounded-md text-black bg-white"
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
      <button
        type="submit"
        className="bg-[#25d366] hover:bg-[#128C7E] text-white p-2 rounded-md w-full transition-colors font-semibold"
        disabled={loading || frequency === ''}
      >
        {loading
          ? (selectedReminder ? 'updating...' : 'adding...')
          : (selectedReminder ? 'update reminder' : 'add reminder')}
      </button>
      {selectedReminder && (
        <button
          type="button"
          className="mt-2 bg-gray-200 hover:bg-gray-300 text-black p-2 rounded-md w-full transition-colors font-semibold"
          onClick={() => setSelectedReminder(null)}
        >
          Cancel edit
        </button>
      )}
    </form>
  );
}