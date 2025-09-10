// services/calendar.ts
import { ScheduleConfig, FormSubmission, AIContext } from '../types';

export class CalendarService {
  constructor() {
    console.log('Calendar service initialized in logging mode');
  }

  private generateMeetingDescription(submission: FormSubmission, context: AIContext): string {
    return `Meeting with ${submission.firstName} ${submission.lastName} from ${submission.company}.\nContext: ${JSON.stringify(context, null, 2)}`;
  }

  private getNextAvailableSlot(): string {
    // Return current time + 1 hour as the default slot
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date.toISOString();
  }

  private getEndTime(duration: number): string {
    // Return current time + 1 hour + duration minutes
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(date.getMinutes() + duration);
    return date.toISOString();
  }

  async scheduleMeeting(
    submission: FormSubmission,
    config: ScheduleConfig,
    context: AIContext
  ): Promise<string> {
    const event = {
      summary: `Meeting with ${submission.firstName} ${submission.lastName} - ${submission.company}`,
      description: this.generateMeetingDescription(submission, context),
      attendees: [
        { email: submission.email },
        { email: 'investor@company.com' } // Would be replaced with actual investor email
      ],
      start: {
        dateTime: this.getNextAvailableSlot(),
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: this.getEndTime(config.duration),
        timeZone: 'America/New_York',
      },
    };

    console.log('Calendar event would be created:', JSON.stringify(event, null, 2));
    return 'mock-event-id'; // Return a mock event ID for compatibility
  }
}
