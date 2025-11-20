// Enhanced vehicle utility functions

export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  batteryCapacity: number;
  range: number;
  imageUrl: string;
  available: boolean;
  rating: number;
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

export const calculateTotalPrice = (
  pricePerDay: number,
  days: number,
  discount: number = 0
): number => {
  const total = pricePerDay * days;
  return total - (total * discount) / 100;
};

export const getBatteryStatus = (level: number): {
  status: string;
  color: string;
} => {
  if (level >= 80) return { status: "Excellent", color: "green" };
  if (level >= 50) return { status: "Good", color: "blue" };
  if (level >= 20) return { status: "Low", color: "yellow" };
  return { status: "Critical", color: "red" };
};

export const estimateChargingTime = (
  currentLevel: number,
  targetLevel: number,
  chargingSpeed: number = 50
): number => {
  const difference = targetLevel - currentLevel;
  return Math.ceil(difference / chargingSpeed);
};

export const filterVehicles = (
  vehicles: Vehicle[],
  filters: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    minRange?: number;
    availableOnly?: boolean;
  }
): Vehicle[] => {
  return vehicles.filter((vehicle) => {
    if (filters.minPrice && vehicle.pricePerDay < filters.minPrice)
      return false;
    if (filters.maxPrice && vehicle.pricePerDay > filters.maxPrice)
      return false;
    if (filters.brand && vehicle.brand !== filters.brand) return false;
    if (filters.minRange && vehicle.range < filters.minRange) return false;
    if (filters.availableOnly && !vehicle.available) return false;
    return true;
  });
};

export const sortVehicles = (
  vehicles: Vehicle[],
  sortBy: "price" | "rating" | "range"
): Vehicle[] => {
  return [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.pricePerDay - b.pricePerDay;
      case "rating":
        return b.rating - a.rating;
      case "range":
        return b.range - a.range;
      default:
        return 0;
    }
  });
};
