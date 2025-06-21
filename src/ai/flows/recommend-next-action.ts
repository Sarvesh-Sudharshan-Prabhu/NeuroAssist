// src/ai/flows/recommend-next-action.ts
'use server';

/**
 * @fileOverview An AI agent to recommend the next action based on stroke type prediction and patient data.
 *
 * - recommendNextAction - A function that handles the recommendation process.
 * - RecommendNextActionInput - The input type for the recommendNextAction function.
 * - RecommendNextActionOutput - The return type for the recommendNextAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendNextActionInputSchema = z.object({
  strokeType: z
    .enum(['Likely Ischemic', 'Likely Hemorrhagic', 'Uncertain'])
    .describe('The predicted stroke type.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence level of the stroke type prediction (0 to 1).'),
  faceDroop: z.boolean().describe('Whether the patient has face droop (true/false).'),
  speechSlurred: z.boolean().describe('Whether the patient has slurred speech (true/false).'),
  armWeakness: z.enum(['Left', 'Right', 'Both', 'None']).describe('Arm weakness (Left, Right, Both, None).'),
  bloodPressure: z.number().optional().describe('The patient`s blood pressure, if available.'),
  historyHypertension: z.boolean().describe('History of hypertension (true/false).'),
  historyDiabetes: z.boolean().describe('History of diabetes (true/false).'),
  historySmoking: z.boolean().describe('History of smoking (true/false).'),
  timeSinceOnset: z
    .number()
    .describe('Time since symptom onset in minutes.')
    .optional(),
});

export type RecommendNextActionInput = z.infer<typeof RecommendNextActionInputSchema>;

const RecommendNextActionOutputSchema = z.object({
  recommendedAction: z
    .enum(['Give tPA', 'Refer urgently, no tPA', 'Monitor and reassess in 30 mins'])
    .describe('The recommended next action.'),
  justification: z.string().describe('The justification for the recommended action.'),
});

export type RecommendNextActionOutput = z.infer<typeof RecommendNextActionOutputSchema>;

export async function recommendNextAction(input: RecommendNextActionInput): Promise<RecommendNextActionOutput> {
  return recommendNextActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendNextActionPrompt',
  input: {schema: RecommendNextActionInputSchema},
  output: {schema: RecommendNextActionOutputSchema},
  prompt: `You are a medical expert specializing in stroke treatment.

  Based on the following patient data, recommend the most appropriate next action:

  Stroke Type: {{{strokeType}}}
  Confidence Level: {{{confidence}}}
  Face Droop: {{#if faceDroop}}Yes{{else}}No{{/if}}
  Slurred Speech: {{#if speechSlurred}}Yes{{else}}No{{/if}}
  Arm Weakness: {{{armWeakness}}}
  Blood Pressure: {{bloodPressure}}
  History of Hypertension: {{#if historyHypertension}}Yes{{else}}No{{/if}}
  History of Diabetes: {{#if historyDiabetes}}Yes{{else}}No{{/if}}
  History of Smoking: {{#if historySmoking}}Yes{{else}}No{{/if}}
  Time since onset: {{timeSinceOnset}} minutes

  Consider the stroke type, confidence level, symptoms, and patient history to determine the best course of action.  Provide a brief justification for your recommendation.

  Follow the guidelines below:

  - If the stroke type is "Likely Ischemic" and the time since onset is less than 4.5 hours, and there are no contraindications, recommend "Give tPA".
  - If the stroke type is "Likely Hemorrhagic", recommend "Refer urgently, no tPA".
  - If the stroke type is "Uncertain" or the patient presents with symptoms outside the tPA window, recommend "Monitor and reassess in 30 mins".

  Ensure that the output is a JSON object with 'recommendedAction' and 'justification' fields.
  `,
});

const recommendNextActionFlow = ai.defineFlow(
  {
    name: 'recommendNextActionFlow',
    inputSchema: RecommendNextActionInputSchema,
    outputSchema: RecommendNextActionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
