'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export interface EditableReminder {
  id: string;
  title: string;
  dueDate: Date | null;
  frequency: string;
  advanceNoticeDays?: number;
}

const ReminderContext = createContext<{
  selectedReminder: EditableReminder | null;
  setSelectedReminder: (reminder: EditableReminder | null) => void;
  reminders: EditableReminder[];
  setReminders: (reminders: EditableReminder[]) => void;
  refetchReminders: () => void;
}>({
  selectedReminder: null,
  setSelectedReminder: () => {},
  reminders: [],
  setReminders: () => {},
  refetchReminders: () => {},
});

export const ReminderProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedReminder, setSelectedReminder] = useState<EditableReminder | null>(null);
  const [reminders, setReminders] = useState<EditableReminder[]>([]);

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');
      const data = await res.json();
      console.log('📥 Fetched reminders from API:', data);
      setReminders(data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  return (
    <ReminderContext.Provider
      value={{
        selectedReminder,
        setSelectedReminder,
        reminders,
        setReminders,
        refetchReminders: fetchReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminderContext = () => useContext(ReminderContext);