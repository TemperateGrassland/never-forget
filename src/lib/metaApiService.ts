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

  console.log("usersWithReminders:", usersWithReminders)

  // Format the data into JSON payloads for Meta API
  return usersWithReminders.map((user) => (
    {
        messaging_product: 'whatsapp',
        to: user.phoneNumber,
        type: 'template',
        template: {
            name: 'reminder',
            language: {
                code: 'en_GB',
                policy: 'deterministic'
            },
            components: [
                {
                    type: 'body',
                    parameters: [
                        {
                            'type': 'text',
                            'parameter_name': 'text',
                            'text': user.firstName
                        },
                        ...user.reminders.map((reminder, index) => [
                            {
                                type: 'text',
                                parameter_name: `reminder_${index + 1}`,
                                text: reminder.title
                            },
                            {
                                type: 'text',
                                parameter_name: `when_${index + 1}`,
                                text: reminder.createdAt.toISOString().split('T')[0] // Example: Format date as YYYY-MM-DD
                            }
                        ]).flat()
                    ]
                }
            ]
        }
    }
    
    
    
    
    {
    messaging_product: 'whatsapp',
    to: user.phoneNumber, 
    type: 'template',
    template: {
      name: 'reminder',
      language: { code: 'en_GB' },
      components: [
        {
          type: 'text',
          parameters: user.reminders.map((reminder) => ({
            type: 'text',
            text: `${reminder.title}: ${reminder.description || 'No description'}`,
          })),
        },
      ],
    },
  }));
}