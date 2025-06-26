import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Edit, Check, X, Coffee, Utensils } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MeetupPinnedHeaderProps {
  matchId: number;
  venueType: string;
  location?: string;
  date?: string;
  time?: string;
  canEdit: boolean;
}

interface MeetupDetailsUpdate {
  location?: string;
  date?: string;
  time?: string;
}

export default function MeetupPinnedHeader({ 
  matchId, 
  venueType, 
  location, 
  date, 
  time, 
  canEdit 
}: MeetupPinnedHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLocation, setEditLocation] = useState(location || '');
  const [editDate, setEditDate] = useState(date || '');
  const [editTime, setEditTime] = useState(time || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMeetupMutation = useMutation({
    mutationFn: async (updates: MeetupDetailsUpdate) => {
      const response = await fetch(`/api/matches/${matchId}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update meetup details');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', matchId] });
      setIsEditing(false);
      toast({
        title: "Details Updated",
        description: "Meetup details have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update meetup details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updates: MeetupDetailsUpdate = {};
    
    if (editLocation !== location) updates.location = editLocation;
    if (editDate !== date) updates.date = editDate;
    if (editTime !== time) updates.time = editTime;
    
    if (Object.keys(updates).length > 0) {
      updateMeetupMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditLocation(location || '');
    setEditDate(date || '');
    setEditTime(time || '');
    setIsEditing(false);
  };

  const getVenueIcon = () => {
    return venueType === 'restaurant' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />;
  };

  const getVenueLabel = () => {
    return venueType === 'restaurant' ? 'Restaurant' : 'Cafe';
  };

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 sticky top-0 z-10">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with venue type and edit button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="flex items-center space-x-1">
                {getVenueIcon()}
                <span>{getVenueLabel()} Meetup</span>
              </Badge>
            </div>
            {canEdit && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit Details
              </Button>
            )}
            {isEditing && (
              <div className="flex items-center space-x-2">
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
                  disabled={updateMeetupMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
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
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
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
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {date ? new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'Date TBD'}
                    </div>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700 mb-1">Time</div>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }) : 'Time TBD'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Helper text */}
          {!location && !date && !time && !isEditing && (
            <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 text-center">
              Coordinate your meetup details with the group
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}