import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings, Clock, Star, Users, User as UserIcon, UserPlus, Users2, UserCheck, Coffee, Utensils } from "lucide-react";
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";
import { useLocation } from "wouter";
import { useState } from "react";
import SmartMatchingModal from "@/components/SmartMatchingModal";
import MeetupCard from "@/components/MeetupCard";
import ProfileModal from "@/components/ProfileModal";
import LocationModal from "@/components/LocationModal";
import LocationBanner from "@/components/LocationBanner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MeetupWithCreator, User } from "@shared/schema";


export default function Home() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [selectedMeetupType, setSelectedMeetupType] = useState<'group'>('group');
  const [selectedVenueType, setSelectedVenueType] = useState<'cafe' | 'restaurant'>('cafe');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { data: userMatches = [] } = useQuery({
    queryKey: ['/api/user/matches'],
  }) as { data: any[] };

  const userData = user as User;
  const initials = userData?.firstName && userData?.lastName 
    ? `${userData.firstName[0]}${userData.lastName[0]}` 
    : userData?.email?.[0]?.toUpperCase() || 'U';

  const { toast } = useToast();



  const handleMeetupTypeSelect = (type: 'group', venueType: 'cafe' | 'restaurant') => {
    setSelectedMeetupType(type);
    setSelectedVenueType(venueType);
    setShowMatchingModal(true);
  };

  return (
    <div className="min-h-screen bg-white page-container">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img 
                src={truecircleLogo} 
                alt="TrueCircle Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">
                Hi, {userData?.firstName || 'there'}!
              </h1>
              <p className="text-sm text-gray-500">Ready to meet new people?</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline" 
              size="sm"
              onClick={() => setShowProfileModal(true)}
              className="p-2"
              title="Edit profile"
            >
              <div className="w-6 h-6 gradient-primary rounded-full flex items-center justify-center">
                {userData?.profileImageUrl ? (
                  <img 
                    src={userData.profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xs">{initials}</span>
                )}
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Location Banner - only shows if user doesn't have location */}
        <LocationBanner />



        {/* Meetup Options */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Saturday Meetups</h2>
          
          {/* Group Cafe */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-primary/30"
            onClick={() => handleMeetupTypeSelect('group', 'cafe')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Coffee className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cafe Group</h3>
                    <p className="text-gray-600 text-sm">Meet people at a cozy cafe this Saturday</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Group Restaurant */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-primary/30"
            onClick={() => handleMeetupTypeSelect('group', 'restaurant')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Utensils className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Restaurant Group</h3>
                    <p className="text-gray-600 text-sm">Join others for a restaurant meal this Saturday</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Active Match */}
        {userMatches.length > 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Current Match</h3>
              <div className="p-4 border rounded-lg bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Group Match
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {userMatches[0].participants?.length || 0} participants • {userMatches[0].status}
                    </p>
                    {userMatches[0].suggestedLocation && (
                      <p className="text-xs text-gray-500 mt-1">📍 {userMatches[0].suggestedLocation}</p>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setLocation('/chat')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      <SmartMatchingModal
        isOpen={showMatchingModal}
        onClose={() => setShowMatchingModal(false)}
        meetupType={selectedMeetupType}
        preselectedVenueType={selectedVenueType}
      />

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={userData?.location || undefined}
      />
    </div>
  );
}
