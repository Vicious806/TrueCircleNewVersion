import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  IdCard, 
  Phone, 
  Camera, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface TrustVerificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrustVerification({ isOpen, onClose }: TrustVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userData = user as User | undefined;
  const [phoneNumber, setPhoneNumber] = useState(userData?.phoneNumber || '');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const submitVerification = useMutation({
    mutationFn: async (data: { type: string; file?: File; phoneNumber?: string }) => {
      const formData = new FormData();
      formData.append('type', data.type);
      if (data.file) {
        formData.append('file', data.file);
      }
      if (data.phoneNumber) {
        formData.append('phoneNumber', data.phoneNumber);
      }

      const response = await fetch('/api/user/verification', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Verification Submitted",
        description: `Your ${variables.type} verification has been submitted for review.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTrustScore = () => {
    let score = 0;
    if (userData?.isEmailVerified) score += 20;
    if (userData?.dateOfBirth) score += 20; // Exact birth date
    if (userData?.isPhoneVerified) score += 20;
    if (userData?.isIdVerified) score += 20;
    if (userData?.isProfilePictureVerified) score += 20;
    return score;
  };

  const trustScore = calculateTrustScore();
  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'High Trust', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { label: 'Good Trust', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (score >= 40) return { label: 'Medium Trust', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 20) return { label: 'Basic Trust', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { label: 'New User', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const trustLevel = getTrustLevel(trustScore);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Trust Verification</h2>
              <p className="text-gray-600">Build trust with other users by verifying your identity</p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Trust Score Display */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Your Trust Score</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-bold text-primary">{trustScore}</div>
                  <div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${trustLevel.color} ${trustLevel.bgColor}`}>
                      {trustLevel.label}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">out of 100 points</div>
                  </div>
                </div>
              </div>
              <Progress value={trustScore} className="h-2" />
              <p className="text-sm text-gray-600 mt-2">
                Higher trust scores make you more attractive to potential meetup partners
              </p>
            </CardContent>
          </Card>

          {/* Verification Methods */}
          <div className="space-y-4">
            {/* Email Verification */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-sm text-gray-600">Confirm your email address</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">+20 points</span>
                    {user?.isEmailVerified ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date of Birth */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Exact Birth Date</h4>
                      <p className="text-sm text-gray-600">Provide your exact date of birth</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">+20 points</span>
                    {user?.dateOfBirth ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Verification */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Phone Verification</h4>
                      <p className="text-sm text-gray-600">Verify your phone number via SMS</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">+20 points</span>
                    {user?.isPhoneVerified ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                {!user?.isPhoneVerified && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={() => submitVerification.mutate({ type: 'phone', phoneNumber })}
                      disabled={!phoneNumber || submitVerification.isPending}
                      size="sm"
                    >
                      {submitVerification.isPending ? 'Sending...' : 'Send Verification Code'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ID Verification */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <IdCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">ID Verification</h4>
                      <p className="text-sm text-gray-600">Upload government-issued ID for manual review</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">+20 points</span>
                    {user?.isIdVerified ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                {!user?.isIdVerified && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="id-upload">Upload ID Document</Label>
                      <Input
                        id="id-upload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Driver's license, passport, or state ID. Manual review takes 1-2 business days.
                      </p>
                    </div>
                    <Button 
                      onClick={() => idFile && submitVerification.mutate({ type: 'id', file: idFile })}
                      disabled={!idFile || submitVerification.isPending}
                      size="sm"
                    >
                      {submitVerification.isPending ? 'Uploading...' : 'Submit for Review'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Picture Verification */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Profile Picture Verification</h4>
                      <p className="text-sm text-gray-600">Upload a clear photo for manual review</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">+20 points</span>
                    {user?.isProfilePictureVerified ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
                {!user?.isProfilePictureVerified && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="photo-upload">Upload Profile Photo</Label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfilePictureFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Clear, recent photo showing your face. Manual review takes 1-2 business days.
                      </p>
                    </div>
                    <Button 
                      onClick={() => profilePictureFile && submitVerification.mutate({ type: 'profile_picture', file: profilePictureFile })}
                      disabled={!profilePictureFile || submitVerification.isPending}
                      size="sm"
                    >
                      {submitVerification.isPending ? 'Uploading...' : 'Submit for Review'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Why verify your identity?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Build trust with other users in the community</li>
              <li>• Get priority access to popular meetups</li>
              <li>• Increase your chances of being matched</li>
              <li>• Help create a safer environment for everyone</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}