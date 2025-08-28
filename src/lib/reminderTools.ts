import { prisma } from '@/lib/prisma';
import { ReminderFrequency } from '@prisma/client';

// Types for tool responses
interface ToolResponse<T> {
  status: 'success' | 'error' | 'partial';
  result?: T;
  error?: string;
  metadata?: {
    latency?: number;
    version?: number;
    count?: number;
  };
}

interface ReminderMatch {
  id: string;
  title: string;
  dueDate: Date | null;
  frequency: ReminderFrequency;
  updatedAt: Date;
  confidence: number; // 0-1 score for match quality
}

interface ReminderPatch {
  title?: string;
  dueDate?: Date | null;
  frequency?: ReminderFrequency;
}

// Tool 1: Search reminders for a user
export async function searchReminders(
  userId: string,
  keywords: string[],
  requestId?: string
): Promise<ToolResponse<ReminderMatch[]>> {
  const startTime = Date.now();
  
  try {
    // Get user's incomplete reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isComplete: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20, // Limit for performance
    });

    // Simple keyword matching with scoring
    const matches: ReminderMatch[] = reminders
      .map(reminder => {
        let confidence = 0;
        const titleLower = reminder.title.toLowerCase();
        
        // Score based on keyword matches
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          if (titleLower.includes(keywordLower)) {
            confidence += keywordLower.length / titleLower.length;
          }
        }
        
        return {
          id: reminder.id,
          title: reminder.title,
          dueDate: reminder.dueDate,
          frequency: reminder.frequency,
          updatedAt: reminder.updatedAt,
          confidence,
        };
      })
      .filter(match => match.confidence > 0.1) // Minimum threshold
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 matches

    return {
      status: 'success',
      result: matches,
      metadata: {
        latency: Date.now() - startTime,
        count: matches.length,
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { latency: Date.now() - startTime },
    };
  }
}

// Tool 2: Get single reminder by ID
export async function getReminder(
  reminderId: string,
  userId: string,
  requestId?: string
): Promise<ToolResponse<ReminderMatch>> {
  const startTime = Date.now();
  
  try {
    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId, // Authorization check
      },
    });

    if (!reminder) {
      return {
        status: 'error',
        error: 'Reminder not found or access denied',
        metadata: { latency: Date.now() - startTime },
      };
    }

    return {
      status: 'success',
      result: {
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate,
        frequency: reminder.frequency,
        updatedAt: reminder.updatedAt,
        confidence: 1.0,
      },
      metadata: {
        latency: Date.now() - startTime,
        version: Math.floor(reminder.updatedAt.getTime() / 1000),
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { latency: Date.now() - startTime },
    };
  }
}

// Tool 3: Update reminder with optimistic locking
export async function updateReminder(
  reminderId: string,
  userId: string,
  patch: ReminderPatch,
  expectedVersion?: number,
  requestId?: string
): Promise<ToolResponse<ReminderMatch>> {
  const startTime = Date.now();
  
  try {
    // First, get current version for optimistic locking
    const current = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId, // Authorization
      },
    });

    if (!current) {
      return {
        status: 'error',
        error: 'Reminder not found or access denied',
        metadata: { latency: Date.now() - startTime },
      };
    }

    // Check version for optimistic concurrency
    const currentVersion = Math.floor(current.updatedAt.getTime() / 1000);
    if (expectedVersion && expectedVersion !== currentVersion) {
      return {
        status: 'error',
        error: 'Reminder has been modified by another process',
        metadata: {
          latency: Date.now() - startTime,
          version: currentVersion,
        },
      };
    }

    // Apply the update
    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        ...patch,
        updatedAt: new Date(), // Explicit timestamp
      },
    });

    return {
      status: 'success',
      result: {
        id: updated.id,
        title: updated.title,
        dueDate: updated.dueDate,
        frequency: updated.frequency,
        updatedAt: updated.updatedAt,
        confidence: 1.0,
      },
      metadata: {
        latency: Date.now() - startTime,
        version: Math.floor(updated.updatedAt.getTime() / 1000),
      },
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { latency: Date.now() - startTime },
    };
  }
}

// Tool 4: Send confirmation message
export async function sendConfirmation(
  phoneNumber: string,
  message: string,
  requestId?: string
): Promise<ToolResponse<{ messageId: string }>> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      return {
        status: 'error',
        error: `WhatsApp API error: ${result?.error?.message || 'Unknown error'}`,
        metadata: { latency: Date.now() - startTime },
      };
    }

    const messageId = result?.messages?.[0]?.id;
    return {
      status: 'success',
      result: { messageId },
      metadata: { latency: Date.now() - startTime },
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: { latency: Date.now() - startTime },
    };
  }
}

// Utility: Validate reminder patch
export function validateReminderPatch(patch: ReminderPatch): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (patch.title && patch.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }
  
  if (patch.dueDate && patch.dueDate < new Date()) {
    errors.push('Due date cannot be in the past');
  }
  
  if (patch.frequency && !['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(patch.frequency)) {
    errors.push('Invalid frequency value');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}