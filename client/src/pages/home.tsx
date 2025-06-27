import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings, Clock, Star, Users, User as UserIcon, UserPlus, Users2, UserCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import SmartMatchingModal from "@/components/SmartMatchingModal";
import MeetupCard from "@/components/MeetupCard";
import ProfileModal from "@/components/ProfileModal";
import LocationModal from "@/components/LocationModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MeetupWithCreator, User } from "@shared/schema";

export default function Home() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [selectedMeetupType, setSelectedMeetupType] = useState<'1v1' | 'group'>('1v1');
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



  const handleMeetupTypeSelect = (type: '1v1' | 'group') => {
    setSelectedMeetupType(type);
    setShowMatchingModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="font-bold text-gray-900">
                Hi, {userData?.firstName || 'there'}!
              </h1>
              <p className="text-sm text-gray-500">Ready to make new friends?</p>
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
        {/* Location Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MapPin className="text-blue-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Location</h3>
                  <p className="text-sm text-gray-600">
                    {userData?.location || 'Set your location'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700"
                onClick={() => setShowLocationModal(true)}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>



        {/* Meetup Options */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Get Smart Matched</h2>
          
          {/* 1-on-1 Meetup */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-100"
            onClick={() => handleMeetupTypeSelect('1v1')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <UserCheck className="text-white h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">1-on-1 Match</h3>
                    <p className="text-gray-600 text-sm">Get matched with one compatible person</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Group Meetup */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-100"
            onClick={() => handleMeetupTypeSelect('group')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Users className="text-white h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Group Match</h3>
                    <p className="text-gray-600 text-sm">Join a larger compatible group</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        ⚡ Faster Matching
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Active Match */}
        {userMatches.length > 0 && (
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Current Match</h3>
              <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userMatches[0].meetupType === '1v1' ? '1-on-1' : 'Group'} Match
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
      />

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        currentLocation={userData?.location || undefined}
      />
    </div>
  );
}
