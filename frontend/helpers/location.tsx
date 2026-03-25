export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationCoords> => {
  // Expo exportado como Web estático — Platform.OS é sempre "web".
  // Navegadores mobile bloqueiam geolocalização em HTTP (contexto não seguro).
  // Certifique-se de que o site está sendo acessado via HTTPS.
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocalização não suportada neste navegador"));
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      reject(
        new Error(
          "Geolocalização requer HTTPS. Acesse o site pelo domínio seguro."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permissão de localização negada pelo usuário"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Localização indisponível no momento"));
            break;
          case error.TIMEOUT:
            reject(new Error("Tempo esgotado ao obter localização"));
            break;
          default:
            reject(new Error("Erro ao obter localização"));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 60000, // aceita cache de até 1 minuto
      }
    );
  });
};
