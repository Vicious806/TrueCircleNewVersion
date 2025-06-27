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
import { Clock, MapPin, Users, Sparkles, Coffee, Utensils } from "lucide-react";
import type { MeetupRequestFormData } from "@shared/schema";

interface SmartMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupType: '1v1' | 'group';
}

const timeOptions = [
  { value: 'lunch', label: '1:00 PM (Lunch)', icon: '🍽️' },
  { value: 'dinner', label: '5:30 PM (Dinner)', icon: '🌆' },
];

const venueOptions = [
  { value: 'restaurant', label: 'Restaurant', description: 'Full meals and dining experience', icon: Utensils },
  { value: 'cafe', label: 'Cafe', description: 'Coffee, light meals, and casual atmosphere', icon: Coffee },
];

// Helper function to get the next few Fridays
// Note: This is a simplified version - the backend will check for waiting users
function getNextFridays(count: number) {
  const fridays = [];
  const today = new Date();
  let currentDate = new Date(today);
  
  // Find the next Friday
  const daysUntilFriday = (5 - currentDate.getDay() + 7) % 7;
  
  // Basic cutoff: Skip current Friday if it's Friday after 6 PM
  // (Backend will handle the smart logic for waiting users)
  const shouldSkipCurrentFriday = 
    (daysUntilFriday === 0 && currentDate.getHours() >= 18); // Friday after 6 PM only
  
  if (shouldSkipCurrentFriday) {
    // Start from next Friday
    currentDate.setDate(currentDate.getDate() + 7);
  } else {
    currentDate.setDate(currentDate.getDate() + daysUntilFriday);
  }
  
  for (let i = 0; i < count; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const formatted = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    fridays.push({
      value: dateStr,
      label: formatted
    });
    
    // Move to next Friday
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return fridays;
}

export default function SmartMatchingModal({ isOpen, onClose, meetupType }: SmartMatchingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [venueType, setVenueType] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [maxDistance, setMaxDistance] = useState([10]);
  const [ageRange, setAgeRange] = useState([18, 50]);

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
    if (!venueType || !preferredDate || !preferredTime) {
      toast({
        title: "Missing Information",
        description: "Please select venue type, date, and time preferences.",
        variant: "destructive",
      });
      return;
    }

    const requestData: MeetupRequestFormData = {
      meetupType,
      venueType: venueType as any,
      preferredDate,
      preferredTime: preferredTime as any,
      maxDistance: maxDistance[0],
      ageRangeMin: ageRange[0],
      ageRangeMax: ageRange[1]
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
          {/* Age Range Preference */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Age Range Preference
            </Label>
            {meetupType === 'group' ? (
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 18 && ageRange[1] === 28
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 28])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">18-28</h4>
                    <p className="text-sm text-gray-600">Young Adults</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 28 && ageRange[1] === 50
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([28, 50])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">28-50+</h4>
                    <p className="text-sm text-gray-600">Professionals</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 18 && ageRange[1] === 50
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 50])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">No Preference</h4>
                    <p className="text-sm text-gray-600">All Ages</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3">
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={50}
                  step={3}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18</span>
                  <span>50+</span>
                </div>
                <div className="text-center text-sm text-gray-700 mt-2">
                  Match with people ages {ageRange[0]} - {ageRange[1] === 50 ? '50+' : ageRange[1]}
                </div>
              </div>
            )}
          </div>

          {/* Venue Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Where would you like to meet? *
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {venueOptions.map((venue) => (
                <div
                  key={venue.value}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    venueType === venue.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setVenueType(venue.value)}
                >
                  <div className="flex items-center space-x-3">
                    <venue.icon className={`w-5 h-5 ${venueType === venue.value ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{venue.label}</h4>
                      <p className="text-sm text-gray-600">{venue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date Selection - Only Fridays */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Which Friday would you like to meet?
            </Label>
            <Select value={preferredDate} onValueChange={setPreferredDate}>
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Select a Friday" />
              </SelectTrigger>
              <SelectContent>
                {getNextFridays(4).map((friday: { value: string; label: string }) => (
                  <SelectItem key={friday.value} value={friday.value}>
                    {friday.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Sparkles className="w-5 h-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-gray-900">Smart Matching</h4>
            </div>
            <p className="text-sm text-gray-600">
              We'll match you with compatible people based on your conversation topics, 
              shared interests, and venue preferences from your survey.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
          <Button 
            onClick={handleSubmit}
            disabled={createMatchingRequest.isPending || !venueType || !preferredDate || !preferredTime}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {createMatchingRequest.isPending ? 'Finding Compatible People...' : 'Find Compatible People'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}