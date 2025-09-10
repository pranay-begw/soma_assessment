import { AirtableService } from '../src/services/airtable';
import { WebScraperService } from '../src/services/scraper';
import { OpenAIService } from '../src/services/openai';
import { RulesEngine } from '../src/services/rulesEngine';
import { EmailService } from '../src/services/email';
import { CalendarService } from '../src/services/calendar';
import { AutomationOrchestrator } from '../src/services/orchestrator';
import dotenv from 'dotenv';

dotenv.config();

const tableName = 'Leads';
const airtableService = new AirtableService(tableName);
const scraperService = new WebScraperService();
const openaiService = new OpenAIService();
const rulesEngine = new RulesEngine();
const emailService = new EmailService();
const calendarService = new CalendarService();

const orchestrator = new AutomationOrchestrator(
  airtableService,
  scraperService,
  openaiService,
  rulesEngine,
  emailService,
  calendarService
);

const formData = {
  firstName: 'John',
  lastName: 'Doe',
  email: `john-${Date.now()}@gmail.com`, // unique each run
  company: 'Soma',
  position: 'CEO',
  linkedinUrl: '',
  companyWebsite: '',
  message: 'We need funding',
  fundingStage: 'series-a' as const,
  fundingAmount: 1000000,
  industry: 'Biology',
  submittedAt: new Date()
};

/**
 * Airtable Tests
 */
async function testTableExists() {
  console.log('Testing Airtable tableExists...');
  const exists = await airtableService.tableExists(tableName);
  console.log('Table exists:', exists);
}

async function testFindOrCreateTable() {
  console.log('Testing Airtable findOrCreateTable...');
  const table = await airtableService.findOrCreateTable(tableName);
  console.log('Table found/created:', table);
}

async function testCreateRecord() {
  console.log('Testing Airtable createRecord...');
  const recordId = await airtableService.createRecord(formData);
  console.log('Record created with ID:', recordId);
  return recordId;
}

async function testUpdateRecord(recordId: string) {
  console.log('🔍 Testing Airtable updateRecord...');
  await airtableService.updateRecord(recordId, {
    'Rules Executed': 'high-priority-lead',
    'Status': 'Contacted'
  });
  console.log('Record updated:', recordId);
}

/**
 * Scraper Tests
 */
async function testScraper() {
  console.log('Testing scraper on company website...');
  const snippet = await scraperService.scrapeTextFromPage(formData.companyWebsite);
  console.log('Scraped snippet:', snippet?.slice(0, 200), '...');
}

/**
 * OpenAI Service Tests
 */
async function testOpenAI() {
  console.log('Testing OpenAI context generation...');
  const ctx = await openaiService.generateMeetingContext(formData, '', 'Sample scraped text about Greptile');
  console.log('Generated AI Context:', ctx);

  console.log('🔍 Testing OpenAI email generation...');
  const email = await openaiService.generateEmail('funding-followup', ctx, formData);
  console.log('Generated Email:\n', email);
}

/**
 * Rules Engine Tests
 */
async function testRulesEngine() {
  console.log('Testing rules evaluation...');
  const rules = await rulesEngine.evaluateSubmission(formData);
  console.log('Matching rules:', rules);
}

/**
 * Email Service Tests
 */
async function testEmailService() {
  console.log('Testing email service (dry run)...');
  await emailService.sendEmail(
    formData.email,
    'Test Subject',
    'This is a test email body.'
  );
  console.log('Email sent (or simulated).');
}

/**
 * Full Orchestrator Test
 */
async function testOrchestrator() {
  console.log('Running full orchestrator test...');
  await orchestrator.processSubmission(formData);
  console.log('Orchestrator processed submission end-to-end!');
}

/**
 * Run tests sequentially
 */
(async function runAllTests() {
  try {
    await testTableExists();
    await testFindOrCreateTable();
    const recordId = await testCreateRecord();
    await testUpdateRecord(recordId);

    await testScraper();
    await testOpenAI();
    await testRulesEngine();
    await testEmailService();

    await testOrchestrator();
  } catch (err) {
    console.error('Test run failed:', err);
  }
})();
