// src/ai/flows/predict-stroke-type.ts
'use server';

/**
 * @fileOverview Diagnoses stroke type from a CT image or clinical symptoms.
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
    ).optional(),
  timeSinceOnset: z
    .number()
    .describe('Time in minutes since the onset of symptoms.'),
  faceDroop: z.boolean().describe('Whether the patient has face droop.'),
  speechSlurred: z.boolean().describe('Whether the patient has slurred speech.'),
  armWeakness: z
    .enum(['Left', 'Right', 'Both', 'None'])
    .describe('Arm weakness (Left, Right, Both, or None).'),
  systolicBloodPressure: z.number().optional().describe('Systolic blood pressure (if available).'),
  historyHypertension: z.boolean().describe('History of hypertension.'),
  historyDiabetes: z.boolean().describe('History of diabetes.'),
  historySmoking: z.boolean().describe('History of smoking.'),
  levelOfConsciousness: z.enum(['Conscious', 'Drowsy', 'Comatose']).describe('Level of consciousness (Conscious, Drowsy/Stuporous, or Comatose).'),
  vomiting: z.boolean().describe('Whether the patient has been vomiting.'),
  headache: z.boolean().describe('Whether the patient has a headache.'),
  diastolicBloodPressure: z.number().describe('Diastolic blood pressure.'),
});


export type PredictStrokeTypeInput = z.infer<typeof PredictStrokeTypeInputSchema>;

const PredictStrokeTypeOutputSchema = z.object({
  strokeType: z
    .enum(['Ischemic', 'Hemorrhagic', 'Uncertain'])
    .describe('The predicted stroke type based on the CT scan and symptoms.'),
  confidence: z.number().min(0).max(1).describe('The confidence level of the prediction (0-1).'),
  tenecteplaseEligible: z.boolean().describe('Whether the patient is eligible for Tenecteplase treatment.'),
  action: z.string().describe('The recommended action and justification.'),
});

export type PredictStrokeTypeOutput = z.infer<typeof PredictStrokeTypeOutputSchema>;

export async function predictStrokeType(input: PredictStrokeTypeInput): Promise<PredictStrokeTypeOutput> {
  return predictStrokeTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStrokeTypePrompt',
  input: {schema: z.any()},
  output: {schema: PredictStrokeTypeOutputSchema},
  prompt: `You are an expert emergency physician specializing in stroke diagnosis.
Your task is to determine the stroke type, Tenecteplase eligibility, and the recommended course of action based on the provided patient data.

**DIAGNOSTIC PROTOCOL: Follow these steps in order.**

**Step 1: Determine the Primary Diagnostic Method**
- **IF a CT Scan is provided**, use it as the primary source for diagnosis. The clinical symptoms serve as supporting data.
- **IF a CT Scan is NOT provided**, you MUST use the Siriraj Stroke Score as the primary method for diagnosis.

**Method A: CT Scan Analysis (When Image is Provided)**
Examine the CT scan image. Classify it as 'Ischemic', 'Hemorrhagic', or 'Uncertain'.
- **Ischemic strokes** may show as a darker, hypodense area.
- **Hemorrhagic strokes** will show as a bright, hyperdense area (blood).
- If the image is unclear or shows no clear signs, classify as 'Uncertain'.

**Method B: Siriraj Stroke Score (When No Image is Provided)**
The Siriraj Stroke Score has been pre-calculated based on clinical data. Use this result to determine the diagnosis.
- **Calculated Siriraj Score:** {{sirirajScore}}
- **Interpretation:** {{sirirajInterpretation}}

Your diagnosis for stroke type MUST match this interpretation.

**Step 2: Confidence Score Calculation**
Calculate a confidence score for your diagnosis between 0.0 and 1.0.
- **If using CT Scan:**
  - **High (0.8 - 1.0):** Clear, unambiguous CT sign that strongly correlates with symptoms.
  - **Medium (0.5 - 0.79):** Suggestive but not definitive CT signs.
  - **Low (< 0.5):** Poor quality CT, no clear signs, or ambiguous findings.
- **If using Siriraj Score:**
  - **High (0.85 - 0.95):** Score is strongly positive (> +2) or strongly negative (< -2).
  - **Medium (0.6 - 0.84):** Score is between 1-2 or -1 to -2.
  - **Low (0.4 - 0.59):** Score is close to the -1 to +1 indeterminate range.

**Step 3: Determine Tenecteplase Eligibility**
A patient is **Tenecteplase eligible** ONLY IF:
- Stroke type is confidently identified as **Ischemic**.
- Time since onset is **less than 270 minutes**.
A patient is **NOT Tenecteplase eligible** under any other circumstances (Hemorrhagic, Uncertain, or Ischemic outside the window).

**Patient Information:**
CT Scan: {{#if ctScanImage}}{{media url=ctScanImage}}{{else}}Not Provided{{/if}}
Time since symptom onset: {{timeSinceOnset}} minutes
Face droop: {{faceDroop}}
Slurred speech: {{speechSlurred}}
Arm weakness: {{armWeakness}}
Systolic Blood pressure: {{systolicBloodPressure}}
History of hypertension: {{historyHypertension}}
History of diabetes: {{historyDiabetes}}
History of smoking: {{historySmoking}}

**Siriraj Score Data:**
Level of Consciousness: {{levelOfConsciousness}}
Vomiting: {{vomiting}}
Headache: {{headache}}
Diastolic Blood Pressure: {{diastolicBloodPressure}}

**Task & Action Formulation:**
Based on all the information, provide a JSON response with the determined stroke type, confidence, Tenecteplase eligibility, and recommended action. Formulate the 'action' field as a multi-line string following these specific protocols:

- **If Stroke Type is Hemorrhagic:** The action must be:
"❌ HEMORRHAGIC STROKE DETECTED – TENECTEPLASE CONTRAINDICATED
Urgent neurosurgical consultation and emergency transfer required.

Immediate Actions:
Alert Nearby Hospitals: Notify stroke centers of an incoming critical patient.
Activate Satellite Comms (if available): If in a remote area with no internet, use satellite device for emergency communication.

Stabilization Protocol:
Stabilize Blood Pressure: Check BP immediately. If SBP > 180 mmHg, administer antihypertensives to lower it gradually.
Elevate Head: Keep patient's head elevated to 30 degrees to reduce intracranial pressure.
Minimize Stimulation: Reduce light, sound, and movement.
Control Fever: Apply cool packs if the patient is feverish to reduce brain metabolism."

- **If Stroke Type is Ischemic and Tenecteplase eligible:** The action must be:
"✅ ISCHEMIC STROKE: TENECTEPLASE ELIGIBLE
Initiate Tenecteplase administration immediately per protocol.

Treatment Protocol:
Administer Tenecteplase: Dose as a single IV bolus at 0.25 mg/kg (max 25 mg).
Monitor Vitals: Check blood pressure and neurological status every 15 minutes for 2 hours after administration.
Blood Pressure Control: Maintain BP < 180/105 mmHg.
Prepare for Transfer: Arrange for immediate transfer to a comprehensive stroke center for ongoing care and potential endovascular therapy."

- **If Stroke Type is Ischemic and NOT Tenecteplase eligible:** The action must be:
"⚠️ ISCHEMIC STROKE: TENECTEPLASE NOT ELIGIBLE
Patient is outside the treatment window or has contraindications.

Supportive Care Plan:
Initiate Antiplatelet Therapy: Administer Aspirin (e.g., 325 mg) once hemorrhage is definitively ruled out.
Permissive Hypertension: Do not lower blood pressure unless it is extremely high (e.g., >220/120 mmHg).
Monitor Vitals: Closely monitor neurological status, blood pressure, and glucose.
Neurological Consultation: Seek urgent neurological consultation and arrange transfer to a stroke-ready hospital."

- **If Stroke Type is Uncertain:** The action must be:
"❓ DIAGNOSIS UNCERTAIN – DO NOT ADMINISTER TENECTEPLASE
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
  async (input) => {
    const {
      ctScanImage,
      levelOfConsciousness,
      vomiting,
      headache,
      diastolicBloodPressure,
      historyHypertension,
      historyDiabetes,
      historySmoking,
    } = input;

    let sirirajScore: number | undefined = undefined;
    let sirirajInterpretation: string | undefined = undefined;

    if (!ctScanImage) {
      const locScore =
        levelOfConsciousness === 'Conscious'
          ? 0
          : levelOfConsciousness === 'Drowsy'
          ? 1
          : 2;
      const vomitingScore = vomiting ? 1 : 0;
      const headacheScore = headache ? 1 : 0;
      const atheromaScore =
        historyHypertension || historyDiabetes || historySmoking ? 1 : 0;

      sirirajScore =
        2.5 * locScore +
        2 * vomitingScore +
        2 * headacheScore +
        0.1 * diastolicBloodPressure -
        3 * atheromaScore -
        12;

      if (sirirajScore > 1) {
        sirirajInterpretation = 'Hemorrhagic';
      } else if (sirirajScore < -1) {
        sirirajInterpretation = 'Ischemic';
      } else {
        sirirajInterpretation = 'Uncertain';
      }
    }

    const promptInput = {
      ...input,
      sirirajScore: sirirajScore?.toFixed(2),
      sirirajInterpretation,
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
