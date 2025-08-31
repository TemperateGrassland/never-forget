import { checkUserSubscription, requireActiveSubscription, checkSubscriptionByPhone } from "../src/lib/subscription";
import { PrismaClient } from "@prisma/client";

// Mock Prisma
jest.mock("../src/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrisma = require("../src/lib/prisma").prisma;

describe("Subscription utilities", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkUserSubscription", () => {
    test("should return active subscription for user with valid subscription", async () => {
      const mockUser = {
        subscriptionStatus: "active",
        subscriptionPlanId: "price_123",
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await checkUserSubscription("user-123");

      expect(result).toEqual({
        hasActiveSubscription: true,
        subscriptionStatus: "active",
        subscriptionEndsAt: mockUser.subscriptionEndsAt,
        subscriptionPlanId: "price_123",
      });
    });

    test("should return inactive subscription for user with expired subscription", async () => {
      const mockUser = {
        subscriptionStatus: "active",
        subscriptionPlanId: "price_123",
        subscriptionEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await checkUserSubscription("user-123");

      expect(result).toEqual({
        hasActiveSubscription: false,
        subscriptionStatus: "active",
        subscriptionEndsAt: mockUser.subscriptionEndsAt,
        subscriptionPlanId: "price_123",
      });
    });

    test("should return inactive subscription for user with canceled status", async () => {
      const mockUser = {
        subscriptionStatus: "canceled",
        subscriptionPlanId: "price_123",
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await checkUserSubscription("user-123");

      expect(result.hasActiveSubscription).toBe(false);
    });

    test("should return inactive subscription for user without subscription", async () => {
      const mockUser = {
        subscriptionStatus: null,
        subscriptionPlanId: null,
        subscriptionEndsAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await checkUserSubscription("user-123");

      expect(result.hasActiveSubscription).toBe(false);
    });

    test("should handle user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await checkUserSubscription("user-404");

      expect(result.hasActiveSubscription).toBe(false);
    });
  });

  describe("requireActiveSubscription", () => {
    test("should return success for user with active subscription", async () => {
      const mockUser = {
        subscriptionStatus: "active",
        subscriptionPlanId: "price_123",
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await requireActiveSubscription("user-123");

      expect(result).toEqual({ success: true });
    });

    test("should return error for user without active subscription", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        subscriptionStatus: "canceled",
        subscriptionPlanId: null,
        subscriptionEndsAt: null,
      });

      const result = await requireActiveSubscription("user-123");

      expect(result).toEqual({
        success: false,
        error: "This feature requires an active subscription. Please subscribe to continue using AI-powered reminders.",
      });
    });
  });

  describe("checkSubscriptionByPhone", () => {
    test("should return subscription status for user with valid phone", async () => {
      const mockUser = {
        id: "user-123",
        subscriptionStatus: "active",
        subscriptionPlanId: "price_123",
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      // Mock findUnique to be called twice (once for phone lookup, once for subscription check)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call for phone lookup
        .mockResolvedValueOnce(mockUser); // Second call for subscription check

      const result = await checkSubscriptionByPhone("+1234567890");

      expect(result.hasActiveSubscription).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: "+1234567890" },
        select: expect.any(Object),
      });
    });

    test("should handle phone number not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await checkSubscriptionByPhone("+1234567890");

      expect(result.hasActiveSubscription).toBe(false);
    });
  });
});