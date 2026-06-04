import { useState } from "react";
import { LocationCoords, LocationStatus } from "@/types/location";

export function useLocation(
  onResolved?: (coords: LocationCoords | null) => void
) {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const fetchLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationStatus("skipped");
      onResolved?.(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(coords);
        setLocationStatus("granted");
        onResolved?.(coords);
      },
      () => {
        setLocationStatus("skipped");
        onResolved?.(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setLocationStatus("loading");
  };

  return { location, locationStatus, setLocationStatus, fetchLocation };
}
