import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, MapPin, Users, Zap, Calendar } from "lucide-react";
import type { SurveyFormData } from "@shared/schema";
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";


interface WelcomeSurveyProps {
  onComplete: () => void;
}

export default function WelcomeSurvey({ onComplete }: WelcomeSurveyProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [responses, setResponses] = useState<Partial<SurveyFormData>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitSurvey = useMutation({
    mutationFn: async (data: SurveyFormData) => {
      const response = await apiRequest('POST', '/api/survey', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Welcome to TrueCircle",
        description: "Preferences saved",
      });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const questions = [
    {
      id: 'favoriteConversationTopic',
      title: "Favorite topic?",
      icon: MessageCircle,
      options: [
        { value: 'travel', label: 'Travel' },
        { value: 'food', label: 'Food' },
        { value: 'career', label: 'Career' },
        { value: 'hobbies', label: 'Hobbies' },
        { value: 'current_events', label: 'Current Events' },
      ]
    },
    {
      id: 'favoriteMusic',
      title: "Music genre?",
      icon: MapPin,
      options: [
        { value: 'pop', label: 'Pop' },
        { value: 'rock', label: 'Rock' },
        { value: 'hiphop', label: 'Hip-Hop' },
        { value: 'electronic', label: 'Electronic' },
        { value: 'indie', label: 'Indie' },
      ]
    },
    {
      id: 'personalityType',
      title: "Your vibe?",
      icon: Zap,
      options: [
        { value: 'outgoing', label: 'Outgoing' },
        { value: 'thoughtful', label: 'Thoughtful' },
        { value: 'adventurous', label: 'Adventurous' },
        { value: 'chill', label: 'Chill' },
        { value: 'passionate', label: 'Passionate' },
      ]
    },

  ];

  const currentQuestion = questions[currentStep - 1];
  const progress = (currentStep / questions.length) * 100;

  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit survey
      submitSurvey.mutate(responses as SurveyFormData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleResponseChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const isStepComplete = responses[currentQuestion.id as keyof SurveyFormData];
  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <img 
              src={truecircleLogo} 
              alt="TrueCircle Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Welcome to TrueCircle
          </CardTitle>
          <p className="text-gray-600 mt-2 text-sm">
            Quick setup
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Question {currentStep} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion.title}
            </h3>
          </div>

          <RadioGroup
            value={responses[currentQuestion.id as keyof SurveyFormData] || ''}
            onValueChange={handleResponseChange}
            className="space-y-2"
          >
            {currentQuestion.options.map((option) => (
              <Label 
                key={option.value} 
                htmlFor={option.value} 
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="font-medium text-gray-900">
                  {option.label}
                </div>
              </Label>
            ))}
          </RadioGroup>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isStepComplete || submitSurvey.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === questions.length ? (
                submitSurvey.isPending ? 'Saving...' : 'Complete Survey'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}