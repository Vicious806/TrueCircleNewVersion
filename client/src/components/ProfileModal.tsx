import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Music, Camera, Dumbbell, Book, Plane, Gamepad, User as UserIcon } from "lucide-react";
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
  
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      const userData = user as User;
      setUsername(userData.username || '');
      setBio(userData.bio || '');
      setProfileImageUrl(userData.profileImageUrl || '');
      setInterests(userData.interests || []);
    }
  }, [user]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Convert to base64 data URL for preview and storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest('PUT', '/api/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
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
    const profileData = {
      username: username.trim(),
      bio: bio.trim(),
      profileImageUrl: profileImageUrl.trim(),
      interests,
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
          {/* Profile Picture Preview */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Username */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
            <p className="text-xs text-gray-500 mt-1">Choose a unique username</p>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture</Label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="profile-picture-upload"
              />
              <label
                htmlFor="profile-picture-upload"
                className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Choose Image</span>
              </label>
              {profileImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileImageUrl('')}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload an image file (PNG, JPG, etc.) - Max 5MB</p>
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
            disabled={updateProfileMutation.isPending}
            className="flex-1 gradient-primary text-white font-semibold"
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}