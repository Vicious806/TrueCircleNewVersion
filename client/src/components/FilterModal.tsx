import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Music, Camera, Dumbbell, Book, Plane, Gamepad, X } from "lucide-react";
import type { MeetupFilter, MeetupWithCreator } from "@shared/schema";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetupType: '1v1' | '3people' | 'group';
}

const interestOptions = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'reading', label: 'Reading', icon: Book },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'gaming', label: 'Gaming', icon: Gamepad },
];

export default function FilterModal({ isOpen, onClose, meetupType }: FilterModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [ageRangeMin, setAgeRangeMin] = useState(18);
  const [ageRangeMax, setAgeRangeMax] = useState(35);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [restaurantType, setRestaurantType] = useState<string>('any');
  const [maxDistance, setMaxDistance] = useState(10);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const { data: availableMeetups = [] } = useQuery({
    queryKey: ['/api/meetups', { meetupType }],
    queryFn: async () => {
      const response = await fetch(`/api/meetups?meetupType=${meetupType}`);
      if (!response.ok) throw new Error('Failed to fetch meetups');
      return response.json();
    },
    enabled: isOpen,
  });

  const createMeetupMutation = useMutation({
    mutationFn: async (meetupData: any) => {
      return apiRequest('POST', '/api/meetups', meetupData);
    },
    onSuccess: async (response) => {
      const meetup = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/meetups'] });
      
      toast({
        title: "Meetup Created!",
        description: "You've been added to the chat. Start connecting!",
      });
      
      onClose();
      setLocation(`/chat/${meetup.id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create meetup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinMeetupMutation = useMutation({
    mutationFn: async (meetupId: number) => {
      return apiRequest('POST', `/api/meetups/${meetupId}/join`);
    },
    onSuccess: (_, meetupId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/meetups'] });
      
      toast({
        title: "Joined Meetup!",
        description: "You've been added to the chat. Start connecting!",
      });
      
      onClose();
      setLocation(`/chat/${meetupId}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to join meetup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleCreateMeetup = () => {
    const maxParticipants = meetupType === '1v1' ? 2 : meetupType === '3people' ? 3 : 8;
    
    const meetupData = {
      title: `${meetupType === '1v1' ? '1-on-1' : meetupType === '3people' ? '3 People' : 'Group'} Meetup`,
      description: `Join us for a ${restaurantType === 'any' ? 'casual' : restaurantType} dining experience!`,
      meetupType,
      maxParticipants,
      restaurantType: restaurantType === 'any' ? null : restaurantType,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      ageRangeMin,
      ageRangeMax,
      maxDistance,
      requiredInterests: selectedInterests,
    };

    createMeetupMutation.mutate(meetupData);
  };

  const handleJoinMeetup = (meetupId: number) => {
    joinMeetupMutation.mutate(meetupId);
  };

  const filteredMeetups = availableMeetups.filter((meetup: MeetupWithCreator) => {
    if (meetup.ageRangeMin && meetup.ageRangeMin > ageRangeMax) return false;
    if (meetup.ageRangeMax && meetup.ageRangeMax < ageRangeMin) return false;
    if (restaurantType !== 'any' && meetup.restaurantType && meetup.restaurantType !== restaurantType) return false;
    if (meetup.maxDistance && meetup.maxDistance < maxDistance) return false;
    return true;
  });

  const modalTitles = {
    '1v1': 'Find Your 1-on-1 Match',
    '3people': 'Join a 3-Person Meetup',
    'group': 'Find a Group Meetup'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {modalTitles[meetupType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Age Range */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Age Range</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={ageRangeMin.toString()} onValueChange={(value) => setAgeRangeMin(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">18</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ageRangeMax.toString()} onValueChange={(value) => setAgeRangeMax(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="35">35</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="45">45</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interests */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Interests</Label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => {
                const Icon = interest.icon;
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <Button
                    key={interest.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleInterest(interest.id)}
                    className={`flex items-center justify-center px-3 py-2 rounded-xl transition-colors text-sm ${
                      isSelected 
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'bg-gray-100 hover:bg-primary hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {interest.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Restaurant Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Restaurant Preference</Label>
            <RadioGroup value={restaurantType} onValueChange={setRestaurantType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual">Casual Dining</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fine" id="fine" />
                <Label htmlFor="fine">Fine Dining</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fast" id="fast" />
                <Label htmlFor="fast">Fast Casual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id="any" />
                <Label htmlFor="any">Any</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Distance */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Maximum Distance</Label>
            <Select value={maxDistance.toString()} onValueChange={(value) => setMaxDistance(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Within 5 miles</SelectItem>
                <SelectItem value="10">Within 10 miles</SelectItem>
                <SelectItem value="15">Within 15 miles</SelectItem>
                <SelectItem value="25">Within 25 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Preference */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">When would you like to meet?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input 
                type="date" 
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <Select value={scheduledTime} onValueChange={setScheduledTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch">Lunch (12-2 PM)</SelectItem>
                  <SelectItem value="dinner">Dinner (6-8 PM)</SelectItem>
                  <SelectItem value="brunch">Brunch (10-12 PM)</SelectItem>
                  <SelectItem value="late-dinner">Late Dinner (8-10 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Available Meetups */}
          {filteredMeetups.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Available Meetups</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredMeetups.map((meetup: MeetupWithCreator) => (
                  <div key={meetup.id} className="p-3 border rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{meetup.title}</p>
                      <p className="text-xs text-gray-500">
                        by {meetup.creator.firstName} • {meetup.currentParticipants}/{meetup.maxParticipants} joined
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleJoinMeetup(meetup.id)}
                      disabled={joinMeetupMutation.isPending}
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
          <Button 
            onClick={handleCreateMeetup}
            disabled={createMeetupMutation.isPending}
            className="w-full gradient-primary text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {createMeetupMutation.isPending ? 'Creating...' : 'Create New Meetup'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
