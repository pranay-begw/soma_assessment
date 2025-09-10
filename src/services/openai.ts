// services/openai.ts
import OpenAI from 'openai';
import { FormSubmission, AIContext } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
  }

  async generateMeetingContext(
    submission: FormSubmission,
    linkedinData?: string,
    companyData?: string
  ): Promise<AIContext> {
    const prompt = `
      Generate a concise meeting context for an investor meeting with the following information:

      Personal Information:
      - Name: ${submission.firstName} ${submission.lastName}
      - Position: ${submission.position}
      - Company: ${submission.company}
      - Industry: ${submission.industry}
      - Funding Stage: ${submission.fundingStage}
      - Message: ${submission.message}

      ${linkedinData ? `LinkedIn Profile Data:\n${linkedinData}\n` : ''}
      ${companyData ? `Company Website Data:\n${companyData}\n` : ''}

      Please provide:
      1. A brief personal background summary
      2. Company information and context
      3. Meeting purpose and objectives
      4. Key insights and talking points

      Keep it professional and concise for investor review.
    `;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content || '';
      
      // Parse the AI response into structured format
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate meeting context');
    }
  }

  private parseAIResponse(content: string): AIContext {
    // Simple parsing logic - in production, you might want more sophisticated parsing
    const sections = content.split('\n\n');
    
    return {
      personalBackground: sections[0] || '',
      companyInfo: sections[1] || '',
      meetingPurpose: sections[2] || '',
      keyInsights: sections.slice(3) || []
    };
  }

  async generateEmail(template: string, context: AIContext, submission: FormSubmission): Promise<string> {
    const prompt = `
      Generate a short and snappy professional response to the person who submitted the form saying we will get in touch soon:

      Template: ${template}

      Context:
      ${JSON.stringify(context, null, 2)}
      
      Submission Details:
      ${JSON.stringify(submission, null, 2)}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.8,
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Email generation error:', error);
      throw new Error('Failed to generate email');
    }
  }

  async summarizeCompanyInfo(companyWebsite?: string): Promise<string> {
    const prompt = `
      Given information regarding this company from their website, give me a one-liner that explains their unique proposition.

      Website information:
      ${companyWebsite}`;

      try {
        const completion = await this.client.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.8,
        });
  
        return completion.choices[0].message.content || '';
      } catch (error) {
        console.error('Error creating description:', error);
        throw new Error('Failed to generate description');
      }
  }
}