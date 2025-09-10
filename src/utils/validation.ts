// utils/validation.ts
import { z } from 'zod';

export const FormSubmissionSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Valid email is required'),
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  linkedinUrl: z.string().optional().transform(val => val === '' ? undefined : val).pipe(z.string().url().optional()),
  companyWebsite: z.string().optional().transform(val => val === '' ? undefined : val).pipe(z.string().url().optional()),
  message: z.string().min(10, 'Please provide a detailed message (min 10 characters)'),
  fundingStage: z.enum(['pre-seed', 'seed', 'series-a', 'series-b', 'later-stage']),
  fundingAmount: z.union([z.string(), z.number()]).optional().transform(val => {
    if (typeof val === 'number') return val;
    if (!val || val.trim() === '') return undefined;
    
    const str = val.toString().trim().toUpperCase();
    const num = parseFloat(str.replace(/[KM]$/, ''));
    
    if (isNaN(num)) return undefined;
    
    if (str.endsWith('K')) return Math.round(num * 1000);
    if (str.endsWith('M')) return Math.round(num * 1000000);
    if (str.endsWith('B')) return Math.round(num * 1000000000);
    
    return Math.round(num);
  }),
  industry: z.string().min(1, 'Industry is required'),
});