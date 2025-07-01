'use client';

import { useState, useEffect } from 'react';
import { Reminder } from '@/types';
import * as Ably from 'ably';
import AnimatedRow from './AnimatedRow';
import TodoItem from './TodoItem';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function DashboardTable() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDateById, setSelectedDateById] = useState<{ [id: string]: Date | null }>({});
  const [selectedDropdownById, setSelectedDropdownById] = useState<{ [id: string]: string }>({});
  const [emojiVisibleById, setEmojiVisibleById] = useState<{ [id: string]: boolean }>({});

const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');

      const data = await res.json();
      setReminders(data.reminders);

      // Initialize selected dates and dropdowns
      const initialDateById: { [id: string]: Date | null } = {};
      const initialDropdownById: { [id: string]: string } = {};

      data.reminders.forEach((reminder: Reminder) => {
        if (reminder.dueDate) {
          const dueDate = new Date(reminder.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const normalizedDue = new Date(dueDate);
          normalizedDue.setHours(0, 0, 0, 0);

          const isSameDay = (a: Date, b: Date) => a.getTime() === b.getTime();

          if (isSameDay(normalizedDue, today)) {
            initialDropdownById[reminder.id] = 'today';
          } else if (isSameDay(normalizedDue, tomorrow)) {
            initialDropdownById[reminder.id] = 'tomorrow';
          } else {
            initialDropdownById[reminder.id] = 'date';
          }

          initialDateById[reminder.id] = normalizedDue;
        }
      });

      setSelectedDateById(initialDateById);
      setSelectedDropdownById(initialDropdownById);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const playFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    const tickSound = new Audio('/bing.wav');
    tickSound.volume = 0.4;
    tickSound.currentTime = 0;
    tickSound.play().catch(() => {});
  };

  const deleteReminder = (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;

    // Optimistically remove from UI
    setReminders((prev) => prev.filter((r) => r.id !== id));

    let isUndone = false;

    toast((t) => (
      <div className="flex items-center gap-4">
        {/* TODO it would be cool to add in a selection of positive feedback here */}
        <span>Nice work!</span>
        <button
          className="bg-blue-600 text-black text-sm px-2 py-1 rounded"
          onClick={() => {
            toast.dismiss(t.id);
            setReminders((prev) => [reminder, ...prev]);
            isUndone = true;
          }}
        >
          Undo
        </button>
      </div>
    ), { duration: 5000 });

    // Wait before actually deleting
    setTimeout(async () => {
      if (!isUndone) {
        try {
          await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
          // playFeedback();
        } catch (err) {
          console.error("Error deleting reminder:", err);
        }
      }
    }, 5000);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: '/api/ably-token' });
    const channel = client.channels.get('reminders');

    channel.subscribe('newReminder', (message) => {
      setReminders((prev) => [message.data, ...prev]);
    });

    channel.subscribe('reminderDeleted', (message) => {
      setReminders((prev) =>
        prev.filter((reminder) => reminder.id !== message.data.id)
      );
    });

    return () => {
      channel.unsubscribe();
      // commented out as this was causing an error 
      // client.close();
    };
  }, []);

  return (
    <div className="overflow-x-auto w-full">
      <h2 className="text-xl font-bold mb-4 text-black"></h2>
      {reminders.length === 0 ? (
        <p className='text-black'>No reminders found.</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300 text-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-black">Reminder</th>
              {/* <th className="border p-2 text-left text-black">Description</th>
              <th className="border p-2 text-left text-black">Created</th> */}
              <th className="border p-2 text-left text-black">To Do By</th>
              <th className="border p-2 text-left text-black"> To Done?</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <AnimatedRow
                key={reminder.id}
                id={reminder.id}
                isDeleting={deletingId === reminder.id}
                onAnimationEnd={() => {}}
              >
                <TodoItem
                  task={reminder.title}
                  initialCompleted={false}
                />
                <td className="border p-2">
                  {selectedDropdownById[reminder.id] !== "date" ? (
                    <select
                      value={selectedDropdownById[reminder.id] || ""}
                      className="border rounded px-2 py-1 text-black bg-white text-base"
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedDropdownById((prev) => ({ ...prev, [reminder.id]: value }));

                        let newDate: Date | null = null;
                        if (value === "today") {
                          newDate = new Date();
                        } else if (value === "tomorrow") {
                          newDate = new Date();
                          newDate.setDate(newDate.getDate() + 1);
                        } else if (value === "clear") {
                          // Clear due date
                          setSelectedDateById((prev) => ({ ...prev, [reminder.id]: null }));
                          fetch(`/api/reminders/${reminder.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dueDate: null }),
                          }).catch((err) => {
                            console.error('Failed to clear due date:', err);
                          });
                          return;
                        }

                        if (newDate) {
                          setSelectedDateById((prev) => ({ ...prev, [reminder.id]: newDate }));
                          setEmojiVisibleById((prev) => ({ ...prev, [reminder.id]: true }));
                          setTimeout(() => {
                            setEmojiVisibleById((prev) => ({ ...prev, [reminder.id]: false }));
                          }, 1500);
                          fetch(`/api/reminders/${reminder.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dueDate: newDate.toISOString().split('T')[0] }),
                          }).catch((err) => {
                            console.error('Failed to update due date:', err);
                          });
                        }
                      }}
                    >
                      <option value="" disabled>Select</option>
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="date">Date...</option>
                      <option value="clear">Clear</option>
                    </select>
                  ) : (
                    <div className="flex flex-col items-start gap-1">
                      <DatePicker
                        selected={selectedDateById[reminder.id] || null}
                        onChange={(date) => {
                          setSelectedDateById((prev) => ({ ...prev, [reminder.id]: date }));
                          setEmojiVisibleById((prev) => ({ ...prev, [reminder.id]: true }));
                          setTimeout(() => {
                            setEmojiVisibleById((prev) => ({ ...prev, [reminder.id]: false }));
                          }, 1500);
                          fetch(`/api/reminders/${reminder.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dueDate: date ? date.toISOString().split('T')[0] : null }),
                          }).catch((err) => {
                            console.error('Failed to update due date:', err);
                          });
                        }}
                        minDate={new Date()}
                        className="border p-1 rounded"
                        placeholderText="Pick a date"
                        dateFormat="dd/MM/yyyy"
                      />
                      <button
                        className="text-sm text-blue-600 underline"
                        onClick={() =>
                          setSelectedDropdownById((prev) => ({ ...prev, [reminder.id]: '' }))
                        }
                      >
                        Reset date
                      </button>
                    </div>
                  )}
                  {emojiVisibleById[reminder.id] && (
                    <span className="ml-2 animate-spinGrowFade text-xl">📅</span>
                  )}
                </td>
                {/* <td className="border p-2">
                  {new Date(reminder.createdAt).toLocaleDateString()}
                </td> */}
                <td className="border p-2">
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-2xl"
                  >
                    ✅
                  </button>
                </td>
              </AnimatedRow>
            ))}
          </tbody>
        </table>
      )}
      <style>{`
        @keyframes spinGrowFade {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.8) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-spinGrowFade {
          animation: spinGrowFade 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}