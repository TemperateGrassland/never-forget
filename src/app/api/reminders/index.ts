import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react'; // Assuming you're using NextAuth
import prisma from '../../../lib/prisma'; // Your Prisma client setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const session = await getSession({ req });

    // Check if user is authenticated
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { title, description, scheduledAt } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ message: 'Title and ScheduledAt are required.' });
    }

    try {
      const reminder = await prisma.reminder.create({
        data: {
          title,
          description,
          scheduledAt: new Date(scheduledAt),
          userId: session.user.id, // Assuming the user's ID is stored in the session
        },
      });

      return res.status(201).json(reminder);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Something went wrong.' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed.' });
  }
}