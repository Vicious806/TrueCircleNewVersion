import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, MessageCircle, Calendar, Coffee, Utensils, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { MatchWithUsers } from "@shared/schema";

export default function Matches() {
  const [, setLocation] = useLocation();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['/api/user/matches'],
  }) as { data: MatchWithUsers[], isLoading: boolean };

  const getVenueIcon = (venueType: string) => {
    return venueType === 'restaurant' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />;
  };

  const getVenueLabel = (venueType: string) => {
    return venueType === 'restaurant' ? 'Restaurant' : 'Cafe';
  };

  const getMeetupTypeLabel = (meetupType: string) => {
    return meetupType === '1v1' ? '1-on-1 Meetup' : 'Group Meetup';
  };

  const handleStartChat = (matchId: number) => {
    setLocation(`/chat/${matchId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Your Matches</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
            <p className="text-gray-600 mb-6">
              Use smart matching to find compatible people for dining meetups.
            </p>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Matching
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900">
                      {getMeetupTypeLabel(match.meetupType)}
                    </CardTitle>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      {getVenueIcon(match.venueType)}
                      <span>{getVenueLabel(match.venueType)}</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{match.participants.length} people</span>
                      </div>
                      {match.matchScore && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <span className="font-medium">{match.matchScore}% compatible</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Matched Users */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Your matches:</h4>
                    <div className="flex -space-x-2">
                      {match.users?.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="w-8 h-8 border-2 border-white">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {user.firstName?.[0] || user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {match.users && match.users.length > 3 && (
                        <div className="w-8 h-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{match.users.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggested Details */}
                  {(match.suggestedDate || match.suggestedTime) && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <h5 className="font-medium text-gray-900 text-sm">Suggested details:</h5>
                      <div className="space-y-1">
                        {match.suggestedDate && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>{match.suggestedDate}</span>
                          </div>
                        )}
                        {match.suggestedTime && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span className="capitalize">{match.suggestedTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleStartChat(match.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Group Chat
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}