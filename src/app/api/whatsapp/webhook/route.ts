import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { 
  searchReminders, 
  getReminder, 
  updateReminder, 
  sendConfirmation,
  validateReminderPatch 
} from "@/lib/reminderTools";
import { checkSubscriptionByPhone } from "@/lib/subscription";
import { log } from "@/lib/logger";


// Type definitions
interface User {
  id: string;
  firstName: string | null;
  phoneNumber: string | null;
}

interface ReminderPatch {
  title?: string;
  dueDate?: Date;
  frequency?: "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY";
}

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation?: unknown;
  pricing?: unknown;
  errors?: Array<Record<string, unknown>>;
}

interface WhatsAppFlowResponse {
  name: string;
  body: string;
  response_json: string;
}

interface WhatsAppInteractive {
  type: string;
  nfm_reply?: WhatsAppFlowResponse;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  type: string;
  text?: {
    body: string;
  };
  interactive?: WhatsAppInteractive;
  context?: {
    from: string;
    id: string;
    [key: string]: unknown;
  };
}


// The guide for meta cloud API webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/
// 1. create endpoint
// 2. subscribe to webhooks
// 3. update permissions for webhooks




// Webhook verification (required by Meta)
// A verification request is sent by meta anytime  a webhooks product in configured in the App Dashboard
// When sent a verification request, the app must:
//  - verify the verify_token value matches the string set the verify token field in the webhook verification
//  - respond with the hub.challenge value
export async function GET(request: NextRequest) {
  // This get request is used to 
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
// when a webhook product is configured, the app subscribes to specific fields on an object type.
//  whenever there's a change to one of these fields, meta sends a post request to the app's endpoint with
// a json payload describing the change: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#create-endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));

    // Extract and handle all entries/changes (Meta may send statuses in a separate change)
    // ensure entries is always an array by copying the existing body.entry into a new array or creating an empty array
    // if the body.entry type is anything but an array.
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
            const typedMessage = message as WhatsAppMessage;
            const fromPhone = typedMessage.from;
            const messageText = typedMessage.text?.body;
            const messageType = typedMessage.type;
            
            console.log(`DEBUG: Phone from WhatsApp: "${fromPhone}", Message: "${messageText}", Type: ${messageType}`);

            // Handle Flow responses (interactive messages)
            if (messageType === "interactive" && typedMessage.interactive?.type === "nfm_reply") {
              await processFlowResponse(typedMessage, fromPhone);
              continue;
            }

            // Only process text messages
            if (messageType !== "text" || !messageText) {
              continue;
            }

            console.log(`Received message from ${fromPhone}: ${messageText}`);

            // Check if this looks like feedback response first (before user lookup)
            if (isFeedbackResponse(messageText)) {
              console.log(`Processing anonymous feedback: "${messageText}"`);
              
              await prisma.anonymousFeedback.create({
                data: {
                  template: 'feedback_request', // Could be enhanced to detect which template
                  response: messageText,
                  metadata: {
                    timestamp: new Date().toISOString(),
                    messageType: 'whatsapp'
                  }
                }
              });
              
              // Send thank you message without revealing identity
              await sendConfirmation(fromPhone, "Thank you for your feedback! 🙏 Your input helps us improve never forget.");
              continue; // Skip normal processing for feedback
            }

            // Find user by phone number
            const user = await prisma.user.findUnique({
              where: { phoneNumber: fromPhone },
            });

            if (!user) {
              console.log(`User not found for phone number: ${fromPhone}`);
              await sendConfirmation(fromPhone, "Sorry, I don't recognize this phone number. Please make sure you're registered on our platform.");
              continue;
            }

            // Check subscription before using AI features
            const subscriptionStatus = await checkSubscriptionByPhone(fromPhone);
            if (!subscriptionStatus.hasActiveSubscription) {
              console.log(`User ${user.id} attempted to use AI feature without active subscription`);
              // TODO check the url is correct
              await sendConfirmation(fromPhone, "🔒 AI-powered reminders require an active subscription. Please subscribe at neverforget.one/subscriptions to continue using this feature.");
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
  action: z.enum(["create_reminder", "update_reminder", "no_reminder", "clarify"]),
  title: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(), // ISO string
  frequency: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  clarificationQuestion: z.string().nullable().optional(),
  responseMessage: z.string(),
  // For updates
  searchKeywords: z.array(z.string()).optional(),
  updateFields: z.object({
    title: z.string().min(1).optional(),
    dueDate: z.string().optional(),
    frequency: z.enum(["NONE", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  }).optional(),
});

type ReminderResponse = z.infer<typeof ReminderSchema>;

// Utility to strip null values from objects (defensive sanitizer)
// Recursively removes null/undefined values from objects and arrays
// This prevents Zod validation errors when AI generates null instead of omitting fields
function stripNulls<Data>(obj: Data): Data {
  if (Array.isArray(obj)) {
    return obj.map(stripNulls) as Data;
  }
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).flatMap(([k, v]) => {
        if (v === null || v === undefined) return [];
        return [[k, stripNulls(v)]];
      })
    ) as Data;
  }
  return obj;
}

async function processMessageWithAI(user: User, messageText: string) {
  try {
    const prompt = `You are an AI assistant that helps users manage reminders from WhatsApp messages. 

User: ${user.firstName || "User"}
Message: "${messageText}"

Analyze this message and determine if the user wants to:
1. Create a new reminder - extract title, due date (if mentioned), and frequency
2. Update an existing reminder - identify search keywords and what to update
3. Ask for clarification if the intent is unclear
4. Respond that no reminder action is needed

Current date: ${new Date().toISOString()}

Guidelines:
- For NEW reminders: Extract clear titles, parse dates, set frequency
- For UPDATES: Look for phrases like "change my...", "update my...", "move my...reminder"
- Extract search keywords to find the reminder (e.g., "my 8am reminder" → ["8am"])
- Parse what fields to update (title, time, frequency)
- Be conversational and friendly in responses
- Ask for clarification if ambiguous

Examples:
- "remind me to call mom tomorrow" → create_reminder
- "change my 8am reminder to 8:30" → update_reminder, searchKeywords: ["8am"], updateFields: {dueDate: "..."}
- "update my doctor appointment to next Friday" → update_reminder, searchKeywords: ["doctor", "appointment"]

Respond with a JSON object matching this schema:
{
  "action": "create_reminder" | "update_reminder" | "no_reminder" | "clarify",
   "title": "reminder title (if creating)",
   "dueDate": "ISO date string (if specified)",
   "frequency": "NONE" | "WEEKLY" | "MONTHLY" | "YEARLY",
   "clarificationQuestion": "question to ask user (if clarifying)",
   "responseMessage": "message to send back to user",
   "searchKeywords": ["keyword1", "keyword2"] (if updating),
   "updateFields": {
     "title": "new title",
     "dueDate": "new ISO date",
     "frequency": "new frequency"
   } (if updating)
}

IMPORTANT: 
- If a field is unknown or not being changed, OMIT the key entirely. Do not return null.
- Only include updateFields for keys you're actually updating.
- Example: if only changing title, use: "updateFields": {"title": "new title"}
- If not updating anything, use: "updateFields": {} or omit updateFields entirely`;

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ReminderSchema,
      prompt,
      temperature: 0.1,
    });

    console.log("AI response:", result.object);

    // Apply defensive sanitizer to remove null values
    const cleanedResponse = stripNulls(result.object);
    console.log("Cleaned response:", cleanedResponse);

    // The SDK already validates against the Zod schema; result.object is typed
    const parsedResponse: ReminderResponse = cleanedResponse;

    // Handle the AI agent's decision
    switch (parsedResponse.action) {
      case "create_reminder":
        await createReminderFromAI(user, parsedResponse);
        break;
      case "update_reminder":
        await updateReminderFromAI(user, parsedResponse);
        break;
      case "clarify":
        if (user.phoneNumber) {
          await sendConfirmation(user.phoneNumber, parsedResponse.clarificationQuestion || "Could you provide more details?");
        }
        break;
      case "no_reminder":
        if (user.phoneNumber) {
          await sendConfirmation(user.phoneNumber, parsedResponse.responseMessage);
        }
        break;
    }
  } catch (error) {
    console.error("AI processing error:", error);
    console.error("Message that caused error:", messageText);
    console.error("User:", user.firstName, user.id);
    if (user.phoneNumber) {
      await sendConfirmation(user.phoneNumber, "Sorry, I encountered an error processing your message. Please try again.");
    }
  }
}

async function createReminderFromAI(user: User, aiResponse: ReminderResponse) {
  try {
    if (!aiResponse.title) {
      if (user.phoneNumber) {
        await sendConfirmation(user.phoneNumber, "I couldn't extract a clear reminder title. Could you please be more specific?");
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
      await sendConfirmation(user.phoneNumber, confirmationMessage);
    }
  } catch (error) {
    console.error("Error creating reminder:", error);
    if (user.phoneNumber) {
      await sendConfirmation(user.phoneNumber, "Sorry, I couldn't create that reminder. Please try again.");
    }
  }
}

// New orchestrator function for handling updates
async function updateReminderFromAI(user: User, aiResponse: ReminderResponse) {
  const requestId = `update_${user.id}_${Date.now()}`;
  const executionTrace: Array<{tool: string, duration: number, status: string}> = [];
  
  try {
    if (!aiResponse.searchKeywords || !aiResponse.updateFields) {
      if (user.phoneNumber) {
        await sendConfirmation(user.phoneNumber, "I need more details about what reminder to update and how.");
      }
      return;
    }

    // Step 1: Search for matching reminders
    const searchStart = Date.now();
    const searchResult = await searchReminders(user.id, aiResponse.searchKeywords, requestId);
    executionTrace.push({
      tool: 'search_reminders',
      duration: Date.now() - searchStart,
      status: searchResult.status
    });

    if (searchResult.status === 'error' || !searchResult.result?.length) {
      if (user.phoneNumber) {
        await sendConfirmation(user.phoneNumber, "I couldn't find any matching reminders. Could you be more specific?");
      }
      return;
    }

    const matches = searchResult.result;
    
    // Step 2: Handle disambiguation if multiple matches
    if (matches.length > 1) {
      const topMatch = matches[0];
      if (topMatch.confidence < 0.8) {
        // Ask for clarification with top 3 options
        const options = matches.slice(0, 3).map((match, i) => 
          `${i + 1}. "${match.title}"${match.dueDate ? ` (due ${match.dueDate.toLocaleDateString()})` : ''}`
        ).join('\n');
        
        if (user.phoneNumber) {
          await sendConfirmation(user.phoneNumber, 
            `I found multiple reminders. Which one do you want to update?\n\n${options}\n\nPlease reply with the number or be more specific.`
          );
        }
        return;
      }
    }

    const targetReminder = matches[0];
    
    // Step 3: Validate and apply the patch
    const patch: ReminderPatch = {};
    if (aiResponse.updateFields.title) patch.title = aiResponse.updateFields.title;
    if (aiResponse.updateFields.dueDate) patch.dueDate = new Date(aiResponse.updateFields.dueDate);
    if (aiResponse.updateFields.frequency) patch.frequency = aiResponse.updateFields.frequency;

    const validation = validateReminderPatch(patch);
    if (!validation.valid) {
      if (user.phoneNumber) {
        await sendConfirmation(user.phoneNumber, `Update failed: ${validation.errors.join(', ')}`);
      }
      return;
    }

    // Step 4: Update the reminder with optimistic locking
    const updateStart = Date.now();
    const expectedVersion = Math.floor(targetReminder.updatedAt.getTime() / 1000);
    const updateResult = await updateReminder(
      targetReminder.id, 
      user.id, 
      patch, 
      expectedVersion, 
      requestId
    );
    
    executionTrace.push({
      tool: 'update_reminder',
      duration: Date.now() - updateStart,
      status: updateResult.status
    });

    if (updateResult.status === 'error') {
      if (user.phoneNumber) {
        await sendConfirmation(user.phoneNumber, `Update failed: ${updateResult.error}`);
      }
      return;
    }

    // Step 5: Send confirmation
    const updated = updateResult.result!;
    const changes: string[] = [];
    if (patch.title) changes.push(`title to "${patch.title}"`);
    if (patch.dueDate) changes.push(`due date to ${patch.dueDate.toLocaleDateString()}`);
    if (patch.frequency && patch.frequency !== 'NONE') changes.push(`frequency to ${patch.frequency.toLowerCase()}`);
    
    const confirmationMessage = aiResponse.responseMessage || 
      `✅ Updated reminder: "${updated.title}"\nChanged: ${changes.join(', ')}`;
    
    if (user.phoneNumber) {
      await sendConfirmation(user.phoneNumber, confirmationMessage);
    }
    
    // Log execution trace
    console.log(`Update orchestration completed for ${user.firstName}:`, {
      requestId,
      target: targetReminder.title,
      changes: Object.keys(patch),
      executionTrace,
      totalDuration: executionTrace.reduce((sum, trace) => sum + trace.duration, 0)
    });
    
  } catch (error) {
    console.error("Error updating reminder:", error);
    if (user.phoneNumber) {
      await sendConfirmation(user.phoneNumber, "Sorry, I encountered an error updating that reminder. Please try again.");
    }
    
    // Log failed execution
    console.log(`Update orchestration failed for ${user.firstName}:`, {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTrace
    });
  }
}

// Handle WhatsApp Flow responses
async function processFlowResponse(message: WhatsAppMessage, fromPhone: string) {
  try {
    log.info("processing flow response.")
    
    // Log the complete message structure for analysis
    console.log("=== COMPLETE WHATSAPP FLOW MESSAGE ===");
    console.log("Full message object:", JSON.stringify(message, null, 2));
    console.log("Message ID:", message.id);
    console.log("From phone:", fromPhone);
    console.log("Message type:", message.type);
    
    // Log context information (might contain template info)
    if (message.context) {
      console.log("=== MESSAGE CONTEXT ===");
      console.log("Context:", JSON.stringify(message.context, null, 2));
    }
    
    const interactive = message.interactive;
    console.log("=== INTERACTIVE SECTION ===");
    console.log("Interactive object:", JSON.stringify(interactive, null, 2));
    
    const nfmReply = interactive?.nfm_reply;
    console.log("=== NFM REPLY SECTION ===");
    console.log("NFM Reply object:", JSON.stringify(nfmReply, null, 2));
    
    if (!nfmReply || nfmReply.name !== "flow") {
      console.log("Not a flow response, skipping");
      return;
    }

    // Parse the response JSON
    const responseData = JSON.parse(nfmReply.response_json);
    console.log("=== PARSED RESPONSE DATA ===");
    console.log("Response JSON parsed:", JSON.stringify(responseData, null, 2));
    
    const flowToken = responseData.flow_token;
    console.log("Flow token extracted:", flowToken);
    
    // Log all available keys in the response for analysis
    console.log("Available response keys:", Object.keys(responseData));
    
    console.log(`Flow response received from ${fromPhone}:`, {
      flowToken,
      responses: responseData
    });

    // Find user (optional for anonymous flows)
    const user = await prisma.user.findUnique({
      where: { phoneNumber: fromPhone },
    });

    // Use flow_token directly as template name since we now send template name as flow_token
    const templateName = flowToken || 'unknown_template';
    const flowName = templateName;

    // Store the flow response
    await prisma.flowResponse.create({
      data: {
        flowToken,
        flowName,
        userId: user?.id || null,
        phoneNumber: fromPhone,
        responses: responseData,
        metadata: {
          timestamp: new Date().toISOString(),
          messageId: message.id,
          messageType: 'whatsapp_flow',
          templateName // Store template name in metadata until column exists
        }
      }
    });

    console.log(`Stored flow response for ${flowName} from ${fromPhone}`);

    // Send confirmation message
    await sendConfirmation(fromPhone, "Thank you for your feedback! 🙏 Your input helps us improve never forget.");

  } catch (error) {
    console.error("Error processing flow response:", error);
    console.error("Message data:", JSON.stringify(message, null, 2));
  }
}

// Extract flow name from token (customize based on your token format)
function extractFlowNameFromToken(flowToken: string): string | null {
  // Example: if your tokens are like "ease_feedback_12345", extract "ease_feedback"
  const match = flowToken.match(/^([a-z_]+)_\d+$/);
  return match ? match[1] : null;
}

// Extract template name from token (customize based on your token format)
function extractTemplateNameFromToken(flowToken: string): string | null {
  // For now, assume template name is the same as flow name
  // You can customize this if your tokens include template info differently
  // Example: "ease_feedback_template_v1_12345" -> "ease_feedback"
  const match = flowToken.match(/^([a-z_]+)(?:_template)?(?:_v\d+)?_\d+$/);
  return match ? match[1] : null;
}

// Simple feedback detection function
function isFeedbackResponse(messageText: string): boolean {
  const feedbackKeywords = [
    'feedback', 'improve', 'suggestion', 'better', 'worse', 'good', 'bad',
    'love', 'hate', 'like', 'dislike', 'feature', 'bug', 'issue', 'problem',
    'great', 'terrible', 'amazing', 'awful', 'helpful', 'confusing',
    'easy', 'difficult', 'fast', 'slow', 'useful', 'useless'
  ];
  
  const lowerText = messageText.toLowerCase();
  
  // Check if message contains feedback keywords
  const containsFeedbackWords = feedbackKeywords.some(keyword => 
    lowerText.includes(keyword)
  );
  
  // Check if message is longer than typical reminder responses (likely feedback)
  const isLongMessage = messageText.length > 20;
  
  // Check for common feedback patterns
  const feedbackPatterns = [
    /could you/i,
    /would be nice/i,
    /i think/i,
    /in my opinion/i,
    /suggestion/i,
    /recommend/i,
    /please add/i,
    /please fix/i
  ];
  
  const matchesPattern = feedbackPatterns.some(pattern => pattern.test(messageText));
  
  return containsFeedbackWords || (isLongMessage && matchesPattern);
}

