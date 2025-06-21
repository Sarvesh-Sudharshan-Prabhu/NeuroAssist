'use client';

import React, { useState } from 'react';
import { Stethoscope, BarChart3, CheckCircle2, XCircle, Share2, RefreshCw, Calculator } from 'lucide-react';
import type { PredictionResult } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ResultsDisplayProps {
  result: PredictionResult & { uploadedImage?: string };
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

const TpaDosingCalculator = () => {
  const [weight, setWeight] = useState<string>('');
  const [doses, setDoses] = useState<{ total: number; bolus: number; infusion: number } | null>(null);
  const { toast } = useToast();

  const handleCalculate = () => {
    const weightKg = parseFloat(weight);
    if (isNaN(weightKg) || weightKg <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Weight',
        description: 'Please enter a valid patient weight in kilograms.',
      });
      setDoses(null);
      return;
    }

    const totalDose = Math.min(weightKg * 0.9, 90);
    const bolusDose = totalDose * 0.1;
    const infusionDose = totalDose * 0.9;

    setDoses({
      total: parseFloat(totalDose.toFixed(2)),
      bolus: parseFloat(bolusDose.toFixed(2)),
      infusion: parseFloat(infusionDose.toFixed(2)),
    });
  };

  return (
    <Card className="mt-6 bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="h-6 w-6 text-primary" />
          tPA (Alteplase) Dosing Calculator
        </CardTitle>
        <CardDescription>
          For Ischemic Stroke. Standard dose: 0.9 mg/kg (max 90 mg).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="weight">Patient Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCalculate(); }}
            />
          </div>
          <Button onClick={handleCalculate}>Calculate</Button>
        </div>
        {doses && (
          <div className="space-y-4 rounded-lg border bg-background p-4">
            <h4 className="font-semibold text-center text-foreground">Calculated Doses (mg)</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Dose</p>
                <p className="text-2xl font-bold text-destructive">{doses.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IV Bolus (10%)</p>
                <p className="text-2xl font-bold text-primary">{doses.bolus}</p>
                <p className="text-xs text-muted-foreground">over 1 min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IV Infusion (90%)</p>
                <p className="text-2xl font-bold text-primary">{doses.infusion}</p>
                <p className="text-xs text-muted-foreground">over 60 min</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


export function ResultsDisplay({ result, onReset }: ResultsDisplayProps) {
  const { toast } = useToast();
  const confidencePercent = Math.round(result.confidence * 100);
  const isHemorrhagic = result.strokeType === 'Hemorrhagic';

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
          <CardDescription>AI-powered diagnosis based on patient data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            
          {result.uploadedImage && (
            <div className="bg-muted/50 rounded-lg p-2 flex justify-center">
              <img 
                  src={result.uploadedImage} 
                  alt="Uploaded CT Scan"
                  data-ai-hint="ct scan" 
                  className="rounded-md object-contain max-h-64"
               />
            </div>
          )}

          <div className={cn(
             "p-4 rounded-lg border space-y-2",
             isHemorrhagic ? "bg-destructive/10 border-destructive/30" : "bg-accent/20 border-accent/30"
          )}>
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
                        {isHemorrhagic ? 'tPA Contraindicated' : 'tPA Not Eligible'}
                    </Badge>
                )}
             </div>
             <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{result.action}</p>
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
          
          {result.tpaEligible && <TpaDosingCalculator />}

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
