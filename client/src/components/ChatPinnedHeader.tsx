import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MapPin, Calendar, Clock, Edit, Check, X, Coffee, Utensils, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatPinnedHeaderProps {
  matchId?: number;
  venueType?: string;
  meetupType?: string;
  participantCount?: number;
  canEdit?: boolean;
  suggestedDate?: string;
  suggestedTime?: string;
}

export default function ChatPinnedHeader({ 
  matchId,
  venueType = 'restaurant',
  meetupType = 'group',
  participantCount = 3,
  canEdit = true,
  suggestedDate,
  suggestedTime
}: ChatPinnedHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location for your meetup.",
        variant: "destructive",
      });
      return;
    }
    
    setIsEditing(false);
    toast({
      title: "Details Saved",
      description: "Your meetup details have been updated.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleCancelMeeting = () => {
    toast({
      title: "Meeting Cancelled",
      description: "The meetup has been cancelled for all participants.",
      variant: "destructive",
    });
    // In a real implementation, this would make an API call to cancel the meeting
    // and potentially redirect users back to the matches page
  };

  const getVenueIcon = () => {
    return venueType === 'restaurant' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />;
  };

  const getVenueLabel = () => {
    return venueType === 'restaurant' ? 'Restaurant' : 'Cafe';
  };

  const getMeetupTypeLabel = () => {
    return meetupType === '1v1' ? '1-on-1' : 'Group';
  };

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 sticky top-0 z-10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with venue type and buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                {getVenueIcon()}
                <span>{getVenueLabel()} {getMeetupTypeLabel()}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {participantCount} people
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this meetup? This will cancel the meeting for all participants and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleCancelMeeting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Cancel Meeting
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Set Details
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCancel}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Meetup details grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Location */}
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-700 mb-1">Location</div>
                {isEditing ? (
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={`Enter ${getVenueLabel().toLowerCase()} name or address`}
                    className="h-8 text-sm"
                  />
                ) : (
                  <div className="text-sm text-gray-900">
                    {location || `${getVenueLabel()} to be decided`}
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time in same row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 mb-1">Date</div>
                  <div className="text-sm text-gray-900">
                    {suggestedDate || 'Date TBD'}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 mb-1">Time</div>
                  <div className="text-sm text-gray-900">
                    {suggestedTime === 'lunch' ? '1:00 PM' : 
                     suggestedTime === 'dinner' ? '5:30 PM' : 
                     suggestedTime || 'Time TBD'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helper text */}
          {!location && !suggestedDate && !suggestedTime && !isEditing && (
            <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 text-center">
              Coordinate your meetup details with the group
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}