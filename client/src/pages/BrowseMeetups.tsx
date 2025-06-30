import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MapPin, 
  Clock, 
  Coffee, 
  Utensils, 
  Star,
  Shield,
  User,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface BrowsableMeetup {
  id: number;
  title: string;
  description: string;
  venueType: 'restaurant' | 'cafe';
  location: string;
  venueImageUrl?: string;
  scheduledDate: string;
  scheduledTime: string;
  currentParticipants: number;
  maxParticipants: number;
  ageRangeMin?: number;
  ageRangeMax?: number;
  distance?: number;
  creator: {
    id: number;
    username: string;
    profileImageUrl?: string;
    trustScore: number;
    bio?: string;
    isIdVerified: boolean;
    isPhoneVerified: boolean;
    isProfilePictureVerified: boolean;
  };
  participants: Array<{
    id: number;
    username: string;
    profileImageUrl?: string;
    trustScore: number;
    surveyData?: {
      favoriteConversationTopic?: string;
      favoriteMusic?: string;
      personalityType?: string;
    };
    bio?: string;
  }>;
}

export default function BrowseMeetups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMeetup, setSelectedMeetup] = useState<BrowsableMeetup | null>(null);

  const { data: meetups, isLoading } = useQuery({
    queryKey: ['/api/meetups/browse'],
    enabled: !!user,
  });

  const joinMeetup = useMutation({
    mutationFn: async (meetupId: number) => {
      const response = await fetch(`/api/meetups/${meetupId}/join`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join meetup');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meetups/browse'] });
      toast({
        title: "Successfully joined!",
        description: "You've joined the meetup. Check your matches page for the chat.",
      });
      setSelectedMeetup(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getVenueIcon = (venueType: string) => {
    return venueType === 'cafe' ? Coffee : Utensils;
  };

  const getTimeDisplay = (time: string) => {
    const timeMap: Record<string, string> = {
      'brunch': '11:00 AM',
      'lunch': '1:00 PM', 
      'dinner': '6:00 PM'
    };
    return timeMap[time] || time;
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'High Trust', color: 'bg-green-500' };
    if (score >= 50) return { label: 'Medium Trust', color: 'bg-yellow-500' };
    if (score >= 20) return { label: 'Basic Trust', color: 'bg-blue-500' };
    return { label: 'New User', color: 'bg-gray-500' };
  };

  const getDefaultVenueImage = (venueType: string) => {
    return venueType === 'cafe' 
      ? "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120' fill='%23f3f4f6'><rect width='200' height='120' fill='%23f9fafb'/><circle cx='100' cy='60' r='25' fill='%236b7280'/><text x='100' y='90' text-anchor='middle' fill='%23374151' font-family='Arial' font-size='12'>☕ Cafe</text></svg>"
      : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 120' fill='%23f3f4f6'><rect width='200' height='120' fill='%23fef3c7'/><circle cx='100' cy='60' r='25' fill='%23d97706'/><text x='100' y='90' text-anchor='middle' fill='%2392400e' font-family='Arial' font-size='12'>🍽️ Restaurant</text></svg>";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading available meetups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Meetups</h1>
          <p className="text-gray-600">Join existing groups or discover new dining experiences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetups && Array.isArray(meetups) ? meetups.map((meetup: BrowsableMeetup) => {
            const VenueIcon = getVenueIcon(meetup.venueType);
            const trustLevel = getTrustLevel(meetup.creator.trustScore);
            
            return (
              <Card key={meetup.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="relative">
                    <img
                      src={meetup.venueImageUrl || getDefaultVenueImage(meetup.venueType)}
                      alt={`${meetup.venueType} venue`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm"
                    >
                      <VenueIcon className="w-3 h-3 mr-1" />
                      {meetup.venueType === 'cafe' ? 'Cafe' : 'Restaurant'}
                    </Badge>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                      {meetup.currentParticipants}/{meetup.maxParticipants}
                    </div>
                  </div>
                  
                  <CardTitle className="text-lg">{meetup.title}</CardTitle>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={meetup.creator.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {meetup.creator.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{meetup.creator.username}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs text-white ${trustLevel.color}`}>
                      <Shield className="w-3 h-3 inline mr-1" />
                      {meetup.creator.trustScore}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="truncate">{meetup.location}</span>
                      {meetup.distance && (
                        <span className="ml-auto text-primary">
                          {meetup.distance} mi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(meetup.scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {getTimeDisplay(meetup.scheduledTime)}
                      </div>
                    </div>

                    {meetup.ageRangeMin && meetup.ageRangeMax && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        Ages {meetup.ageRangeMin}-{meetup.ageRangeMax}
                      </div>
                    )}

                    <Button 
                      onClick={() => setSelectedMeetup(meetup)}
                      className="w-full"
                      disabled={meetup.currentParticipants >= meetup.maxParticipants}
                    >
                      {meetup.currentParticipants >= meetup.maxParticipants ? 'Full' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="text-center py-12 col-span-full">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetups available</h3>
              <p className="text-gray-600">Create a smart match request to get started!</p>
            </div>
          )}
        </div>


      </div>

      {/* Meetup Details Modal */}
      {selectedMeetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-bold">{selectedMeetup.title}</h3>
                <Button variant="ghost" onClick={() => setSelectedMeetup(null)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Venue Image */}
                <img
                  src={selectedMeetup.venueImageUrl || getDefaultVenueImage(selectedMeetup.venueType)}
                  alt="Venue"
                  className="w-full h-48 object-cover rounded-lg"
                />

                {/* Creator Info */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Organized by</h4>
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedMeetup.creator.profileImageUrl} />
                      <AvatarFallback>
                        {selectedMeetup.creator.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{selectedMeetup.creator.username}</span>
                        <div className={`px-2 py-1 rounded-full text-xs text-white ${getTrustLevel(selectedMeetup.creator.trustScore).color}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {selectedMeetup.creator.trustScore}
                        </div>
                      </div>
                      <div className="flex space-x-2 mb-2">
                        {selectedMeetup.creator.isIdVerified && (
                          <Badge variant="outline" className="text-xs">ID ✓</Badge>
                        )}
                        {selectedMeetup.creator.isPhoneVerified && (
                          <Badge variant="outline" className="text-xs">Phone ✓</Badge>
                        )}
                        {selectedMeetup.creator.isProfilePictureVerified && (
                          <Badge variant="outline" className="text-xs">Photo ✓</Badge>
                        )}
                      </div>
                      {selectedMeetup.creator.bio && (
                        <p className="text-sm text-gray-600">{selectedMeetup.creator.bio}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Current Participants */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    Participants ({selectedMeetup.currentParticipants}/{selectedMeetup.maxParticipants})
                  </h4>
                  <div className="space-y-3">
                    {selectedMeetup.participants.map((participant) => (
                      <div key={participant.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant.profileImageUrl} />
                          <AvatarFallback>
                            {participant.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{participant.username}</span>
                            <div className={`px-2 py-1 rounded-full text-xs text-white ${getTrustLevel(participant.trustScore).color}`}>
                              {participant.trustScore}
                            </div>
                          </div>
                          {participant.surveyData && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {participant.surveyData.favoriteConversationTopic && (
                                <div>💬 Loves talking about: {participant.surveyData.favoriteConversationTopic}</div>
                              )}
                              {participant.surveyData.favoriteMusic && (
                                <div>🎵 Music taste: {participant.surveyData.favoriteMusic}</div>
                              )}
                              {participant.surveyData.personalityType && (
                                <div>✨ Vibe: {participant.surveyData.personalityType}</div>
                              )}
                            </div>
                          )}
                          {participant.bio && (
                            <p className="text-sm text-gray-600 mt-1">{participant.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => joinMeetup.mutate(selectedMeetup.id)}
                  disabled={joinMeetup.isPending || selectedMeetup.currentParticipants >= selectedMeetup.maxParticipants}
                  className="w-full"
                >
                  {joinMeetup.isPending ? 'Joining...' : 'Join This Meetup'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}