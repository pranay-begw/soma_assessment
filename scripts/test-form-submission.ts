// import { AirtableService } from '../src/services/airtable';
// import { WebScraperService } from '../src/services/scraper';


// // scripts/test-form-submission.ts
// const axios = require('axios');
// const dotenv = require('dotenv');

// // Load environment variables
// dotenv.config();

// // Form submission data
// const _ = {
//   firstName: 'Pranay',
//   lastName: 'Begwani',
//   email: `test-${Date.now()}@example.com`, // Unique email for each test
//   company: 'Test Company2',
//   position: 'CTO',
//   linkedinUrl: 'https://linkedin.com/in/pranay-begwani',
//   companyWebsite: 'https://pranaybegwani.com',
//   message: 'This is a test submission from the test script2',
//   fundingStage: 'later-stage',
//   fundingAmount: 10000000,
//   industry: 'Technology',
//   submittedAt: new Date().toISOString()
// };

// const formData = {
//   firstName: 'Daksh',
//   lastName: 'Gupta',
//   email: 'Daksh@greptile.com',
//   company: 'Greptile',
//   position: 'CEO',
//   linkedinUrl: 'https://linkedin.com/in/dakshg',
//   companyWebsite: 'https://greptile.com',
//   message: 'We need funding',
//   fundingStage: 'series-a',
//   fundingAmount: 10000000,
//   industry: 'Technology',
//   submittedAt: new Date().toISOString()
// }

// const tableName = 'Leads';
// const airtableService = new AirtableService(tableName);

// async function testTableExists(tableName: string = 'Leads') {
//   console.log('🚀 AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY);
//   console.log('🚀 BASE_ID:', process.env.AIRTABLE_BASE_ID);
//   console.log('🚀 Starting form submission test...');
//   const tableExists = await airtableService.tableExists(tableName);
//   console.log('🚀 Table exists:', tableExists);
// }

// // testTableExists();  --- works

// async function testFindOrCreateTable(tableName: string = 'Leads') {
//   console.log('🚀 AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY);
//   console.log('🚀 BASE_ID:', process.env.AIRTABLE_BASE_ID);
//   console.log('🚀 Starting form submission test...');
//   const tableExists = await airtableService.findOrCreateTable(tableName);
//   console.log('🚀 Table found or created:', tableExists);
// }

// // testFindOrCreateTable();

// async function testCreateRecord(tableName: string = 'Leads') {
//   console.log('🚀 AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY);
//   console.log('🚀 BASE_ID:', process.env.AIRTABLE_BASE_ID);
//   console.log('🚀 Starting form submission test...');
//   const recordId = await airtableService.createRecord({
//     ...formData,
//     submittedAt: new Date(),
//     fundingStage: formData.fundingStage as 'series-a' | 'pre-seed' | 'seed' | 'series-b' | 'later-stage',
//     fundingAmount: formData.fundingAmount || 0,
//   });
//   console.log('🚀 Record created:', recordId);
// }

// // testCreateRecord();

// async function testFormSubmission(tableName: string = 'Leads') {
//   try {
//     console.log('🚀 Starting form submission test...');
//     console.log('📝 Form data:', JSON.stringify(formData, null, 2));
    
//     const response = await fetch('http://localhost:3000/api/form/submit', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(formData),
//     });

//     const data = await response.json();
//     console.log('✅ Form submitted successfully!');
//     console.log('📋 Response:', JSON.stringify(data, null, 2));
//   } catch (error) {
//     console.error('❌ Form submission failed:');
    
//     if (error) {
//       // The request was made and the server responded with a status code
//       // that falls out of the range of 2xx
//       console.error('Error', error)
//     }
//   }
// }
// testFormSubmission();

// async function testFetchPublicInfo(website: string) {
//   const scraper = new WebScraperService();
//   const snippet = await scraper.scrapeTextFromPage(website);
//   console.log('Public info: ', snippet);
// }

// // testFetchPublicInfo("https://www.spacex.com")

// async function testUpdateRecord() {
//   airtableService.updateRecord("recV5tW4V50vNR6se", {
//     "Rules Executed": "high-priority-lead",
//     "Status": "Contacted"
//   });
// }

// // testUpdateRecord();


// scripts/test-form-submission.ts
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
  firstName: 'Daksh',
  lastName: 'Gupta',
  email: `daksh-${Date.now()}@greptile.com`, // unique each run
  company: 'Greptile',
  position: 'CEO',
  linkedinUrl: 'https://linkedin.com/in/dakshg',
  companyWebsite: 'https://greptile.com',
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
  console.log('🔍 Testing Airtable tableExists...');
  const exists = await airtableService.tableExists(tableName);
  console.log('✅ Table exists:', exists);
}

async function testFindOrCreateTable() {
  console.log('🔍 Testing Airtable findOrCreateTable...');
  const table = await airtableService.findOrCreateTable(tableName);
  console.log('✅ Table found/created:', table);
}

async function testCreateRecord() {
  console.log('🔍 Testing Airtable createRecord...');
  const recordId = await airtableService.createRecord(formData);
  console.log('✅ Record created with ID:', recordId);
  return recordId;
}

async function testUpdateRecord(recordId: string) {
  console.log('🔍 Testing Airtable updateRecord...');
  await airtableService.updateRecord(recordId, {
    'Rules Executed': 'high-priority-lead',
    'Status': 'Contacted'
  });
  console.log('✅ Record updated:', recordId);
}

/**
 * Scraper Tests
 */
async function testScraper() {
  console.log('🔍 Testing scraper on company website...');
  const snippet = await scraperService.scrapeTextFromPage(formData.companyWebsite);
  console.log('✅ Scraped snippet:', snippet?.slice(0, 200), '...');
}

/**
 * OpenAI Service Tests
 */
async function testOpenAI() {
  console.log('🔍 Testing OpenAI context generation...');
  const ctx = await openaiService.generateMeetingContext(formData, '', 'Sample scraped text about Greptile');
  console.log('✅ Generated AI Context:', ctx);

  console.log('🔍 Testing OpenAI email generation...');
  const email = await openaiService.generateEmail('funding-followup', ctx, formData);
  console.log('✅ Generated Email:\n', email);
}

/**
 * Rules Engine Tests
 */
async function testRulesEngine() {
  console.log('🔍 Testing rules evaluation...');
  const rules = await rulesEngine.evaluateSubmission(formData);
  console.log('✅ Matching rules:', rules);
}

/**
 * Email Service Tests
 */
async function testEmailService() {
  console.log('🔍 Testing email service (dry run)...');
  await emailService.sendEmail(
    formData.email,
    'Test Subject',
    'This is a test email body.'
  );
  console.log('✅ Email sent (or simulated).');
}

// /**
//  * Calendar Service Tests
//  */
// async function testCalendarService() {
//   console.log('🔍 Testing calendar scheduling...');
//   const meetingId = await calendarService.scheduleMeeting(formData, { notes: 'Test Meeting' } as any);
//   console.log('✅ Scheduled meeting ID:', meetingId);
// }

/**
 * Full Orchestrator Test
 */
async function testOrchestrator() {
  console.log('🚀 Running full orchestrator test...');
  await orchestrator.processSubmission(formData);
  console.log('✅ Orchestrator processed submission end-to-end!');
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
    // await testCalendarService();

    await testOrchestrator();
  } catch (err) {
    console.error('❌ Test run failed:', err);
  }
})();
