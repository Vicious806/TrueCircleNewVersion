import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Heart, Clock, MapPin, Users, Sparkles } from "lucide-react";
import type { MeetupRequestFormData } from "@shared/schema";

interface SmartMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupType: '1v1' | 'group';
}

const timeOptions = [
  { value: 'lunch', label: 'Lunch (12-2 PM)', icon: '🍽️' },
  { value: 'dinner', label: 'Dinner (6-8 PM)', icon: '🌆' },
  { value: 'brunch', label: 'Brunch (10-12 PM)', icon: '🥐' },
  { value: 'late-dinner', label: 'Late Dinner (8-10 PM)', icon: '🌙' },
];

export default function SmartMatchingModal({ isOpen, onClose, meetupType }: SmartMatchingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [maxDistance, setMaxDistance] = useState([10]);

  const createMatchingRequest = useMutation({
    mutationFn: async (requestData: MeetupRequestFormData) => {
      return apiRequest('POST', '/api/matching-request', requestData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/matches'] });
      
      toast({
        title: "Looking for your perfect match!",
        description: "We're finding compatible people based on your preferences. You'll be notified when we find a match!",
      });
      
      onClose();
      // Redirect to matches page
      setLocation('/matches');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again.",
          variant: "destructive",
        });
        setLocation("/auth");
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create matching request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!preferredDate || !preferredTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time preferences.",
        variant: "destructive",
      });
      return;
    }

    const requestData: MeetupRequestFormData = {
      meetupType,
      preferredDate,
      preferredTime: preferredTime as any,
      preferredLocation: preferredLocation || undefined,
      maxDistance: maxDistance[0],
    };

    createMatchingRequest.mutate(requestData);
  };

  const modalTitles = {
    '1v1': 'Find Your Perfect 1-on-1 Match',
    'group': 'Find Your Group Match'
  };

  const modalDescriptions = {
    '1v1': 'Our smart matching will find someone compatible based on your survey responses and preferences.',
    'group': 'Join a larger group of like-minded people for a fun dining experience.'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 text-center">
            {modalTitles[meetupType]}
          </DialogTitle>
          <DialogDescription className="text-center">
            {modalDescriptions[meetupType]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              When would you like to meet?
            </Label>
            <Input 
              type="date" 
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mb-3"
            />
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select preferred time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center">
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Preference */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Preferred Area (Optional)
            </Label>
            <Input 
              placeholder="e.g., Downtown, Brooklyn, specific restaurant..."
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to let us suggest great places for you
            </p>
          </div>

          {/* Distance */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Maximum Distance: {maxDistance[0]} miles
            </Label>
            <Slider
              value={maxDistance}
              onValueChange={setMaxDistance}
              max={25}
              min={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10 miles</span>
              <span>25 miles</span>
            </div>
          </div>

          {/* Smart Matching Info */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
            <div className="flex items-center mb-2">
              <Heart className="w-5 h-5 text-pink-500 mr-2" />
              <h4 className="font-medium text-gray-900">Smart Matching</h4>
            </div>
            <p className="text-sm text-gray-600">
              We'll match you with compatible people based on your conversation topics, 
              communication style, social energy, and dining preferences from your survey.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
          <Button 
            onClick={handleSubmit}
            disabled={createMatchingRequest.isPending || !preferredDate || !preferredTime}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {createMatchingRequest.isPending ? 'Finding Your Match...' : 'Find My Perfect Match'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}