// import { NextApiRequest, NextApiResponse } from 'next';
// import prisma from '@/lib/prisma'; // Your Prisma client setup
// import { getServerSession } from 'next-auth/next';
// // import { authOptions } from '@/lib/auth';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method === 'POST') {
//     // Fetch session using NextAuth
//     const session = await getServerSession(req, res, authOptions);

//     // Check if user is authenticated
//     if (!session || !session.user || !session.user.name) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const { title, description, scheduledAt } = req.body;

//     // Validate input
//     if (!title || !scheduledAt) {
//       return res.status(400).json({ message: 'Title and ScheduledAt are required.' });
//     }

//     try {
//       // Create the reminder in the database
//       const reminder = await prisma.reminder.create({
//         data: {
//           title,
//           description,
//           scheduledAt: new Date(scheduledAt),
//           userId: session.user.id,
//           },
//       });

//       return res.status(201).json(reminder);
//     } catch (error) {
//       console.error('Error creating reminder:', error);
//       return res.status(500).json({ message: 'Something went wrong.' });
//     }
//   } else {
//     return res.status(405).json({ message: 'Method not allowed.' });
//   }
// }