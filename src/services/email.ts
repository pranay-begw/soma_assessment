// services/email.ts
export class EmailService {
  constructor() {
    console.log('Email service initialized in logging mode');
  }

  async sendEmail(
    to: string,
    subject: string,
    content: string,
    from: string = 'noreply@company.com'
  ): Promise<void> {
    const emailData = {
      from,
      to,
      subject,
      content,
      timestamp: new Date().toISOString()
    };

    console.log('Email would be sent:', JSON.stringify(emailData, null, 2));
  }
}