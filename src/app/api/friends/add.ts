import { auth } from "@/auth";
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { parsePhoneNumberWithError } from 'libphonenumber-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await auth();
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const parsed = parsePhoneNumberWithError(phone, 'GB'); // Default region; adjust as needed
  if (!parsed?.isValid()) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  const normalizedPhone = parsed.number; // E.164 format

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if user with phone already exists
  const targetUser = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });

  if (targetUser) {
    // Directly create friend relationship
    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        friends: { connect: { id: targetUser.id } },
      },
    });
    return res.status(200).json({ message: 'Friend added successfully' });
  } else {
    // Create invite
    await prisma.friendInvite.create({
      data: {
        fromUserId: currentUser.id,
        phone: normalizedPhone,
      },
    });
    return res.status(200).json({ message: 'Invite created' });
  }
}