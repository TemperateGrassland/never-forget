import { GET } from "../src/app/api/jobs/send-reminders/route";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

// Mock Prisma
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    reminder: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock sendWhatsAppMessage function
jest.mock("../src/app/api/jobs/check-reminders/route", () => ({
  sendWhatsAppMessage: jest.fn(() => Promise.resolve(200)),
}));

const prisma = new PrismaClient();

describe("GET /api/jobs/check-reminders", () => {
  const mockRequest = (authHeader?: string) => {
    return {
      headers: {
        get: jest.fn((key) => (key === "Authorization" ? authHeader : null)),
      },
    } as unknown as NextRequest;
  };

  afterEach(() => {
    jest.clearAllMocks(); // Reset mocks after each test
  });

  test("✅ Should return 401 Unauthorized when Authorization header is missing", async () => {
    const request = mockRequest(undefined); // No Authorization header
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("✅ Should return 401 Unauthorized when Authorization header is incorrect", async () => {
    const request = mockRequest("Bearer WrongSecret"); // Incorrect Auth
    process.env.WHATSAPP_CRON_SECRET = "correct_secret";
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  test("✅ Should check for due reminders and return success", async () => {
    process.env.WHATSAPP_CRON_SECRET = "correct_secret";
    const request = mockRequest("Bearer correct_secret");

    const mockReminders = [
      {
        id: "reminder-1",
        title: "Meeting at 10AM",
        scheduledAt: new Date(),
        frequency: "DAILY",
        isSent: false,
        user: { email: "user@example.com", phoneNumber: "1234567890" },
      },
    ];

    // Mock database response
    (prisma.reminder.findMany as jest.Mock).mockResolvedValue(mockReminders);

    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(prisma.reminder.findMany).toHaveBeenCalled();
  });

  test("❌ Should log an error if sending a WhatsApp message fails", async () => {
    process.env.WHATSAPP_CRON_SECRET = "correct_secret";
    const request = mockRequest("Bearer correct_secret");

    const mockReminders = [
      {
        id: "reminder-1",
        title: "Event Reminder",
        scheduledAt: new Date(),
        frequency: "DAILY",
        isSent: false,
        user: { email: "user@example.com", phoneNumber: "1234567890" },
      },
    ];

    (prisma.reminder.findMany as jest.Mock).mockResolvedValue(mockReminders);
    (jest.requireMock("@/app/api/jobs/check-reminders/route").sendWhatsAppMessage as jest.Mock).mockRejectedValue(new Error("API Error"));

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error sending reminder"));
    consoleErrorSpy.mockRestore();
  });
});