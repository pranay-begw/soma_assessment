// services/airtable.ts
import Airtable from 'airtable';
import { FormSubmission } from '../types';

// Type for Airtable table structure
interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    options?: Record<string, unknown>;
  }>;
}

// Type for updates to Airtable records
type AirtableUpdate = {
  [key: string]: string | number | boolean | readonly string[] | undefined;
};

export class AirtableService {
  private base: Airtable.Base;
  private tableName: string;
  private apiKey: string;
  private baseId: string;

  constructor(tableName: string = 'Leads') {
    this.apiKey = process.env.AIRTABLE_API_KEY || '';
    this.baseId = process.env.AIRTABLE_BASE_ID || '';

    if (!this.apiKey) {
      throw new Error('AIRTABLE_API_KEY is not set in environment variables');
    }
    if (!this.baseId) {
      throw new Error('AIRTABLE_BASE_ID is not set in environment variables');
    }

    Airtable.configure({ apiKey: this.apiKey });
    this.base = Airtable.base(this.baseId);
    this.tableName = tableName;
  }

  /**
   * Checks if a table exists in the Airtable base
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }

      const data = await response.json();
      return data.tables.some((table: AirtableTable) => table.name === tableName);
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  /**
   * Creates a new table in the Airtable base with the required fields
   * @param tableName Optional custom table name (defaults to the instance tableName)
   */
  async findOrCreateTable(tableName: string = this.tableName): Promise<void> {
    try {
      // First check if table already exists
      const exists = await this.tableExists(tableName);
      if (exists) {
        console.log(`Table "${tableName}" already exists`);
        this.tableName = tableName;
        return;
      }

      // If not, create the table
      console.log(`Creating table "${tableName}"...`);
      const response = await fetch(
        `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: tableName,
            fields: [
              {
                name: 'First Name',
                type: 'singleLineText',
                description: 'First name of the lead'
              },
              {
                name: 'Last Name',
                type: 'singleLineText',
                description: 'Last name of the lead'
              },
              {
                name: 'Email',
                type: 'email',
                description: 'Email address of the lead'
              },
              {
                name: 'Company',
                type: 'singleLineText',
                description: 'Company name'
              },
              {
                name: 'Position',
                type: 'singleLineText',
                description: 'Job position'
              },
              {
                name: 'LinkedIn URL',
                type: 'url',
                description: 'LinkedIn profile URL'
              },
              {
                name: 'Company Website',
                type: 'url',
                description: 'Company website URL'
              },
              {
                name: 'Message',
                type: 'multilineText',
                description: 'Message from the lead'
              },
              {
                name: 'Funding Stage',
                type: 'singleSelect',
                options: {
                  choices: [
                    { name: 'pre-seed' },
                    { name: 'seed' },
                    { name: 'series-a' },
                    { name: 'series-b' },
                    { name: 'later-stage' }
                  ]
                },
                description: 'Current funding stage of the company'
              },
              {
                name: 'Funding Amount',
                type: 'currency',
                options: {
                  symbol: '$',
                  precision: 0,
                },
                description: 'Funding amount in USD'
              },
              {
                name: 'Industry',
                type: 'singleLineText',
                description: 'Industry of the company'
              },
              {
                name: 'Submitted At',
                type: 'dateTime',
                options: {
                  dateFormat: { name: 'iso' },
                  timeFormat: { name: '24hour' },
                  timeZone: 'utc'
                },
                description: 'When the form was submitted'
              },
              {
                name: 'Status',
                type: 'singleSelect',
                options: {
                  choices: [
                    { name: 'New', color: 'blueBright' },
                    { name: 'Contacted', color: 'greenBright' },
                    { name: 'Closed', color: 'redBright' }
                  ]
                },
                description: 'Current status of the lead'
              },
              {
                name: 'AI Context',
                type: 'multilineText',
                description: 'Additional context generated by AI'
              },
              {
                name: 'LinkedIn Data',
                type: 'multilineText',
                description: 'Raw scraped LinkedIn profile data'
              },
              {
                name: 'One Liner',
                type: 'multilineText',
                description: 'Raw scraped company website data'
              },
              {
                name: 'Rules Executed',
                type: 'singleSelect',
                options: {
                  choices: [
                    { name: 'high-priority-lead' },
                    { name: 'needs-followup' },
                    { name: 'schedule-meeting' }
                  ]
                },
                description: 'Automation rules that were triggered'
              }
            ]                        
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create table: ${JSON.stringify(error)}`);
      }

      this.tableName = tableName;
      return await response.json();
    } catch (error) {
      console.error('Error creating Airtable table:', error);
      throw new Error('Failed to create table in Airtable');
    }
  }

  async createRecord(submission: FormSubmission): Promise<string> {
    try {
      const record = await this.base(this.tableName).create({
        'First Name': submission.firstName,
        'Last Name': submission.lastName,
        'Email': submission.email,
        'Company': submission.company,
        'Position': submission.position,
        'LinkedIn URL': submission.linkedinUrl || '',
        'Company Website': submission.companyWebsite || '',
        'Message': submission.message,
        'Funding Stage': submission.fundingStage,
        'Funding Amount': submission.fundingAmount || 0,
        'Industry': submission.industry,
        'Submitted At': submission.submittedAt.toISOString(),
        'Status': 'New'
      });

      return record.id;
    } catch (error) {
      console.error('Error creating Airtable record:', error);
      throw new Error('Failed to create record in Airtable');
    }
  }

  async updateRecord(recordId: string, updates: AirtableUpdate): Promise<void> {
    try {
      await this.base(this.tableName).update(recordId, updates);
    } catch (error) {
      console.error('Error updating Airtable record:', error);
      throw new Error('Failed to update record in Airtable');
    }
  }
}
