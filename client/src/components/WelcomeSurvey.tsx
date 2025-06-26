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
        title: "Welcome to FriendMeet!",
        description: "Your preferences have been saved. Let's find your perfect dining companions!",
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
      title: "What's your favorite conversation topic?",
      description: "This helps us match you with like-minded people",
      icon: MessageCircle,
      options: [
        { value: 'travel', label: 'Travel & Adventures', description: 'Share stories from around the world' },
        { value: 'food', label: 'Food & Cooking', description: 'Discuss cuisines, recipes, and dining experiences' },
        { value: 'career', label: 'Career & Goals', description: 'Talk about professional growth and aspirations' },
        { value: 'hobbies', label: 'Hobbies & Interests', description: 'Share your passions and creative pursuits' },
        { value: 'current_events', label: 'Current Events', description: 'Discuss news, trends, and what\'s happening' },
      ]
    },
    {
      id: 'idealFirstMeetLocation',
      title: "Where would you prefer to meet new people?",
      description: "We'll suggest meetups at places you'll love",
      icon: MapPin,
      options: [
        { value: 'coffee_shop', label: 'Coffee Shop', description: 'Cozy atmosphere for intimate conversations' },
        { value: 'casual_restaurant', label: 'Casual Restaurant', description: 'Relaxed dining with good food' },
        { value: 'outdoor_space', label: 'Outdoor Space', description: 'Parks, patios, or rooftop venues' },
        { value: 'activity_venue', label: 'Activity Venue', description: 'Places with games, events, or entertainment' },
        { value: 'fine_dining', label: 'Fine Dining', description: 'Upscale restaurants for special occasions' },
      ]
    },
    {
      id: 'communicationStyle',
      title: "How would you describe your communication style?",
      description: "This helps us create compatible groups",
      icon: Users,
      options: [
        { value: 'direct', label: 'Direct & Straightforward', description: 'I say what I mean and appreciate honesty' },
        { value: 'friendly', label: 'Warm & Friendly', description: 'I love making people feel comfortable' },
        { value: 'thoughtful', label: 'Thoughtful & Reflective', description: 'I enjoy deep, meaningful conversations' },
        { value: 'energetic', label: 'Energetic & Enthusiastic', description: 'I bring high energy and excitement' },
        { value: 'calm', label: 'Calm & Patient', description: 'I\'m a good listener and create peaceful vibes' },
      ]
    },
    {
      id: 'socialEnergyLevel',
      title: "What's your social energy level?",
      description: "We'll match you with people who share your social style",
      icon: Zap,
      options: [
        { value: 'introvert', label: 'Introvert', description: 'I prefer smaller groups and deeper connections' },
        { value: 'ambivert', label: 'Ambivert', description: 'I adapt well to different social situations' },
        { value: 'extrovert', label: 'Extrovert', description: 'I thrive in larger groups and love meeting new people' },
      ]
    },
    {
      id: 'weekendActivity',
      title: "How do you typically spend your weekends?",
      description: "This helps us understand your lifestyle preferences",
      icon: Calendar,
      options: [
        { value: 'relaxing_home', label: 'Relaxing at Home', description: 'Reading, movies, or quiet activities' },
        { value: 'outdoor_adventures', label: 'Outdoor Adventures', description: 'Hiking, sports, or exploring nature' },
        { value: 'social_events', label: 'Social Events', description: 'Parties, gatherings, or community events' },
        { value: 'creative_projects', label: 'Creative Projects', description: 'Art, music, writing, or DIY activities' },
        { value: 'exploring_city', label: 'Exploring the City', description: 'Museums, markets, new neighborhoods' },
      ]
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="text-white h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome to FriendMeet! 
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Let's get to know you better so we can find your perfect dining companions
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
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQuestion.title}
            </h3>
            <p className="text-gray-600">
              {currentQuestion.description}
            </p>
          </div>

          <RadioGroup
            value={responses[currentQuestion.id as keyof SurveyFormData] || ''}
            onValueChange={handleResponseChange}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="font-medium text-gray-900 cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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