'use client';

import React from 'react';
import { Stethoscope, BarChart3, Pill, Siren, Timer, Printer, Share2, RefreshCw } from 'lucide-react';
import type { PredictionResult } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';

interface ResultsDisplayProps {
  result: PredictionResult;
  onReset: () => void;
}

const recommendationIcons: Record<PredictionResult['recommendedAction'], React.ReactNode> = {
  'Give tPA': <Pill className="h-6 w-6 text-green-600" />,
  'Refer urgently, no tPA': <Siren className="h-6 w-6 text-red-600" />,
  'Monitor and reassess in 30 mins': <Timer className="h-6 w-6 text-yellow-600" />,
};

const recommendationColors: Record<PredictionResult['recommendedAction'], string> = {
  'Give tPA': 'text-green-700',
  'Refer urgently, no tPA': 'text-red-700',
  'Monitor and reassess in 30 mins': 'text-yellow-700',
};

const ResultItem: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode; valueClassName?: string }> = ({ icon, label, value, valueClassName }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueClassName}`}>{value}</p>
    </div>
  </div>
);

export function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const { toast } = useToast();
  const confidencePercent = Math.round(result.confidenceLevel * 100);

  const getResultText = () => {
    return `NeuroAssist Stroke Assessment Summary:\n
- Prediction: ${result.strokeType}
- Confidence: ${confidencePercent}%
- Recommendation: ${result.recommendedAction}
- Justification: ${result.justification}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: 'NeuroAssist Stroke Assessment',
      text: getResultText(),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to clipboard
        handleCopyToClipboard();
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getResultText()).then(() => {
      toast({ title: "Copied to clipboard", description: "Assessment results have been copied." });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({ variant: 'destructive', title: "Copy Failed", description: "Could not copy results to clipboard." });
    });
  };

  return (
    <>
      <div className="print-only fixed top-0 left-0 w-full p-8 bg-white">
        <h1 className="text-2xl font-bold mb-4">NeuroAssist - Assessment Report</h1>
      </div>
      <Card className="printable-area w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Assessment Results</CardTitle>
          <CardDescription>AI-powered prediction based on patient data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-accent/20 p-4 rounded-lg border border-accent/30">
            <ResultItem 
              icon={recommendationIcons[result.recommendedAction]} 
              label="Recommended Action" 
              value={result.recommendedAction}
              valueClassName={`text-xl font-bold ${recommendationColors[result.recommendedAction]}`} 
            />
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Justification</p>
            <p className="text-base text-foreground">{result.justification}</p>
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResultItem icon={<Stethoscope className="h-6 w-6 text-primary" />} label="Predicted Stroke Type" value={result.strokeType} />
            
            <div className="flex items-start space-x-4">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence Level</p>
                <div className="flex items-center gap-2">
                   <p className="text-lg font-semibold">{confidencePercent}%</p>
                   <Progress value={confidencePercent} className="w-full" />
                </div>
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 no-print">
          <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleShare} variant="outline" className="w-full sm:w-auto">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={onReset} className="w-full sm:w-auto sm:ml-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Assessment
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
