import React from 'react';

// Define the expected shape of reminders
interface Reminder {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

// Define props interface
interface DashboardTableProps {
  reminders: Reminder[];
}

const DashboardTable: React.FC<DashboardTableProps> = ({ reminders }) => {
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4">Reminders</h2>

      {reminders.length === 0 ? (
        <p>No reminders found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Title</th>
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <tr key={reminder.id} className="border">
                <td className="border p-2">{reminder.title}</td>
                <td className="border p-2">{reminder.description || 'N/A'}</td>
                <td className="border p-2">
                  {new Date(reminder.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DashboardTable;