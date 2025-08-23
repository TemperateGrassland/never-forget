import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Type definitions
interface User {
  id: string;
  firstName: string | null;
  phoneNumber: string | null;
}
// not used, but may be used later on
// interface WhatsAppMessage {
//   from: string;
//   text?: {
//     body: string;
//   };
//   type: string;
// }

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: unknown;
  pricing?: unknown;
  errors?: Array<Record<string, unknown>>;
}

// Webhook verification (required by Meta)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge);
  } else {
    return NextResponse.json({ error: "Verification failed" }, { status: 403 });
  }
}

// Handle incoming webhook messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));

    // Extract and handle all entries/changes (Meta may send statuses in a separate change)
    const entries = Array.isArray(body.entry) ? body.entry : [];
    let sawSomething = false;

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        console.log("Webhook value keys:", Object.keys(value));

        // --- STATUSES (delivery receipts) ---
        const statuses = value?.statuses;
        if (Array.isArray(statuses) && statuses.length > 0) {
          sawSomething = true;
          statuses.forEach((s: WhatsAppStatus) => {
            console.log("WA status:", {
              id: s.id,
              status: s.status,
              timestamp: s.timestamp,
              recipient_id: s.recipient_id,
              conversation: s.conversation,
              pricing: s.pricing,
            });

            if (s.errors && s.errors.length > 0) {
              console.error("WA status error:", JSON.stringify(s.errors[0], null, 2));
            }
          });
        }

        // --- INBOUND MESSAGES ---
        const messages = value?.messages;
        if (Array.isArray(messages) && messages.length > 0) {
          sawSomething = true;

          // Process each message
          for (const message of messages) {
            const fromPhone = message.from;
            const messageText = message.text?.body;
            const messageType = message.type;

            // Only process text messages
            if (messageType !== "text" || !messageText) {
              continue;
            }

            console.log(`Received message from ${fromPhone}: ${messageText}`);

            // Find user by phone number
            const user = await prisma.user.findUnique({
              where: { phoneNumber: fromPhone },
            });

            if (!user) {
              console.log(`User not found for phone number: ${fromPhone}`);
              await sendWhatsAppMessage(fromPhone, "Sorry, I don't recognize this phone number. Please make sure you're registered on our platform.");
              continue;
            }

            // Process message with AI agent
            await processMessageWithAI(user, messageText);
          }
        }

        // If neither messages nor statuses are present, dump the full value for debugging
        if (!statuses && !messages) {
          console.log("Webhook received unhandled payload value:", JSON.stringify(value, null, 2));
        }
      }
    }

    // If we saw only statuses, acknowledge specifically; otherwise fall back to generic success
    if (!sawSomething) {
      return NextResponse.json({ status: "no_messages" });
    }
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Schema for AI agent response
const ReminderSchema = z.object({
  action: z.enum(["create_reminder", "no_reminder", "clarify"]),
  title: z.string().optional(),
  dueDate: z.string().optional(), // ISO string
  frequency: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  clarificationQuestion: z.string().optional(),
  responseMessage: z.string(),
});

type ReminderResponse = z.infer<typeof ReminderSchema>;

async function processMessageWithAI(user: User, messageText: string) {
  try {
    const prompt = `You are an AI assistant that helps users create reminders from WhatsApp messages. 

User: ${user.firstName || "User"}
Message: "${messageText}"

Analyze this message and determine if the user wants to:
1. Create a new reminder - extract title, due date (if mentioned), and frequency
2. Ask for clarification if the intent is unclear
3. Respond that no reminder is needed

 Current date: ${new Date().toISOString()}

 Guidelines:
 - Extract clear reminder titles (e.g., "doctor appointment", "call mom", "pay bills")
 - Parse relative dates (e.g., "tomorrow", "next week", "in 3 days") into absolute dates
 - Default frequency is "NONE" unless specifically mentioned (weekly, monthly, yearly)
 - Be conversational and friendly in responses
 - Ask for clarification if the message is ambiguous

 Respond with a JSON object matching this schema:
 {
   "action": "create_reminder" | "no_reminder" | "clarify",
   "title": "reminder title (if creating)",
   "dueDate": "ISO date string (if specified)",
   "frequency": "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY",
   "clarificationQuestion": "question to ask user (if clarifying)",
   "responseMessage": "message to send back to user"
}`;

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ReminderSchema,
      prompt,
      temperature: 0.1,
    });

    console.log("AI response:", result.object);

      // The SDK already validates against the Zod schema; result.object is typed
    const parsedResponse: ReminderResponse = result.object;

    // Handle the AI agent's decision
    switch (parsedResponse.action) {
      case "create_reminder":
        await createReminderFromAI(user, parsedResponse);
        break;
      case "clarify":
        if (user.phoneNumber) {
          await sendWhatsAppMessage(user.phoneNumber, parsedResponse.clarificationQuestion || "Could you provide more details?");
        }
        break;
      case "no_reminder":
        if (user.phoneNumber) {
          await sendWhatsAppMessage(user.phoneNumber, parsedResponse.responseMessage);
        }
        break;
    }
  } catch (error) {
    console.error("AI processing error:", error);
    if (user.phoneNumber) {
      await sendWhatsAppMessage(user.phoneNumber, "Sorry, I encountered an error processing your message. Please try again.");
    }
  }
}

async function createReminderFromAI(user: User, aiResponse: ReminderResponse) {
  try {
    if (!aiResponse.title) {
      if (user.phoneNumber) {
        await sendWhatsAppMessage(user.phoneNumber, "I couldn't extract a clear reminder title. Could you please be more specific?");
      }
      return;
    }

    // Create the reminder
    const reminder = await prisma.reminder.create({
      data: {
        title: aiResponse.title,
        userId: user.id,
        dueDate: aiResponse.dueDate ? new Date(aiResponse.dueDate) : null,
        frequency: aiResponse.frequency || "NONE",
        isComplete: false,
      },
    });

    console.log(`Created reminder for ${user.firstName}: ${reminder.title}`);

    // Send confirmation message
    const confirmationMessage = aiResponse.responseMessage || 
      `✅ Reminder created: "${reminder.title}"${aiResponse.dueDate ? ` due ${new Date(aiResponse.dueDate).toLocaleDateString()}` : ""}`;
    
    if (user.phoneNumber) {
      await sendWhatsAppMessage(user.phoneNumber, confirmationMessage);
    }
  } catch (error) {
    console.error("Error creating reminder:", error);
    if (user.phoneNumber) {
      await sendWhatsAppMessage(user.phoneNumber, "Sorry, I couldn't create that reminder. Please try again.");
    }
  }
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
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
        console.error("WA send failed", {
        to: phoneNumber,
        status: response.status,
        error: result?.error || result,
      });
    } else {
      const id = result?.messages?.[0]?.id;
        console.log("WA send ok", {
        to: phoneNumber,
        id,
        body: message,
        response: result,
      });
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}