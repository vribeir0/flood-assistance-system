import { Platform } from "react-native";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationCoords> => {
  if (Platform.OS === "web") {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: LocationCoords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            resolve(coords);
          },
          (error) => reject(error)
        );
      } else {
        reject(new Error("Geolocalização não suportada"));
      }
    });
  }
};
