import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";
import LocationModal from "./LocationModal";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

interface LocationBannerProps {
  onLocationSet?: () => void;
}

export default function LocationBanner({ onLocationSet }: LocationBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { user } = useAuth();

  // Show banner if user doesn't have location set
  useEffect(() => {
    if (user) {
      const userData = user as User;
      if (!userData.location || userData.location.trim() === "") {
        setShowBanner(true);
      }
    }
  }, [user]);

  const handleLocationSet = () => {
    setShowBanner(false);
    setShowLocationModal(false);
    onLocationSet?.();
    // Force a refresh to update user data
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="bg-primary/5 border border-primary/20 p-4 mb-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-gray-900">Set Your Location</h3>
              <p className="text-sm text-gray-600">
                Add your location to find Saturday meetups near you
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowLocationModal(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2"
            >
              Add Location
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showLocationModal && (
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          currentLocation={(user as User)?.location || ""}
        />
      )}
    </>
  );
}