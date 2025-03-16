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
                            "type": "text",
                            "parameter_name": "text",
                            "text": user.firstName
                        },
                        {
                            "type": "text",
                            "parameter_name": "reminder_1",
                            "text": "Drive to Winslow"
                        },
                        {
                            "type": "text",
                            "parameter_name": "when_1",
                            "text": "Today"
                        },
                        {
                            "type": "text",
                            "parameter_name": "reminder_2",
                            "text": "Take care of Simbi and Chai"
                        },
                        {
                            "type": "text",
                            "parameter_name": "when_2",
                            "text": "Always"
                        },
                        {
                            "type": "text",
                            "parameter_name": "reminder_3",
                            "text": "Get shit together"
                        },
                        {
                            "type": "text",
                            "parameter_name": "when_3",
                            "text": "Maybe tomorrow?"
                        }
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