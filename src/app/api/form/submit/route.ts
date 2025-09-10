import { NextRequest, NextResponse } from 'next/server';
import { FormSubmissionSchema } from '@/utils/validation';
import { AutomationOrchestrator } from '@/services/orchestrator';
import { AirtableService } from '@/services/airtable';
import { WebScraperService } from '@/services/scraper';
import { Rule } from '@/types';
import { OpenAIService } from '@/services/openai';
import { RulesEngine } from '@/services/rulesEngine';
import { EmailService } from '@/services/email';
import { CalendarService } from '@/services/calendar';

// Ensure Node.js runtime for Puppeteer and Node-only libs
export const runtime = 'nodejs';
// Avoid any caching for this API route during dev/testing
export const dynamic = 'force-dynamic';

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // limit each IP to 10 requests per windowMs
};

// Simple in-memory rate limiting
const rateLimitMap = new Map();

// Initialize services (you might want to move this to a separate file)
const getOrchestrator = (() => {
  let orchestrator: AutomationOrchestrator | null = null;
  
  return () => {
    if (!orchestrator) {
      const airtableService = new AirtableService(
        "Leads"
      );
      
      const scraperService = new WebScraperService();
      
      const openaiService = new OpenAIService();
      
      const rulesEngine = new RulesEngine();
      
      const emailService = new EmailService();
      const calendarService = new CalendarService();
      
      orchestrator = new AutomationOrchestrator(
        airtableService,
        scraperService,
        openaiService,
        rulesEngine,
        emailService,
        calendarService
      );
    }
    return orchestrator;
  };
})();

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/form/submit: received request');
    // Rate limiting check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const currentTime = Date.now();
    const windowStart = currentTime - RATE_LIMIT.windowMs;

    // Clean up old entries
    for (const [ip, timestamp] of rateLimitMap.entries()) {
      if (timestamp < windowStart) {
        rateLimitMap.delete(ip);
      }
    }

    // Check rate limit
    const requestCount = Array.from(rateLimitMap.values())
      .filter(timestamp => timestamp > windowStart)
      .length;

    if (requestCount >= RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Update rate limit
    rateLimitMap.set(ip, currentTime);

    // Validate form data
    const body = await req.json();
    const validatedData = FormSubmissionSchema.parse(body);
    console.log('POST /api/form/submit: validation passed for');
    
    const submission = {
      ...validatedData,
      submittedAt: new Date(),
    };

    // Diagnostics: environment and Airtable connectivity
    console.log('POST /api/form/submit: env presence', {
      hasAirKey: Boolean(process.env.AIRTABLE_API_KEY),
      hasBaseId: Boolean(process.env.AIRTABLE_BASE_ID),
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
    });

    try {
      const metaUrl = `https://api.airtable.com/v0/meta/bases/${process.env.AIRTABLE_BASE_ID}/tables`;
      const metaResp = await fetch(metaUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('POST /api/form/submit: Airtable meta status', metaResp.status);
      if (!metaResp.ok) {
        const text = await metaResp.text();
        console.log('POST /api/form/submit: Airtable meta error body', text.slice(0, 500));
      }
    } catch (e) {
      console.error('POST /api/form/submit: Airtable connectivity check failed', e);
    }

    // Get orchestrator instance
    console.log('POST /api/form/submit: initializing orchestrator');
    const orchestrator = getOrchestrator();

    // Process asynchronously
    console.log('POST /api/form/submit: calling orchestrator.processSubmission');
    await orchestrator.processSubmission(submission).then(() => {
      console.log('POST /api/form/submit: orchestrator.processSubmission completed');
    }).catch(error => {
      console.error('Background processing error:', error);
    });

    // Return immediate response
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully. We will be in touch soon!',
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    
    if (error instanceof Error) {
      // Type guard for ZodError
      if (error.name === 'ZodError' && 'errors' in error) {
        const zodError = error as { errors: Array<{ message: string; path: (string | number)[]; code: string }> };
        return NextResponse.json(
          {
            success: false,
            message: 'Invalid form data',
            errors: zodError.errors,
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight
// This is necessary for some frontend frameworks
// that send a preflight request before the actual request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
