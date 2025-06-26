import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings, Clock, Star, Users, User as UserIcon, UserPlus, Users2 } from "lucide-react";
import { useState } from "react";
import FilterModal from "@/components/FilterModal";
import MeetupCard from "@/components/MeetupCard";
import ProfileModal from "@/components/ProfileModal";
import type { MeetupWithCreator, User } from "@shared/schema";

export default function Home() {
  const { user, logout } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMeetupType, setSelectedMeetupType] = useState<'1v1' | '3people' | 'group'>('1v1');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { data: userMeetups = [] } = useQuery({
    queryKey: ['/api/user/meetups'],
  }) as { data: MeetupWithCreator[] };

  const userData = user as User;
  const initials = userData?.firstName && userData?.lastName 
    ? `${userData.firstName[0]}${userData.lastName[0]}` 
    : userData?.email?.[0]?.toUpperCase() || 'U';

  const handleMeetupTypeSelect = (type: '1v1' | '3people' | 'group') => {
    setSelectedMeetupType(type);
    setShowFilterModal(true);
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
        <Card className="mb-6 bg-gradient-to-r from-amber-50 to-amber-25 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <MapPin className="text-amber-600 h-5 w-5" />
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
                className="text-amber-600 hover:text-amber-700"
                onClick={() => setShowProfileModal(true)}
              >
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meetup Options */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Your Meetup Style</h2>
          
          {/* 1-on-1 Meetup */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-100"
            onClick={() => handleMeetupTypeSelect('1v1')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center">
                    <Users2 className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">1-on-1 Meetup</h3>
                    <p className="text-gray-600 text-sm">Connect with one person over a meal</p>
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

          {/* 3 People Meetup */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-100"
            onClick={() => handleMeetupTypeSelect('3people')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
                    <div className="flex items-center space-x-0.5">
                      <UserIcon className="text-white h-4 w-4" />
                      <UserIcon className="text-white h-4 w-4" />
                      <UserIcon className="text-white h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">3 People Meetup</h3>
                    <p className="text-gray-600 text-sm">Small group dining experience</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        💬 Great vibes
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

          {/* 3+ People Meetup */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow border-gray-100"
            onClick={() => handleMeetupTypeSelect('group')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 gradient-accent rounded-2xl flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <UserIcon className="text-white h-3 w-3" />
                      <UserIcon className="text-white h-3 w-3" />
                      <UserIcon className="text-white h-3 w-3" />
                      <UserIcon className="text-white h-3 w-3" />
                      <UserIcon className="text-white h-3 w-3" />
                      <UserIcon className="text-white h-3 w-3" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Group Meetup</h3>
                    <p className="text-gray-600 text-sm">Join a lively group gathering</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        🔥 Energetic
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

        {/* Recent Activity */}
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Recent Meetups</h3>
            {userMeetups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No meetups yet. Join your first one above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userMeetups.slice(0, 3).map((meetup: MeetupWithCreator) => (
                  <MeetupCard key={meetup.id} meetup={meetup} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        meetupType={selectedMeetupType}
      />
    </div>
  );
}
