'use client';

import React from 'react';
import { Stethoscope, BarChart3, CheckCircle2, XCircle, Share2, RefreshCw } from 'lucide-react';
import type { PredictionResult } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface ResultsDisplayProps {
  result: PredictionResult & { uploadedImage: string };
  onReset: () => void;
}

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
  const confidencePercent = Math.round(result.confidence * 100);

  const getResultText = () => {
    return `NeuroAssist Stroke Diagnosis Summary:\n
- Predicted Stroke Type: ${result.strokeType}
- Confidence: ${confidencePercent}%
- tPA Eligible: ${result.tpaEligible ? 'Yes' : 'No'}
- Recommended Action: ${result.action}`;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'NeuroAssist Stroke Diagnosis',
      text: getResultText(),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
        handleCopyToClipboard();
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(getResultText()).then(() => {
      toast({ title: "Copied to clipboard", description: "Diagnosis results have been copied." });
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({ variant: 'destructive', title: "Copy Failed", description: "Could not copy results to clipboard." });
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Diagnosis Results</CardTitle>
          <CardDescription>AI-powered diagnosis based on CT scan and patient data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
          <div className="bg-muted/50 rounded-lg p-2 flex justify-center">
            <img 
                src={result.uploadedImage} 
                alt="Uploaded CT Scan"
                data-ai-hint="ct scan" 
                className="rounded-md object-contain max-h-64"
             />
          </div>

          <div className="bg-accent/20 p-4 rounded-lg border border-accent/30 space-y-2">
             <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Recommended Action</p>
                {result.tpaEligible ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        tPA Eligible
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        tPA Not Eligible
                    </Badge>
                )}
             </div>
             <p className="text-lg font-semibold text-foreground">{result.action}</p>
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
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleShare} variant="outline" className="w-full sm:w-auto">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={onReset} className="w-full sm:w-auto sm:ml-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            New Diagnosis
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
