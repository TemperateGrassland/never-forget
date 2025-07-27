'use client';

import { useState, useEffect } from 'react';
import { useReminderContext } from '../../../context/ReminderContext';
import * as Ably from 'ably';
import TodoItem from './TodoItem';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Interface for API response format
interface ApiReminder {
  id: string;
  title: string;
  userId: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  frequency: string | null;
}



const getReminderStatus = (dueDate: string | Date | null): { status: 'overdue' | 'due-today' | 'due-soon' | 'future' | 'no-date'; daysDiff: number } => {
  if (!dueDate) {
    return { status: 'no-date', daysDiff: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return { status: 'overdue', daysDiff: Math.abs(daysDiff) };
  } else if (daysDiff === 0) {
    return { status: 'due-today', daysDiff: 0 };
  } else if (daysDiff <= 3) {
    return { status: 'due-soon', daysDiff };
  } else {
    return { status: 'future', daysDiff };
  }
};

const StatusBadge: React.FC<{ status: string; daysDiff: number }> = ({ status, daysDiff }) => {
  const getBadgeContent = () => {
    switch (status) {
      case 'overdue':
        return { text: `OVERDUE ${daysDiff} day${daysDiff > 1 ? 's' : ''}`, className: 'bg-red-500 text-white' };
      case 'due-today':
        return { text: 'DUE TODAY', className: 'bg-orange-500 text-white' };
      case 'due-soon':
        return { text: `DUE IN ${daysDiff} day${daysDiff > 1 ? 's' : ''}`, className: 'bg-yellow-500 text-black' };
      case 'future':
        return { text: `DUE IN ${daysDiff} day${daysDiff > 1 ? 's' : ''}`, className: 'bg-green-500 text-white' };
      default:
        return { text: 'NO DUE DATE', className: 'bg-gray-400 text-white' };
    }
  };

  const badge = getBadgeContent();
  
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
      {badge.text}
    </span>
  );
};

export default function DashboardTable() {
  const [reminders, setReminders] = useState<ApiReminder[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDateById, setSelectedDateById] = useState<{ [id: string]: Date | null }>({});
  const [selectedDropdownById, setSelectedDropdownById] = useState<{ [id: string]: string }>({});
  const [emojiVisibleById, setEmojiVisibleById] = useState<{ [id: string]: boolean }>({});
  const [tick, setTick] = useState(0);

  // Use ReminderContext for editing
  const { selectedReminder, setSelectedReminder } = useReminderContext();

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');

      const data = await res.json();
      setReminders(data.reminders);

      // Initialize selected dates and dropdowns
      const initialDateById: { [id: string]: Date | null } = {};
      const initialDropdownById: { [id: string]: string } = {};

      data.reminders.forEach((reminder: ApiReminder) => {
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
      const r = message.data;
      // Normalize dueDate to ISO string if present
      const dueDateISO = r.dueDate ? new Date(r.dueDate).toISOString() : null;
      setReminders((prev) => [
        { ...r, dueDate: dueDateISO },
        ...prev,
      ]);
      // Update dropdown and date state for the new reminder
      if (dueDateISO) {
        const dueDateObj = new Date(dueDateISO);
        setSelectedDateById((prev) => ({ ...prev, [r.id]: dueDateObj }));
        // Dropdown logic (same as fetchReminders)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const normalizedDue = new Date(dueDateObj);
        normalizedDue.setHours(0, 0, 0, 0);
        const isSameDay = (a, b) => a.getTime() === b.getTime();
        let dropdownValue = 'date';
        if (isSameDay(normalizedDue, today)) dropdownValue = 'today';
        else if (isSameDay(normalizedDue, tomorrow)) dropdownValue = 'tomorrow';
        setSelectedDropdownById((prev) => ({ ...prev, [r.id]: dropdownValue }));
      }
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

  // Add timer to force re-render every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60 * 1000); // every minute
    return () => clearInterval(interval);
  }, []);

  // Ensure dropdown/date state is initialized for all reminders (including new ones)
  useEffect(() => {
    const updatedDateById = { ...selectedDateById };
    const updatedDropdownById = { ...selectedDropdownById };
    let changed = false;
    reminders.forEach((reminder) => {
      if (reminder.dueDate && !updatedDateById[reminder.id]) {
        const dueDate = new Date(reminder.dueDate);
        updatedDateById[reminder.id] = dueDate;
        // Dropdown logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const normalizedDue = new Date(dueDate);
        normalizedDue.setHours(0, 0, 0, 0);
        const isSameDay = (a, b) => a.getTime() === b.getTime();
        let dropdownValue = 'date';
        if (isSameDay(normalizedDue, today)) dropdownValue = 'today';
        else if (isSameDay(normalizedDue, tomorrow)) dropdownValue = 'tomorrow';
        updatedDropdownById[reminder.id] = dropdownValue;
        changed = true;
      }
    });
    if (changed) {
      setSelectedDateById(updatedDateById);
      setSelectedDropdownById(updatedDropdownById);
    }
  }, [reminders]);

  // Sort reminders: overdue first, then by due date
  const sortedReminders = [...reminders].sort((a, b) => {
    const statusA = getReminderStatus(a.dueDate);
    const statusB = getReminderStatus(b.dueDate);
    
    // Overdue items first
    if (statusA.status === 'overdue' && statusB.status !== 'overdue') return -1;
    if (statusB.status === 'overdue' && statusA.status !== 'overdue') return 1;
    
    // Then by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    // Items with due dates before those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return 0;
  });

  return (
    <div className="overflow-x-auto w-full">
      <h2 className="text-xl font-bold mb-4 text-black"></h2>
      <div className="hidden md:block">
        {reminders.length === 0 ? (
          <p className='text-black'>No reminders found.</p>
        ) : (
          <table className="min-w-full table-auto border-collapse border border-gray-300 text-black text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-center text-black">Reminder</th>
                <th className="border p-2 text-center text-black">Status</th>
                <th className="border p-2 text-center text-black">To Do By</th>
                <th className="border p-2 text-center text-black">Done?</th>
              </tr>
            </thead>
            <tbody>
              {sortedReminders.map((reminder) => {
                const status = getReminderStatus(reminder.dueDate);
                const isOverdue = status.status === 'overdue';
                
                return (
                  <tr 
                    key={reminder.id}
                    className={`${deletingId === reminder.id ? 'animate-pulse opacity-50' : ''} ${isOverdue ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                  >
                    <td className="border p-2 text-center align-middle">
                      <TodoItem
                        task={reminder.title}
                        initialCompleted={false}
                      />
                    {/* Edit button for desktop */}
                    <button
                      className="ml-2 px-2 py-1 text-xs bg-blue-200 hover:bg-blue-400 rounded text-black"
                      onClick={() =>
                        setSelectedReminder({
                          id: reminder.id,
                          title: reminder.title,
                          dueDate: reminder.dueDate ? new Date(reminder.dueDate) : null,
                          frequency: reminder.frequency || 'weekly', // fallback
                        })
                      }
                    >
                      Edit
                    </button>
                    </td>
                    <td className="border p-2 text-center align-middle">
                      <StatusBadge status={status.status} daysDiff={status.daysDiff} />
                    </td>
                    <td className="border p-2 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
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
                            })
                            .then(response => {
                              if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                              }
                              return response.json();
                            })
                            .then((data) => {
                              setReminders((prev) => 
                                prev.map((r) => 
                                  r.id === reminder.id 
                                    ? { ...r, dueDate: date ? date.toISOString().split('T')[0] : null }
                                    : r
                                )
                              );
                            })
                            .catch((err) => {
                              console.error('Failed to update due date:', err);
                              setSelectedDateById((prev) => ({ ...prev, [reminder.id]: null }));
                            });
                          }}
                          minDate={new Date()}
                          className="border p-1 rounded text-center"
                          placeholderText="Pick a date"
                          dateFormat="dd/MM/yyyy"
                        />
                      </div>
                      {emojiVisibleById[reminder.id] && (
                        <span className="ml-2 animate-spinGrowFade text-xl">📅</span>
                      )}
                    </td>
                    <td className="border p-2 text-center align-middle">
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-2xl text-center"
                      >
                        ✅
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="block md:hidden space-y-4">
        {sortedReminders.map((reminder) => {
          const status = getReminderStatus(reminder.dueDate);
          const isOverdue = status.status === 'overdue';
          
          return (
            <div
              key={reminder.id}
              className={`p-4 border rounded shadow-sm text-black ${
                isOverdue 
                  ? 'bg-red-50 border-red-300 border-l-4 border-l-red-500' 
                  : 'bg-white'
              } items-center text-center`}
            >
              <div className={`font-semibold ${isOverdue ? 'text-red-700' : 'text-black'}`}>
                {reminder.title}
                {/* Edit button for mobile */}
                <button
                  className="ml-2 px-2 py-1 text-xs bg-blue-200 hover:bg-blue-400 rounded text-black"
                  onClick={() =>
                    setSelectedReminder({
                      id: reminder.id,
                      title: reminder.title,
                      dueDate: reminder.dueDate ? new Date(reminder.dueDate) : null,
                      frequency: reminder.frequency || 'weekly',
                    })
                  }
                >
                  Edit
                </button>
              </div>
              <div className="mt-2 mb-2">
                <StatusBadge status={status.status} daysDiff={status.daysDiff} />
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium mb-1">To Do By:</div>
                <div className="flex flex-col items-center gap-1">
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
                      })
                      .then(response => {
                        if (!response.ok) {
                          throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                      })
                      .then((data) => {
                        setReminders((prev) => 
                          prev.map((r) => 
                            r.id === reminder.id 
                              ? { ...r, dueDate: date ? date.toISOString().split('T')[0] : null }
                              : r
                          )
                        );
                      })
                      .catch((err) => {
                        console.error('Failed to update due date:', err);
                        setSelectedDateById((prev) => ({ ...prev, [reminder.id]: null }));
                      });
                    }}
                    minDate={new Date()}
                    className="border p-1 rounded text-center"
                    placeholderText="Pick a date"
                    dateFormat="dd/MM/yyyy"
                  />
                  <button
                    className="text-sm text-blue-600 underline text-center"
                    onClick={() => setSelectedDateById((prev) => ({ ...prev, [reminder.id]: null }))}
                  >
                    Reset date
                  </button>
                </div>
                {emojiVisibleById[reminder.id] && (
                  <span className="ml-2 animate-spinGrowFade text-xl">📅</span>
                )}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="text-2xl text-center"
                >
                  ✅
                </button>
              </div>
            </div>
          );
        })}
      </div>

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