// src/ai/flows/predict-stroke-type.ts
'use server';

/**
 * @fileOverview Predicts the likelihood of stroke type based on patient data.
 *
 * - predictStrokeType - A function that handles the stroke type prediction process.
 * - PredictStrokeTypeInput - The input type for the predictStrokeType function.
 * - PredictStrokeTypeOutput - The return type for the predictStrokeType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictStrokeTypeInputSchema = z.object({
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
    .enum(['Likely Ischemic', 'Likely Hemorrhagic', 'Uncertain'])
    .describe('The predicted stroke type.'),
  confidenceLevel: z.number().describe('The confidence level of the prediction (0-1).'),
  recommendedAction: z
    .enum(['Give tPA', 'Refer urgently, no tPA', 'Monitor and reassess in 30 mins'])
    .describe('The recommended action.'),
});

export type PredictStrokeTypeOutput = z.infer<typeof PredictStrokeTypeOutputSchema>;

export async function predictStrokeType(input: PredictStrokeTypeInput): Promise<PredictStrokeTypeOutput> {
  return predictStrokeTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStrokeTypePrompt',
  input: {schema: PredictStrokeTypeInputSchema},
  output: {schema: PredictStrokeTypeOutputSchema},
  prompt: `You are an experienced emergency physician specializing in stroke diagnosis.
Based on the provided patient information, determine the likely stroke type (Ischemic, Hemorrhagic, or Uncertain), provide a confidence level (0-1), and recommend the most appropriate next action (Give tPA, Refer urgently, Monitor and reassess in 30 mins).

Patient Information:
Time since symptom onset: {{timeSinceOnset}} minutes
Face droop: {{faceDroop}}
Slurred speech: {{speechSlurred}}
Arm weakness: {{armWeakness}}
Blood pressure: {{bloodPressure}}
History of hypertension: {{historyHypertension}}
History of diabetes: {{historyDiabetes}}
History of smoking: {{historySmoking}}

Consider the following:
- Ischemic stroke is more common.
- Hemorrhagic stroke is often associated with high blood pressure.
- Time since onset is critical for tPA administration.
- Use the absence of positive indicators to default to "Uncertain".

Respond with a JSON object conforming to the following schema:
${JSON.stringify(PredictStrokeTypeOutputSchema.describe(''))}`,
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
