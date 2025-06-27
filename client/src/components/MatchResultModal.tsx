import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, MessageCircle, Calendar, Coffee, Utensils } from "lucide-react";
import type { MatchWithUsers } from "@shared/schema";

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchWithUsers | null;
}

export default function MatchResultModal({ isOpen, onClose, match }: MatchResultModalProps) {
  if (!match) return null;

  const handleStartChat = () => {
    onClose();
    // Navigate to chat page with the match ID
    window.location.href = `/chat/${match.id}`;
  };

  const getVenueIcon = () => {
    return match.venueType === 'restaurant' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />;
  };

  const getVenueLabel = () => {
    return match.venueType === 'restaurant' ? 'Restaurant' : 'Cafe';
  };

  const getMeetupTypeLabel = () => {
    return match.meetupType === '1v1' ? '1-on-1 Meetup' : 'Group Meetup';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl text-blue-600">
            🎉 You've Been Matched!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Details */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <h3 className="font-semibold text-gray-900">{getMeetupTypeLabel()}</h3>
                <div className="flex items-center justify-center space-x-4">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    {getVenueIcon()}
                    <span>{getVenueLabel()}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{match.participants.length} people</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matched Users */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Your Match{match.participants.length > 2 ? 'es' : ''}:</h4>
            <div className="space-y-2">
              {match.users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.firstName?.[0] || user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {user.firstName || user.username}
                    </p>
                    {user.location && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {user.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Details */}
          {(match.suggestedDate || match.suggestedTime) && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Suggested Details:</h4>
                <div className="space-y-2">
                  {match.suggestedDate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{match.suggestedDate}</span>
                    </div>
                  )}
                  {match.suggestedTime && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{match.suggestedTime}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compatibility Score */}
          {match.matchScore && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Compatibility Score: <span className="font-semibold text-blue-600">{match.matchScore}%</span>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleStartChat}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Start Group Chat
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}