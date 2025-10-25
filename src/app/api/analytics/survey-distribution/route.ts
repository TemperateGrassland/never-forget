import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SURVEY_SCHEMAS, getSurveySchema, processSurveyResponses } from "@/lib/surveySchemas";

function getDateFromTimeframe(timeframe: string): Date {
  const now = new Date();
  const days = parseInt(timeframe.replace('d', ''));
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status using auth() method
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = adminEmails.includes(session.user.email);
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('template');
    const timeframe = searchParams.get('timeframe') || '30d';
    
    const where = {
      ...(templateName && { 
        metadata: { path: ['templateName'], equals: templateName }
      }),
      createdAt: { gte: getDateFromTimeframe(timeframe) }
    };
    
    const responses = await prisma.flowResponse.findMany({ 
      where,
      select: {
        metadata: true,
        responses: true,
        createdAt: true
      }
    });
    
    // Type cast Prisma JsonValue to our expected format
    const typedResponses = responses.map(response => ({
      metadata: response.metadata as { templateName?: string; [key: string]: unknown } | null,
      responses: response.responses as { 
        selected_answer?: string; 
        choice?: string; 
        answer?: string; 
        comment?: string; 
        feedback_text?: string; 
        [key: string]: unknown 
      },
      createdAt: response.createdAt
    }));
    
    const processed = processSurveyResponses(typedResponses);
    
    // Group by template and ensure all possible answers are included
    interface DistributionData {
      question: string;
      totalResponses: number;
      answers: Record<string, number>;
    }
    
    const distributions = processed.reduce((acc: Record<string, DistributionData>, response) => {
      if (!acc[response.templateName]) {
        const schema = getSurveySchema(response.templateName);
        if (!schema) return acc; // Skip if no schema defined
        
        // Initialize with all possible answers set to 0
        const answers: Record<string, number> = {};
        schema.possibleAnswers.forEach(answer => {
          answers[answer] = 0;
        });
        
        acc[response.templateName] = {
          question: schema.question,
          totalResponses: 0,
          answers
        };
      }
      
      acc[response.templateName].totalResponses++;
      
      // Only increment if the answer is in our schema
      const schema = getSurveySchema(response.templateName);
      if (schema && schema.possibleAnswers.includes(response.selectedAnswer)) {
        acc[response.templateName].answers[response.selectedAnswer]++;
      }
      
      return acc;
    }, {});
    
    // Also include templates that have no responses but exist in schema
    SURVEY_SCHEMAS.forEach(schema => {
      if (!distributions[schema.templateName]) {
        const answers: Record<string, number> = {};
        schema.possibleAnswers.forEach(answer => {
          answers[answer] = 0;
        });
        
        distributions[schema.templateName] = {
          question: schema.question,
          totalResponses: 0,
          answers
        };
      }
    });
    
    return NextResponse.json(distributions);
  } catch (error) {
    console.error('Error fetching survey distribution:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}