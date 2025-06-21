
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
import {z} from 'zod';

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

**4. Determine tPA Eligibility:**
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

**Task & Action Formulation:**
Based on all the information, provide a JSON response with the determined stroke type, confidence, tPA eligibility, and recommended action. Formulate the 'action' field as a multi-line string following these specific protocols:

- **If Stroke Type is Hemorrhagic:** The action must be:
"❌ HEMORRHAGIC STROKE DETECTED – tPA CONTRAINDICATED
Urgent neurosurgical consultation and emergency transfer required.

Immediate Actions:
Alert Nearby Hospitals: Notify stroke centers of an incoming critical patient.
Activate Satellite Comms (if available): If in a remote area with no internet, use satellite device for emergency communication.

Stabilization Protocol:
Stabilize Blood Pressure: Check BP immediately. If SBP > 180 mmHg, administer antihypertensives to lower it gradually.
Elevate Head: Keep patient's head elevated to 30 degrees to reduce intracranial pressure.
Minimize Stimulation: Reduce light, sound, and movement.
Control Fever: Apply cool packs if the patient is feverish to reduce brain metabolism."

- **If Stroke Type is Ischemic and tPA eligible:** The action must be:
"✅ ISCHEMIC STROKE: tPA ELIGIBLE
Initiate tPA administration immediately per protocol.

Treatment Protocol:
Administer Alteplase (tPA): Dose at 0.9 mg/kg (max 90 mg). Give 10% as a bolus over 1 minute, then infuse the remainder over 60 minutes.
Monitor Vitals: Check blood pressure and neurological status every 15 minutes during infusion and for 2 hours after.
Blood Pressure Control: Maintain BP < 180/105 mmHg.
Prepare for Transfer: Arrange for immediate transfer to a comprehensive stroke center for ongoing care and potential endovascular therapy."

- **If Stroke Type is Ischemic and NOT tPA eligible:** The action must be:
"⚠️ ISCHEMIC STROKE: tPA NOT ELIGIBLE
Patient is outside the treatment window or has contraindications for tPA.

Supportive Care Plan:
Initiate Antiplatelet Therapy: Administer Aspirin (e.g., 325 mg) once hemorrhage is definitively ruled out.
Permissive Hypertension: Do not lower blood pressure unless it is extremely high (e.g., >220/120 mmHg).
Monitor Vitals: Closely monitor neurological status, blood pressure, and glucose.
Neurological Consultation: Seek urgent neurological consultation and arrange transfer to a stroke-ready hospital."

- **If Stroke Type is Uncertain:** The action must be:
"❓ DIAGNOSIS UNCERTAIN – DO NOT ADMINISTER tPA
Further investigation is required before initiating stroke-specific treatment.

Immediate Actions:
Stabilize Patient: Provide supportive care, manage airway, breathing, and circulation.
Urgent Consultation: Seek immediate neurological consultation.
Advanced Imaging: Arrange for urgent advanced imaging (e.g., MRI/MRA or CT angiography) to clarify diagnosis.
Monitor Closely: Continuously monitor vital signs and neurological status for any changes."
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
