import { prisma } from '@/lib/prisma';

export async function buildMetaApiRequests() {
  // Get all users with their associated reminders
  const usersWithReminders = await prisma.user.findMany({
    include: {
      reminders: {
        where: { isComplete: false }, // Only fetch pending reminders
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Format the data into JSON payloads for Meta API
  return usersWithReminders.map((user) => ({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: user.phoneNumber, // Send to user's phone number
    type: 'template',
    template: {
      name: 'reminder_notification',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: user.reminders.map((reminder) => ({
            type: 'text',
            text: `${reminder.title}: ${reminder.description || 'No description'}`,
          })),
        },
      ],
    },
  }));
}