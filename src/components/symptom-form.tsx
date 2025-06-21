'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, UploadCloud } from 'lucide-react';
import type { SymptomFormValues } from '@/types';
import { symptomSchema } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SymptomFormProps {
  onSubmit: (data: SymptomFormValues) => void;
  isLoading: boolean;
}

export function SymptomForm({ onSubmit, isLoading }: SymptomFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<SymptomFormValues>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      ctScanImage: '',
      timeSinceOnset: 0,
      faceDroop: false,
      speechSlurred: false,
      armWeakness: 'None',
      bloodPressure: undefined,
      historyHypertension: false,
      historyDiabetes: false,
      historySmoking: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Stroke Diagnosis</CardTitle>
            <CardDescription>Upload a CT scan and enter patient details for an AI-powered diagnosis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="ctScanImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CT Scan Image</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Input
                        id="ct-scan-upload"
                        type="file"
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const dataUri = reader.result as string;
                              setImagePreview(dataUri);
                              field.onChange(dataUri);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {imagePreview ? (
                        <img src={imagePreview} alt="CT Scan Preview" className="absolute inset-0 w-full h-full object-contain rounded-lg p-1" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <UploadCloud className="w-12 h-12" />
                          <p className="mt-2 text-sm">Click or drag to upload</p>
                          <p className="text-xs">PNG or JPG</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Clinical Findings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timeSinceOnset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Since Symptom Onset (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 60" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodPressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolic Blood Pressure (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 150" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="armWeakness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arm Weakness</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select arm weakness" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Left">Left</SelectItem>
                          <SelectItem value="Right">Right</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                 <FormField
                  control={form.control}
                  name="faceDroop"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Face Droop</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="speechSlurred"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Slurred Speech</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Patient History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="historyHypertension"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Hypertension</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historyDiabetes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Diabetes</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="historySmoking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Smoking</FormLabel>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Diagnose from CT & Symptoms'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
