// types/index.ts
export interface FormSubmission {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  linkedinUrl?: string;
  companyWebsite?: string;
  message: string;
  fundingStage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'later-stage';
  fundingAmount?: number;
  industry: string;
  submittedAt: Date;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
}

export interface RuleCondition {
  field: keyof FormSubmission;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
  value: any;
}

export interface RuleAction {
  type: 'email' | 'schedule';
  config: EmailConfig | ScheduleConfig;
}

export interface EmailConfig {
  template: string;
  subject: string;
  requiresReview?: boolean;
}

export interface ScheduleConfig {
  duration: number; // in minutes
  meetingType: string;
  autoSchedule: boolean;
}

export interface AIContext {
  personalBackground: string;
  companyInfo: string;
  meetingPurpose: string;
  keyInsights: string[];
}