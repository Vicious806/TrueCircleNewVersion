import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Edit, Check, X, Coffee, Utensils, Loader2 } from "lucide-react";
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

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
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
  const [locationSuggestions, setLocationSuggestions] = useState<AddressSuggestion[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingLocationSuggestions, setIsLoadingLocationSuggestions] = useState(false);
  const locationDebounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch restaurant/cafe suggestions
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsLoadingLocationSuggestions(true);
    try {
      // Get user's approximate location to prioritize nearby venues
      let userLat: number | null = null;
      let userLon: number | null = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
          });
          userLat = position.coords.latitude;
          userLon = position.coords.longitude;
        } catch {
          // Continue without user location if detection fails
        }
      }

      const venueQuery = venueType === 'restaurant' ? 'restaurant' : 'cafe coffee';
      
      // Build search URL with optional user location for better results
      let searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' ' + venueQuery)}&format=json&addressdetails=1&limit=8`;
      if (userLat !== null && userLon !== null) {
        searchUrl += `&viewbox=${userLon-0.2},${userLat+0.2},${userLon+0.2},${userLat-0.2}&bounded=0`;
      }

      const response = await fetch(searchUrl);
      const data = await response.json();
      
      // Filter results to show actual venues
      const filteredResults = (data || [])
        .filter((item: any) => {
          const displayName = item.display_name?.toLowerCase() || '';
          const itemType = item.type?.toLowerCase() || '';
          const itemClass = item.class?.toLowerCase() || '';
          
          // Only show actual restaurants/cafes or relevant venues
          return itemClass === 'amenity' || 
                 itemType === 'restaurant' || 
                 itemType === 'cafe' || 
                 itemType === 'fast_food' ||
                 itemType === 'bar' ||
                 itemType === 'pub' ||
                 displayName.includes('restaurant') ||
                 displayName.includes('cafe') ||
                 displayName.includes('coffee') ||
                 displayName.includes('dining');
        })
        .slice(0, 5); // Limit to 5 most relevant results
      
      setLocationSuggestions(filteredResults);
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setIsLoadingLocationSuggestions(false);
    }
  };

  // Debounced location search
  useEffect(() => {
    if (locationDebounceRef.current) {
      clearTimeout(locationDebounceRef.current);
    }

    locationDebounceRef.current = setTimeout(() => {
      if (editLocation.trim() && showLocationSuggestions && isEditing) {
        fetchLocationSuggestions(editLocation.trim());
      }
    }, 300);

    return () => {
      if (locationDebounceRef.current) {
        clearTimeout(locationDebounceRef.current);
      }
    };
  }, [editLocation, showLocationSuggestions, isEditing, venueType]);

  const handleLocationChange = (value: string) => {
    setEditLocation(value);
    setShowLocationSuggestions(true);
  };

  const selectLocationSuggestion = (suggestion: AddressSuggestion) => {
    setEditLocation(suggestion.display_name);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

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
                  <div className="relative">
                    <Input
                      value={editLocation}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowLocationSuggestions(false), 200);
                      }}
                      placeholder={`Enter ${getVenueLabel().toLowerCase()} name or address`}
                      className="h-8 text-sm"
                    />
                    
                    {/* Location Suggestions Dropdown */}
                    {showLocationSuggestions && (locationSuggestions.length > 0 || isLoadingLocationSuggestions) && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {isLoadingLocationSuggestions ? (
                          <div className="p-2 text-xs text-gray-500 flex items-center">
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Loading suggestions...
                          </div>
                        ) : (
                          locationSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
                              onClick={() => selectLocationSuggestion(suggestion)}
                            >
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-gray-900 leading-tight">
                                  {suggestion.display_name}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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