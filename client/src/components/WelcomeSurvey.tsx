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
        title: "Welcome to TrueCircle!",
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
      id: 'favoriteMusic',
      title: "What's your favorite music genre?",
      description: "Music taste reveals a lot about personality and creates great conversations",
      icon: MapPin,
      options: [
        { value: 'pop', label: 'Pop & Top 40', description: 'Love the latest hits and mainstream favorites' },
        { value: 'rock', label: 'Rock & Alternative', description: 'Classic rock, indie, or alternative vibes' },
        { value: 'hiphop', label: 'Hip-Hop & R&B', description: 'Beats, rap, and soulful R&B tracks' },
        { value: 'electronic', label: 'Electronic & EDM', description: 'House, techno, and electronic beats' },
        { value: 'indie', label: 'Indie & Folk', description: 'Independent artists and acoustic sounds' },
      ]
    },
    {
      id: 'favoriteShow',
      title: "What type of TV shows or movies do you love?",
      description: "Entertainment preferences spark great discussions and recommendations",
      icon: Users,
      options: [
        { value: 'comedy', label: 'Comedy & Sitcoms', description: 'Love to laugh and share funny moments' },
        { value: 'drama', label: 'Drama & Thrillers', description: 'Enjoy complex stories and character development' },
        { value: 'scifi', label: 'Sci-Fi & Fantasy', description: 'Fascinated by futuristic worlds and magic' },
        { value: 'reality', label: 'Reality & Competition', description: 'Enjoy real people and competitive shows' },
        { value: 'documentary', label: 'Documentaries & True Crime', description: 'Love learning and real-life mysteries' },
      ]
    },
    {
      id: 'personalityType',
      title: "How would you describe your personality?",
      description: "Understanding personality helps create compatible connections",
      icon: Zap,
      options: [
        { value: 'outgoing', label: 'Outgoing & Social', description: 'Love meeting new people and being around others' },
        { value: 'thoughtful', label: 'Thoughtful & Deep', description: 'Enjoy meaningful conversations and reflection' },
        { value: 'adventurous', label: 'Adventurous & Spontaneous', description: 'Always up for trying new things and experiences' },
        { value: 'chill', label: 'Chill & Easygoing', description: 'Relaxed approach to life and go with the flow' },
        { value: 'passionate', label: 'Passionate & Driven', description: 'Enthusiastic about goals and interests' },
      ]
    },
    {
      id: 'hobbies',
      title: "What's your main hobby or interest?",
      description: "Shared hobbies create instant connections and talking points",
      icon: Calendar,
      options: [
        { value: 'fitness', label: 'Fitness & Sports', description: 'Working out, yoga, running, or team sports' },
        { value: 'creative', label: 'Creative Arts', description: 'Photography, painting, music, or writing' },
        { value: 'tech', label: 'Technology & Gaming', description: 'Gadgets, video games, or coding' },
        { value: 'nature', label: 'Outdoor & Nature', description: 'Hiking, camping, or environmental activities' },
        { value: 'learning', label: 'Learning & Reading', description: 'Books, courses, podcasts, or new skills' },
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
            Welcome to TrueCircle! 
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
              <Label 
                key={option.value} 
                htmlFor={option.value} 
                className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
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