'use server';

/**
 * @fileOverview Generates a simulated CT scan image of a stroke.
 *
 * - generateStrokeImage - A function that handles the image generation.
 * - GenerateStrokeImageInput - The input type for the generateStrokeImage function.
 * - GenerateStrokeImageOutput - The return type for the generateStrokeImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateStrokeImageInputSchema = z.object({
  strokeType: z.enum(['Ischemic', 'Hemorrhagic'])
    .describe('The type of stroke to generate an image for.'),
});
export type GenerateStrokeImageInput = z.infer<typeof GenerateStrokeImageInputSchema>;

const GenerateStrokeImageOutputSchema = z.object({
  image: z.string().describe("The generated image as a data URI."),
});
export type GenerateStrokeImageOutput = z.infer<typeof GenerateStrokeImageOutputSchema>;

export async function generateStrokeImage(input: GenerateStrokeImageInput): Promise<GenerateStrokeImageOutput> {
  return generateStrokeImageFlow(input);
}

const generateStrokeImageFlow = ai.defineFlow(
  {
    name: 'generateStrokeImageFlow',
    inputSchema: GenerateStrokeImageInputSchema,
    outputSchema: GenerateStrokeImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A medically accurate, high-contrast, grayscale axial CT scan of a human brain showing a clear sign of an ${input.strokeType} stroke. The image should be in the style of professional medical imaging. Do not include any text or labels.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error('Image generation failed to return a valid image.');
    }
    
    return { image: media.url };
  }
);
