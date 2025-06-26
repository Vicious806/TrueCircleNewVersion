import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Settings, Clock, Star, Users, User, UserPlus } from "lucide-react";
import { useState } from "react";
import FilterModal from "@/components/FilterModal";
import MeetupCard from "@/components/MeetupCard";
import type { MeetupWithCreator } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMeetupType, setSelectedMeetupType] = useState<'1v1' | '3people' | 'group'>('1v1');

  const { data: userMeetups = [] } = useQuery({
    queryKey: ['/api/user/meetups'],
  });

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.email?.[0]?.toUpperCase() || 'U';

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
            <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{initials}</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">
                Hi, {user?.firstName || 'there'}!
              </h1>
              <p className="text-sm text-gray-500">Ready to make new friends?</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/api/logout'}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Settings className="h-5 w-5" />
          </Button>
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
                    {user?.location || 'Set your location'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
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
                    <User className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">1-on-1 Meetup</h3>
                    <p className="text-gray-600 text-sm">Connect with one person over a meal</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        1-2 hours
                      </Badge>
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
                    <Users className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">3 People Meetup</h3>
                    <p className="text-gray-600 text-sm">Small group dining experience</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        1.5-2.5 hours
                      </Badge>
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
                    <UserPlus className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Group Meetup</h3>
                    <p className="text-gray-600 text-sm">Join a lively group gathering</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        2-3 hours
                      </Badge>
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

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        meetupType={selectedMeetupType}
      />
    </div>
  );
}
