import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
}

export default function LocationModal({ isOpen, onClose, currentLocation }: LocationModalProps) {
  const [address, setAddress] = useState(currentLocation || "");
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLocationMutation = useMutation({
    mutationFn: async (location: string) => {
      const response = await fetch('/api/user/location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update location');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Location Updated",
        description: "Your location has been saved successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get address from coordinates
          const { latitude, longitude } = position.coords;
          
          // For now, we'll use a simple format. In production, you'd use a geocoding service
          const detectedLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setAddress(detectedLocation);
          toast({
            title: "Location Detected",
            description: "Your current location has been detected. You can edit it if needed.",
          });
        } catch (error) {
          toast({
            title: "Detection Failed",
            description: "Could not determine your address. Please enter it manually.",
            variant: "destructive",
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        toast({
          title: "Location Access Denied",
          description: "Please allow location access or enter your address manually.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your address.",
        variant: "destructive",
      });
      return;
    }
    updateLocationMutation.mutate(address.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Set Your Location</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your location helps us match you with people in your area for convenient meetups.
            </p>

            <div className="space-y-2">
              <Label htmlFor="address">Address or Area</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Downtown San Francisco, Brooklyn NY, or specific address"
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Use Current Location
                </>
              )}
            </Button>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLocationMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {updateLocationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Location"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}