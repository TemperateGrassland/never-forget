import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
            reminders: true,
        },
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    
    return NextResponse.json({
    phoneNumber: user.phoneNumber ?? null,
    reminderCount: user.reminders.length,
    });
    } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}