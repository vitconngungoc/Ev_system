// Vehicle types and interfaces
export interface Vehicle {
  id: number;
  name: string;
  model: string;
  brand: string;
  type: string;
  price: number;
  seatingCapacity: number;
  fuelType: string;
  available: boolean;
  rating?: number;
  imageUrl?: string;
  description?: string;
  location?: string;
}

export const VEHICLE_TYPES = {
  SEDAN: 'SEDAN',
  SUV: 'SUV',
  HATCHBACK: 'HATCHBACK',
  ELECTRIC: 'ELECTRIC',
} as const;

export const getVehicleTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SEDAN: 'Sedan',
    SUV: 'SUV',
    HATCHBACK: 'Hatchback',
    ELECTRIC: 'Xe điện',
  };
  return labels[type] || type;
};

export const formatVehiclePrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(price);
};
