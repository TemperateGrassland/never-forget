import { prisma } from '@/lib/prisma';
import { Reminder, User } from '@/types';

// Additional interfaces for WhatsApp API
interface TemplateParameter {
  type: 'text';
  parameter_name: string;
  text: string;
}

interface WhatsAppTemplateRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
      policy: string;
    };
    components: Array<{
      type: 'body';
      parameters: TemplateParameter[];
    }>;
  };
}

interface WhatsAppFlowTemplateRequest {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
      policy: string;
    };
    components: Array<{
      type: 'button';
      sub_type: 'flow';
      index: string;
      parameters: Array<{
        type: 'action';
        action: {
          flow_token: string;
        };
      }>;
    }>;
  };
}

interface UserWithReminders extends User {
  reminders: Reminder[];
}

interface CustomTemplateData {
  context?: string;
  message?: string;
  [key: string]: string | undefined;
}

type AudienceType = 'all' | 'subscribers';
type TemplateType = 'reminder' | 'daily_reminder' | 'feedback_request' | 'announcement';
type FlowTemplateType = 'ease_feedback' | 'satisfaction_survey' | 'feature_feedback';

// Template parameter builder function
function buildTemplateParameters(
  templateName: TemplateType, 
  user: UserWithReminders, 
  customData?: CustomTemplateData
): TemplateParameter[] {
  switch (templateName) {
    case 'reminder':
    case 'daily_reminder':
      return [
        {
          type: 'text' as const,
          parameter_name: 'text',
          text: user.firstName || 'User'
        },
        ...user.reminders.flatMap((reminder, index) => [
          {
            type: 'text' as const,
            parameter_name: `reminder_${index + 1}`,
            text: reminder.title
          },
          {
            type: 'text' as const,
            parameter_name: `when_${index + 1}`,
            text: reminder.createdAt.toISOString().split('T')[0]
          }
        ])
      ];
    
    case 'feedback_request':
      return [
        { 
          type: 'text' as const, 
          parameter_name: 'text', 
          text: user.firstName || 'User' 
        },
        { 
          type: 'text' as const, 
          parameter_name: 'context', 
          text: customData?.context || 'your recent experience' 
        }
      ];
      
    case 'announcement':
      return [
        { 
          type: 'text' as const, 
          parameter_name: 'text', 
          text: user.firstName || 'User' 
        },
        { 
          type: 'text' as const, 
          parameter_name: 'message', 
          text: customData?.message || 'We have updates to share!' 
        }
      ];
      
    default:
      return [{ 
        type: 'text' as const, 
        parameter_name: 'text', 
        text: user.firstName || 'User' 
      }];
  }
}

export async function buildMetaApiRequests(
  templateName: TemplateType = 'reminder',
  audience: AudienceType = 'all',
  customData?: CustomTemplateData
): Promise<WhatsAppTemplateRequest[]> {
  // Build user query based on audience
  const whereClause = {
    phoneNumber: { not: null }, // Always require phone number
    ...(audience === 'subscribers' && { subscriptionStatus: 'active' }),
  };

  // Get users with their associated reminders
  const usersWithReminders = await prisma.user.findMany({
    where: whereClause,
    include: {
      reminders: {
        where: { isComplete: false }, // Only fetch pending reminders
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log("usersWithReminders:", usersWithReminders.length, "template:", templateName);

  // Format the data into JSON payloads for Meta API
  return usersWithReminders
    .filter((user): user is UserWithReminders => user.phoneNumber !== null)
    .map((user): WhatsAppTemplateRequest => ({
        messaging_product: 'whatsapp',
        to: user.phoneNumber!,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: 'en_GB',
                policy: 'deterministic'
            },
            components: [
                {
                    type: 'body',
                    parameters: buildTemplateParameters(templateName, user, customData)
                }
            ]
        }
    }));
}

// Convenience functions for different template types
export async function buildReminderRequests(): Promise<WhatsAppTemplateRequest[]> {
  return buildMetaApiRequests('daily_reminder', 'all');
}

export async function buildFeedbackRequests(context?: string): Promise<WhatsAppTemplateRequest[]> {
  return buildMetaApiRequests('feedback_request', 'subscribers', { context });
}

export async function buildFlowFeedbackRequests(
  flowTemplateName: FlowTemplateType = 'ease_feedback',
  audience: AudienceType = 'subscribers'
): Promise<WhatsAppFlowTemplateRequest[]> {
  // Build user query based on audience
  const whereClause = {
    phoneNumber: { not: null }, // Always require phone number
    ...(audience === 'subscribers' && { subscriptionStatus: 'active' }),
  };

  // Get users for flow feedback
  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      phoneNumber: true,
    },
  });

  console.log("Flow feedback users:", users.length, "template:", flowTemplateName);

  // Format the data into JSON payloads for Meta API with Flow button
  return users
    .filter((user): user is { phoneNumber: string } => user.phoneNumber !== null)
    .map((user): WhatsAppFlowTemplateRequest => ({
      messaging_product: 'whatsapp',
      to: user.phoneNumber,
      type: 'template',
      template: {
        name: flowTemplateName,
        language: {
          code: 'en_GB',
          policy: 'deterministic'
        },
        components: [
          {
            type: 'button',
            sub_type: 'flow',
            index: '0',
            parameters: [
              {
                type: 'action',
                action: {
                  flow_token: flowTemplateName
                }
              }
            ]
          }
        ]
      }
    }));
}

export async function buildAnnouncementRequests(message?: string): Promise<WhatsAppTemplateRequest[]> {
  return buildMetaApiRequests('announcement', 'all', { message });
}