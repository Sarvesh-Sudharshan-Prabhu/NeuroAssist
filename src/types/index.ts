import { z } from 'zod';

export const symptomSchema = z.object({
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
  strokeType: 'Likely Ischemic' | 'Likely Hemorrhagic' | 'Uncertain';
  confidenceLevel: number;
  recommendedAction:
    | 'Give tPA'
    | 'Refer urgently, no tPA'
    | 'Monitor and reassess in 30 mins';
  justification: string;
};
