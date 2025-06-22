import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const symptomSchema = z.object({
  ctScanImage: z
    .any()
    .refine((file) => !file || file?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, and .png formats are supported."
    ).optional(),
  timeSinceOnset: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0, 'Time must be a positive number.'),
  faceDroop: z.boolean().default(false),
  speechSlurred: z.boolean().default(false),
  armWeakness: z.enum(['None', 'Left', 'Right', 'Both'], {
    required_error: 'You need to select an arm weakness option.',
  }),
  systolicBloodPressure: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0, 'BP must be a positive number.')
    .optional()
    .or(z.literal('')),
  historyHypertension: z.boolean().default(false),
  historyDiabetes: z.boolean().default(false),
  historySmoking: z.boolean().default(false),
  levelOfConsciousness: z.enum(['Conscious', 'Drowsy', 'Comatose'], {
      required_error: 'You need to select a level of consciousness.',
  }),
  vomiting: z.boolean().default(false),
  headache: z.boolean().default(false),
  diastolicBloodPressure: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0, 'Diastolic BP must be a positive number.'),
});

export type SymptomFormValues = z.infer<typeof symptomSchema> & {
    ctScanImage?: File;
};

export type PredictionResult = {
  strokeType: 'Ischemic' | 'Hemorrhagic' | 'Uncertain';
  confidence: number;
  tenecteplaseEligible: boolean;
  action: string;
};
