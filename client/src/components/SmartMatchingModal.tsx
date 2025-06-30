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
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";

interface SmartMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupType: 'group';
  preselectedVenueType?: 'cafe' | 'restaurant';
}

const timeOptions = [
  { value: 'brunch', label: '11:00 AM (Brunch)', icon: '🥐' },
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
  
  // Start from today and look for Saturdays at least 2 days away
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 2); // At least 2 days away
  
  // Find the next Saturday from that point
  while (currentDate.getDay() !== 6) { // 6 = Saturday
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate the requested number of Saturdays
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
    
    // Move to next Saturday (7 days later)
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return saturdays;
}

export default function SmartMatchingModal({ isOpen, onClose, meetupType, preselectedVenueType }: SmartMatchingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [venueType, setVenueType] = useState(preselectedVenueType || '');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [maxDistance, setMaxDistance] = useState([5]);
  const [ageRange, setAgeRange] = useState([18, 80]);
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
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.type === 'conflict') {
          setConflictInfo({
            message: errorObj.message,
            existingRequest: errorObj.existingRequest
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
      } catch (e) {
        // Not a JSON error, fall through to other checks
      }

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

  const handleModalClose = () => {
    // Clear any pending conflict when closing modal
    setConflictInfo(null);
    setPendingRequest(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!preferredDate || !preferredTime) {
      toast({
        title: "Missing Information",
        description: "Please select date and time preferences.",
        variant: "destructive",
      });
      return;
    }

    const requestData: MeetupRequestFormData = {
      meetupType,
      venueType: (venueType || preselectedVenueType) as any,
      preferredDate,
      preferredTime: preferredTime as any,
      maxDistance: maxDistance[0],
      ageRangeMin: ageRange[0],
      ageRangeMax: ageRange[1]
    };

    createMatchingRequest.mutate(requestData);
  };

  const modalTitle = preselectedVenueType === 'cafe' 
    ? 'Find Your Cafe Group' 
    : 'Find Your Restaurant Group';
  const modalDescription = preselectedVenueType === 'cafe'
    ? 'Join college students at a cozy cafe this Saturday.'
    : 'Join college students for a restaurant meal this Saturday.';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto mb-4">
            <img 
              src={truecircleLogo} 
              alt="TrueCircle Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 text-center">
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-center">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="space-y-6">
          {/* Age Range Preference */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Age Range Preference
            </Label>
            {meetupType === 'group' ? (
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 18 && ageRange[1] === 22
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 22])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">18-22</h4>
                    <p className="text-xs text-gray-600">College Age</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 23 && ageRange[1] === 27
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([23, 27])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">23-27</h4>
                    <p className="text-xs text-gray-600">Post-Grad</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 28 && ageRange[1] === 35
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([28, 35])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">28-35</h4>
                    <p className="text-xs text-gray-600">Young Professional</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 36 && ageRange[1] === 45
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([36, 45])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">36-45</h4>
                    <p className="text-xs text-gray-600">Established</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 46 && ageRange[1] === 60
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([46, 60])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">46-60</h4>
                    <p className="text-xs text-gray-600">Experienced</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 61 && ageRange[1] === 80
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([61, 80])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">61-80</h4>
                    <p className="text-xs text-gray-600">Senior</p>
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    ageRange[0] === 18 && ageRange[1] === 80
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAgeRange([18, 80])}
                >
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">No Preference</h4>
                    <p className="text-xs text-gray-600">All Ages</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3">
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={18}
                  max={80}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18</span>
                  <span>80</span>
                </div>
                <div className="text-center text-sm text-gray-700 mt-2">
                  Match with ages {ageRange[0]} - {ageRange[1]}
                </div>
              </div>
            )}
          </div>



          {/* Selected Venue Type Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              {preselectedVenueType === 'cafe' ? (
                <Coffee className="w-5 h-5 text-blue-600" />
              ) : (
                <Utensils className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">Selected Venue</h4>
                <p className="text-sm text-gray-600">
                  {preselectedVenueType === 'cafe' ? '☕ Cafe - Coffee & Casual' : '🍽️ Restaurant - Full Dining'}
                </p>
              </div>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              When would you like to meet?
            </Label>
            <Select value={preferredDate} onValueChange={setPreferredDate}>
              <SelectTrigger className="mb-3">
                <SelectValue placeholder="Select a Saturday" />
              </SelectTrigger>
              <SelectContent>
                {getNextSaturdays(3).map((saturday: { value: string; label: string }) => (
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
              min={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 miles</span>
              <span>25 miles</span>
            </div>
          </div>



          {/* Smart Matching Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center mb-2">
              <Sparkles className="w-5 h-5 text-primary mr-2" />
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
              type="submit"
              disabled={createMatchingRequest.isPending || !venueType || !preferredDate || !preferredTime}
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {createMatchingRequest.isPending ? 'Finding Your True Circle...' : 'Find Your True Circle'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Conflict Resolution Dialog */}
      {conflictInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-3">Existing Request Found</h3>
            <p className="text-gray-600 mb-4">
              {conflictInfo.message}
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