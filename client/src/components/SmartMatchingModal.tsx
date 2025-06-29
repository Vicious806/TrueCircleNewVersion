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
  { value: 'brunch', label: '11:00 AM (Brunch)', icon: '🥞' },
  { value: 'lunch', label: '1:00 PM (Lunch)', icon: '🍽️' },
  { value: 'dinner', label: '6:00 PM (Dinner)', icon: '🌆' },
];

const venueOptions = [
  { value: 'restaurant', label: 'Restaurant', description: 'Full meals and dining experience', icon: Utensils },
  { value: 'cafe', label: 'Cafe', description: 'Coffee, light meals, and casual atmosphere', icon: Coffee },
];

// Helper function to get the next few Fridays
function getNextSaturdays(count: number) {
  const saturdays = [];
  const today = new Date();
  let currentDate = new Date(today);
  
  // Find the next Saturday
  const daysUntilSaturday = (6 - currentDate.getDay() + 7) % 7;
  
  // Skip current Saturday if it's Friday after 10 PM or later
  const shouldSkipCurrentSaturday = 
    (currentDate.getDay() === 5 && currentDate.getHours() >= 22) || // Friday 10 PM or later
    (currentDate.getDay() === 6) || // Saturday (any time)
    (currentDate.getDay() === 0); // Sunday
  
  if (shouldSkipCurrentSaturday || daysUntilSaturday === 0) {
    // Start from next Saturday
    currentDate.setDate(currentDate.getDate() + 7 - daysUntilSaturday);
    if (daysUntilSaturday === 0) {
      currentDate.setDate(currentDate.getDate() + 7);
    }
  } else {
    currentDate.setDate(currentDate.getDate() + daysUntilSaturday);
  }
  
  for (let i = 0; i < count; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const formatted = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
    
    saturdays.push({
      value: dateStr,
      label: formatted
    });
    
    // Move to next Saturday
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return saturdays;
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
  const [ageRange, setAgeRange] = useState([18, 24]);
  const [conflictInfo, setConflictInfo] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<MeetupRequestFormData | null>(null);

  const createMatchingRequest = useMutation({
    mutationFn: async (requestData: MeetupRequestFormData) => {
      const response = await fetch('/api/matching-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409 && errorData.conflict) {
          // Conflict detected - store the actual backend response
          throw new Error(JSON.stringify({
            type: 'conflict',
            ...errorData
          }));
        }
        throw new Error(errorData.message || 'Failed to create request');
      }
      
      return response.json();
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
      // Check if this is a conflict error (409 status)
      if (error.message.includes('You already have an active request')) {
        setConflictInfo({
          message: error.message,
          existingRequest: { meetupType: 'existing' }
        });
        setPendingRequest({
          meetupType,
          venueType: venueType as any,
          preferredDate,
          preferredTime: preferredTime as any,
          maxDistance: maxDistance[0],
          ageRangeMin: ageRange[0],
          ageRangeMax: ageRange[1],
        });
        return;
      }
      
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

  const cancelExistingRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/matching-request/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      if (pendingRequest) {
        createMatchingRequest.mutate(pendingRequest);
      }
      setConflictInfo(null);
      setPendingRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConflictCancel = async () => {
    // Get the first active request ID from database
    const response = await fetch('/api/user/active-request', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const activeRequest = await response.json();
      if (activeRequest?.id) {
        cancelExistingRequest.mutate(activeRequest.id);
      }
    }
  };

  const handleConflictKeep = () => {
    setConflictInfo(null);
    setPendingRequest(null);
  };

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
                    ageRange[0] === 18 && ageRange[1] === 20
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 20])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">18-20</h4>
                    <p className="text-sm text-gray-600">Freshmen/Sophomore</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 21 && ageRange[1] === 24
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([21, 24])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">21-24</h4>
                    <p className="text-sm text-gray-600">Junior/Senior</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 18 && ageRange[1] === 24
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 24])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">No Preference</h4>
                    <p className="text-sm text-gray-600">All College Ages</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3">
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={24}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18</span>
                  <span>24</span>
                </div>
                <div className="text-center text-sm text-gray-700 mt-2">
                  Match with college students ages {ageRange[0]} - {ageRange[1]}
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

          {/* Date Selection - Only Saturdays */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Which Saturday would you like to meet?
            </Label>
            <Select value={preferredDate} onValueChange={setPreferredDate}>
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Select a Saturday" />
              </SelectTrigger>
              <SelectContent>
                {getNextSaturdays(2).map((saturday: { value: string; label: string }) => (
                  <SelectItem key={saturday.value} value={saturday.value}>
                    {saturday.label}
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
      
      {/* Conflict Resolution Dialog */}
      {conflictInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-3">Existing Request Found</h3>
            <p className="text-gray-600 mb-4">
              You already have an active matching request. You can only have one active request at a time.
              Would you like to cancel your existing request and create this new {meetupType} request instead?
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleConflictKeep}
                variant="outline"
                className="flex-1"
              >
                Keep Existing
              </Button>
              <Button 
                onClick={handleConflictCancel}
                disabled={cancelExistingRequest.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {cancelExistingRequest.isPending ? 'Canceling...' : 'Cancel & Create New'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}