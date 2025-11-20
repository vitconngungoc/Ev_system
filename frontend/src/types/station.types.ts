// Station type definitions
export interface Station {
  stationId: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  availableVehicles?: number;
  operatingHours?: string;
  phoneNumber?: string;
  rating?: number;
  totalRatings?: number;
}

export const getDistanceFromCoords = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const sortStationsByDistance = (
  stations: Station[],
  userLat: number,
  userLon: number
): Station[] => {
  return stations
    .map((station) => ({
      ...station,
      distance:
        station.latitude && station.longitude
          ? getDistanceFromCoords(userLat, userLon, station.latitude, station.longitude)
          : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance);
};
