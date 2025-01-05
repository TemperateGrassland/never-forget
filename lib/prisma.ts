// Prisma client setup

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
console.log("generated prisma client");

export default prisma;