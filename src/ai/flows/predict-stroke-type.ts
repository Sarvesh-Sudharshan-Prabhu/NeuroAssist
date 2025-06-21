// src/ai/flows/predict-stroke-type.ts
'use server';

/**
 * @fileOverview Diagnoses stroke type from a CT image and patient symptoms.
 *
 * - predictStrokeType - A function that handles the stroke diagnosis process.
 * - PredictStrokeTypeInput - The input type for the predictStrokeType function.
 * - PredictStrokeTypeOutput - The return type for the predictStrokeType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictStrokeTypeInputSchema = z.object({
  ctScanImage: z
    .string()
    .describe(
      "A CT scan of a patient's brain, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  timeSinceOnset: z
    .number()
    .describe('Time in minutes since the onset of symptoms.'),
  faceDroop: z.boolean().describe('Whether the patient has face droop.'),
  speechSlurred: z.boolean().describe('Whether the patient has slurred speech.'),
  armWeakness: z
    .enum(['Left', 'Right', 'Both', 'None'])
    .describe('Arm weakness (Left, Right, Both, or None).'),
  bloodPressure: z.number().optional().describe('Systolic blood pressure (if available).'),
  historyHypertension: z.boolean().describe('History of hypertension.'),
  historyDiabetes: z.boolean().describe('History of diabetes.'),
  historySmoking: z.boolean().describe('History of smoking.'),
});

export type PredictStrokeTypeInput = z.infer<typeof PredictStrokeTypeInputSchema>;

const PredictStrokeTypeOutputSchema = z.object({
  strokeType: z
    .enum(['Ischemic', 'Hemorrhagic', 'Uncertain'])
    .describe('The predicted stroke type based on the CT scan and symptoms.'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the prediction (0-1).'),
  tpaEligible: z.boolean().describe('Whether the patient is eligible for tPA treatment.'),
  action: z.string().describe('The recommended action and justification.'),
});

export type PredictStrokeTypeOutput = z.infer<typeof PredictStrokeTypeOutputSchema>;

export async function predictStrokeType(input: PredictStrokeTypeInput): Promise<PredictStrokeTypeOutput> {
  return predictStrokeTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStrokeTypePrompt',
  input: {schema: PredictStrokeTypeInputSchema},
  output: {schema: PredictStrokeTypeOutputSchema},
  prompt: `You are an expert radiologist and emergency physician specializing in stroke diagnosis.
Analyze the provided CT scan image and patient symptoms to determine the stroke type, tPA eligibility, and the recommended course of action. Follow these steps:

**1. CT Scan Analysis:**
Examine the CT scan image provided. Classify it as 'Ischemic', 'Hemorrhagic', or 'Uncertain'.
- **Ischemic strokes** may show as a darker, hypodense area.
- **Hemorrhagic strokes** will show as a bright, hyperdense area (blood).
- If the image is unclear or shows no clear signs, classify as 'Uncertain'.

**2. Symptom Correlation:**
Correlate the image findings with the patient's symptoms and history.
- Time since onset is critical. tPA is generally only effective within 4.5 hours (270 minutes).
- High blood pressure is a risk factor for both, but a contraindication for tPA if excessively high and a key indicator for hemorrhage.
- Facial droop, slurred speech, and arm weakness confirm stroke-like symptoms.

**3. Confidence Score Calculation:**
Based on the clarity of the CT scan and the correlation with symptoms, calculate a confidence score for your diagnosis between 0.0 and 1.0.
- **High Confidence (0.8 - 1.0):** The CT scan shows a clear, unambiguous sign of either an ischemic or hemorrhagic stroke that strongly correlates with the symptoms.
- **Medium Confidence (0.5 - 0.79):** The CT scan shows suggestive but not definitive signs, or there's a mild discrepancy between the scan and symptoms.
- **Low Confidence (< 0.5):** The CT scan is of poor quality, shows no clear signs, is ambiguous (leading to an 'Uncertain' type), or the findings strongly contradict the clinical symptoms.

**4. Determine tPA Eligibility and Action:**
- A patient is **tPA eligible** if:
  - Stroke type is confidently identified as **Ischemic**.
  - Time since onset is **less than 270 minutes**.
  - There are no other major contraindications (like recent surgery or known bleeding disorders, which are not provided here but assume none unless BP is very high).
- A patient is **NOT tPA eligible** if:
  - Stroke type is **Hemorrhagic**.
  - Stroke type is **Uncertain**.
  - Time since onset is **greater than or equal to 270 minutes**.

**Patient Information:**
CT Scan: {{media url=ctScanImage}}
Time since symptom onset: {{timeSinceOnset}} minutes
Face droop: {{faceDroop}}
Slurred speech: {{speechSlurred}}
Arm weakness: {{armWeakness}}
Blood pressure: {{bloodPressure}}
History of hypertension: {{historyHypertension}}
History of diabetes: {{historyDiabetes}}
History of smoking: {{historySmoking}}

**Task:**
Based on all the information and your analysis, provide a JSON response with the determined stroke type, your calculated confidence score, whether the patient is tPA eligible, and a clear, concise recommended action.
For the action, be specific. For example: "Administer tPA under supervision, transfer to CT-capable hospital" or "Urgent neurosurgical consult required due to hemorrhage. Do not administer tPA."
`,
});

const predictStrokeTypeFlow = ai.defineFlow(
  {
    name: 'predictStrokeTypeFlow',
    inputSchema: PredictStrokeTypeInputSchema,
    outputSchema: PredictStrokeTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
