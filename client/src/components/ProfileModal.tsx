import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Music, Camera, Dumbbell, Book, Plane, Gamepad } from "lucide-react";
import type { User } from "@shared/schema";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const interestOptions = [
  { id: 'music', label: 'Music', icon: Music },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'reading', label: 'Reading', icon: Book },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'gaming', label: 'Gaming', icon: Gamepad },
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const userData = user as User;
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setLocation(userData.location || '');
      setBio(userData.bio || '');
      setInterests(userData.interests || []);
      setIsAgeVerified(userData.isAgeVerified || false);
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest('PUT', '/api/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
      
      onClose();
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleInterest = (interestId: string) => {
    setInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSave = () => {
    if (!isAgeVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 18+ to use this platform.",
        variant: "destructive",
      });
      return;
    }

    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      location: location.trim(),
      bio: bio.trim(),
      interests,
      isAgeVerified,
    };

    updateProfileMutation.mutate(profileData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Age Verification */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="age-verification"
                checked={isAgeVerified}
                onCheckedChange={(checked) => setIsAgeVerified(!!checked)}
              />
              <Label htmlFor="age-verification" className="text-sm font-medium text-gray-700">
                I confirm that I am 18 years or older
              </Label>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              This platform is exclusively for adults. Age verification is required.
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          {/* Bio */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{bio.length}/200 characters</p>
          </div>

          {/* Interests */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">Interests</Label>
            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => {
                const Icon = interest.icon;
                const isSelected = interests.includes(interest.id);
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
        </div>

        <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 flex space-x-3">
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateProfileMutation.isPending || !isAgeVerified}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}