'use client';

import { createContext, useContext, useState } from 'react';

export interface EditableReminder {
  id: string;
  title: string;
  dueDate: Date | null;
  frequency: string;
}

const ReminderContext = createContext<{
  selectedReminder: EditableReminder | null;
  setSelectedReminder: (reminder: EditableReminder | null) => void;
}>({
  selectedReminder: null,
  setSelectedReminder: () => {},
});

export const ReminderProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedReminder, setSelectedReminder] = useState<EditableReminder | null>(null);

  return (
    <ReminderContext.Provider value={{ selectedReminder, setSelectedReminder }}>
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminderContext = () => useContext(ReminderContext);