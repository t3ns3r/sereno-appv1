import { useState, useCallback, useEffect } from 'react';

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: number;
}

interface UseGeolocationReturn {
  location: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<GeolocationPosition | null>;
  clearLocation: () => void;
  isSupported: boolean;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = 'geolocation' in navigator;

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string | undefined> => {
    try {
      // In a real implementation, you would use a geocoding service like Google Maps API
      // For now, we'll return a formatted coordinate string
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return undefined;
    }
  };

  const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!isSupported) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000, // 5 minutes
      };

      const onSuccess = async (position: GeolocationPosition) => {
        try {
          const coords = position.coords;
          
          // Get address from coordinates
          const address = await reverseGeocode(coords.latitude, coords.longitude);
          
          const locationData: GeolocationPosition = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            address,
            timestamp: position.timestamp,
          };

          setLocation(locationData);
          setIsLoading(false);
          resolve(locationData);
        } catch (err) {
          console.error('Error processing location:', err);
          const locationData: GeolocationPosition = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: position.timestamp,
          };
          
          setLocation(locationData);
          setIsLoading(false);
          resolve(locationData);
        }
      };

      const onError = (error: GeolocationPositionError) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location';
            break;
        }

        setError(errorMessage);
        setIsLoading(false);
        resolve(null);
      };

      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    });
  }, [isSupported]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  // Auto-request location permission on mount (but don't get location yet)
  useEffect(() => {
    if (isSupported && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          // Permission already granted, but don't auto-request location
          // User should explicitly request it when needed
        }
      }).catch((error) => {
        console.error('Error checking geolocation permission:', error);
      });
    }
  }, [isSupported]);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    clearLocation,
    isSupported,
  };
};