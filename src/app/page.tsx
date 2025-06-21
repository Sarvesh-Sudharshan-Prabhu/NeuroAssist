'use client';

import { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';

import { SymptomForm } from '@/components/symptom-form';
import { ResultsDisplay } from '@/components/results-display';
import { useToast } from '@/hooks/use-toast';
import { predictStrokeType } from '@/ai/flows/predict-stroke-type';
import type { SymptomFormValues, PredictionResult } from '@/types';

// Helper function to read file as Data URL
const toDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

type ResultState = (PredictionResult & { uploadedImage?: string }) | null;

export default function Home() {
  const [result, setResult] = useState<ResultState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePredict = async (data: SymptomFormValues) => {
    setIsLoading(true);
    setResult(null);

    try {
      const imageDataUrl = data.ctScanImage ? await toDataURL(data.ctScanImage) : undefined;
      
      const predictionInput = {
        ctScanImage: imageDataUrl,
        timeSinceOnset: data.timeSinceOnset,
        faceDroop: data.faceDroop,
        speechSlurred: data.speechSlurred,
        armWeakness: data.armWeakness,
        systolicBloodPressure: data.systolicBloodPressure ? Number(data.systolicBloodPressure) : undefined,
        historyHypertension: data.historyHypertension,
        historyDiabetes: data.historyDiabetes,
        historySmoking: data.historySmoking,
        levelOfConsciousness: data.levelOfConsciousness,
        vomiting: data.vomiting,
        headache: data.headache,
        diastolicBloodPressure: Number(data.diastolicBloodPressure),
      };
      
      const prediction = await predictStrokeType(predictionInput);

      if (!prediction || !prediction.strokeType) {
        throw new Error('AI failed to return a valid diagnosis.');
      }
      
      setResult({
        ...prediction,
        uploadedImage: imageDataUrl,
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800">NeuroAssist</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground">Analyzing symptoms...</p>
              <p className="text-sm text-muted-foreground">Please wait while our AI processes the information.</p>
            </div>
          ) : result ? (
            <ResultsDisplay result={result} onReset={handleReset} />
          ) : (
            <SymptomForm onSubmit={handlePredict} isLoading={isLoading} />
          )}
        </div>
      </main>

      <footer className="text-center p-4 text-xs text-muted-foreground">
        <p>
          Disclaimer: NeuroAssist is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </footer>
    </div>
  );
}
