// Geographic filtering utility for SP notifications

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SPProfile {
  driverId: number;
  spCode: string;
  name: string;
  surname: string;
  email: string;
  serviceTypes: string[];
  city: string;
  location?: Location;
  deviceId: string;
}

// Calculate distance between two points using Haversine formula
export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLng = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Check if SP should receive notification based on service type and location
export const shouldNotifySP = (
  spProfile: SPProfile,
  requestServiceType: string,
  requestLocation: Location,
  radiusKm: number = 10
): boolean => {
  // Check if SP provides this service type
  const hasService = spProfile.serviceTypes.includes(requestServiceType);
  if (!hasService) {
    console.log('SP Filter: Service type mismatch', { 
      spServices: spProfile.serviceTypes, 
      requestService: requestServiceType 
    });
    return false;
  }

  // Check if SP has location set
  if (!spProfile.location) {
    console.log('SP Filter: No SP location available');
    return false;
  }

  // Check if SP is within radius
  const distance = calculateDistance(spProfile.location, requestLocation);
  const withinRadius = distance <= radiusKm;
  
  console.log('SP Filter: Distance check', {
    spLocation: spProfile.location,
    requestLocation,
    distance: Math.round(distance * 10) / 10,
    radiusKm,
    withinRadius
  });
  
  return withinRadius;
};

// Get SP profile from localStorage
export const getSPProfile = (): SPProfile | null => {
  const profileData = localStorage.getItem('rides911-sp-profile');
  return profileData ? JSON.parse(profileData) : null;
};