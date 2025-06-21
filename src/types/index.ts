import { z } from 'zod';

export const symptomSchema = z.object({
  ctScanImage: z.string({ required_error: 'A CT scan image is required.' })
    .min(1, 'A CT scan image is required.')
    .refine(val => val.startsWith('data:image/'), { message: 'Please upload a valid image file.' }),
  timeSinceOnset: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0, 'Time must be a positive number.'),
  faceDroop: z.boolean().default(false),
  speechSlurred: z.boolean().default(false),
  armWeakness: z.enum(['None', 'Left', 'Right', 'Both'], {
    required_error: 'You need to select an arm weakness option.',
  }),
  bloodPressure: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0, 'BP must be a positive number.')
    .optional()
    .or(z.literal('')),
  historyHypertension: z.boolean().default(false),
  historyDiabetes: z.boolean().default(false),
  historySmoking: z.boolean().default(false),
});

export type SymptomFormValues = z.infer<typeof symptomSchema>;

export type PredictionResult = {
  strokeType: 'Ischemic' | 'Hemorrhagic' | 'Uncertain';
  confidence: number;
  tpaEligible: boolean;
  action: string;
};
