import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextApiRequest } from 'next';


export async function POST(request: NextApiRequest) {
  try {
    const { email, password, firstName, lastName, phoneNumber, dateOfBirth } = await request.json();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already in use." }), {
        status: 400,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return new Response(JSON.stringify({ message: "User created successfully.", user }), {
      status: 201,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "Failed to create user.", err }),
      { status: 500 }
    );
  }
}