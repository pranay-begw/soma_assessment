// services/rulesEngine.ts
import { Rule, FormSubmission, RuleCondition } from '../types';

export class RulesEngine {
  private rules: Rule[] = [];

  constructor() {
    this.rules = this.getDefaultRules();
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  async evaluateSubmission(submission: FormSubmission): Promise<Rule[]> {
    const matchingRules: Rule[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.evaluateRule(rule, submission)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }

  private evaluateRule(rule: Rule, submission: FormSubmission): boolean {
    return rule.conditions.every(condition => this.evaluateCondition(condition, submission));
  }

  private evaluateCondition(condition: RuleCondition, submission: FormSubmission): boolean {
    const fieldValue = submission[condition.field];
    console.log("Evaluating rules: ", fieldValue?.toString, condition.field, condition.operator, condition.value);
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      
      case 'contains':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      
      default:
        return false;
    }
  }

  // Predefined rules
  getDefaultRules(): Rule[] {
    return [
      {
        id: 'funding needed',
        name: 'schedule-meeting',
        conditions: [
          { field: 'fundingStage', operator: 'in', value: ['series-a', 'series-b'] },
          { field: 'industry', operator: 'in', value: ['Technology', 'Energy'] }
        ],
        actions: [
          {
            type: 'email',
            config: {
              template: 'high-priority',
              subject: 'Partnership Opportunity - Immediate Review',
              requiresReview: true
            }
          },
          {
            type: 'schedule',
            config: {
              duration: 30,
              meetingType: 'partnership-discussion',
              autoSchedule: true
            }
          }
        ],
        enabled: true
      }
    ];
  }
}