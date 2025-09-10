// services/automation-orchestrator.ts
import { AIContext, EmailConfig, FormSubmission, ScheduleConfig } from '../types';
import { AirtableService } from './airtable';
import { WebScraperService } from './scraper';
import { OpenAIService } from './openai';
import { RulesEngine } from './rulesEngine';
import { EmailService } from './email';
import { CalendarService } from './calendar';
import { searchSearch } from './searchScrape';
import { extract } from 'cheerio/dist/commonjs/static';

export class AutomationOrchestrator {
  constructor(
    private airtableService: AirtableService,
    private scraperService: WebScraperService,
    private openaiService: OpenAIService,
    private rulesEngine: RulesEngine,
    private emailService: EmailService,
    private calendarService: CalendarService
  ) {}

  async processSubmission(submission: FormSubmission): Promise<void> {
    try {
      console.log('Orchestrator: start processing for:', submission.email);

      // Step 1: Save to Airtable
      console.log('Orchestrator: ensuring Airtable table exists');
      const table = await this.airtableService.findOrCreateTable();
      console.log('Orchestrator: creating Airtable record');
      const recordId = await this.airtableService.createRecord(submission);
      console.log('Orchestrator: created Airtable record:', recordId);

      // Step 2: Scrape additional context
      console.log('Orchestrator: scraping context');
      let linkedinData, companyData, publicInfo;
      let extractedUrls: { linkedin?: string; website?: string } = {};
      
      // // Scrape LinkedIn if URL provided
      // if (submission.linkedinUrl) {
      //   console.log('Orchestrator: scraping LinkedIn');
      // }
      
      if (submission.companyWebsite) {
        console.log('Orchestrator: scraping company website');
        companyData = await this.scraperService.scrapeTextFromPage(submission.companyWebsite);
      }

      // If no LinkedIn or website data, search for public info
      if (!linkedinData && !companyData) {
        console.log('Orchestrator: no LinkedIn/website provided, searching for public info');
        const searchResults = await searchSearch(
          `${submission.firstName} ${submission.lastName} ${submission.company}`
        );
        
        publicInfo = searchResults
          .map((result: { title: string; snippet: string }) => `${result.title}: ${result.snippet}`)
          .join('\n\n');

        extractedUrls = this.extractUrlsFromPublicInfo(searchResults);
        console.log("found these URLs in the public results: ", extractedUrls);
      }


      // Step 3: Generate AI context
      console.log('Orchestrator: generating AI context');
      const aiContext = await this.openaiService.generateMeetingContext(
        submission,
        linkedinData,
        companyData || publicInfo
      );

      const companySummary = await this.openaiService.summarizeCompanyInfo(
        companyData || publicInfo
      );

      console.log('Orchestrator: updating Airtable with AI context and scraped data');      
      const formattedContext = this.formatAIContextAsText(aiContext);

      let linkedinUrl = submission.linkedinUrl || '';
      let companyWebsite = submission.companyWebsite || '';

      if (!linkedinUrl && extractedUrls.linkedin) {
        linkedinUrl = extractedUrls.linkedin;
      }

      if (!companyWebsite && extractedUrls.website) {
        companyWebsite = extractedUrls.website;
      }

      await this.airtableService.updateRecord(recordId, {
        'AI Context': formattedContext,
        'LinkedIn Data': linkedinData || '',
        'One Liner': companySummary || '',
        'LinkedIn URL': linkedinUrl,
        'Company Website': companyWebsite,
      });

      // Evaluate rules and trigger actions
      console.log('Orchestrator: evaluating rules for submission: ', submission);
      const matchingRules = await this.rulesEngine.evaluateSubmission(submission);
      console.log('Rule eval result: ', matchingRules)
      for (const rule of matchingRules) {
        console.log('Orchestrator: executing rule:', rule.name);
        
        for (const action of rule.actions) {
          switch (action.type) {
            case 'email':
              console.log('Orchestrator: email action');
              await this.handleEmailAction(submission, action.config as EmailConfig, aiContext);
              break;
            case 'schedule':
              console.log('Orchestrator: schedule action');
              await this.handleScheduleAction(submission, action.config as ScheduleConfig, aiContext);
              break;
          }
        }

        await this.airtableService.updateRecord(recordId, {
          'Rules Executed': rule.name,
          'Status': 'Contacted'
        });
      }

      console.log('Orchestrator: successfully processed submission');
      
    } catch (error) {
      console.error('Orchestrator: error processing submission:', error);
      throw error;
    }
  }

  private async handleEmailAction(
    submission: FormSubmission,
    config: EmailConfig,
    context: AIContext
  ): Promise<void> {
    const emailContent = await this.openaiService.generateEmail(
      config.template,
      context,
      submission
    );

    if (config.requiresReview) {
      console.log('Email requires review before sending');
      // In production, you'd queue this for human review
      return;
    }

    await this.emailService.sendEmail(
      submission.email,
      config.subject,
      emailContent
    );
  }

  private async handleScheduleAction(
    submission: FormSubmission,
    config: ScheduleConfig,
    context: AIContext
  ): Promise<void> {
    if (config.autoSchedule) {
      const meetingId = await this.calendarService.scheduleMeeting(
        submission,
        config,
        context
      );
      console.log('Scheduled meeting:', meetingId);
    } else {
      console.log('Manual scheduling required');
      // Queue for manual scheduling
    }
  }

  private formatAIContextAsText(context: AIContext): string {
    const sections = [];
    
    if (context.personalBackground) {
      sections.push(`PERSONAL BACKGROUND:\n${context.personalBackground}`);
    }
    
    if (context.companyInfo) {
      sections.push(`\nCOMPANY INFORMATION:\n${context.companyInfo}`);
    }
    
    if (context.meetingPurpose) {
      sections.push(`\nMEETING PURPOSE:\n${context.meetingPurpose}`);
    }
    
    if (context.keyInsights && context.keyInsights.length > 0) {
      sections.push(`\nKEY INSIGHTS:\n${context.keyInsights.join('\n\n')}`);
    }
    
    return sections.join('\n\n');
  }

  private extractUrlsFromPublicInfo(
    searchResults: { title: string; link: string; snippet: string }[]
  ): { linkedin?: string; website?: string } {
    if (!searchResults || searchResults.length === 0) return {};
  
    const urls: { linkedin?: string; website?: string } = {};
  
    for (const result of searchResults) {
      const url = result.link;
  
      // LinkedIn profile or company page
      if (!urls.linkedin && url.includes("linkedin.com")) {
        urls.linkedin = url;
      }
  
      // Company website (filter out socials + common junk)
      if (
        !urls.website &&
        !url.includes("linkedin.com") &&
        !url.includes("google.com") &&
        !url.includes("facebook.com") &&
        !url.includes("twitter.com") &&
        !url.includes("instagram.com") &&
        !url.includes("youtube.com") &&
        !url.includes("github.com")
      ) {
        try {
          const domain = new URL(url).hostname.toLowerCase();
          if (domain) {
            urls.website = url;
          }
        } catch {
          // ignore invalid URLs
        }
      }
  
      // Stop early if we’ve found both
      if (urls.linkedin && urls.website) break;
    }
  
    return urls;
  }  
}