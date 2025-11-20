// Search and filter utilities
export interface FilterOptions {
  priceMin?: number;
  priceMax?: number;
  vehicleType?: string;
  fuelType?: string;
  seatingCapacity?: number;
  location?: string;
  availability?: boolean;
}

export const filterVehicles = <T extends Record<string, any>>(
  vehicles: T[],
  filters: FilterOptions
): T[] => {
  return vehicles.filter((vehicle) => {
    if (filters.priceMin !== undefined && vehicle.price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== undefined && vehicle.price > filters.priceMax) {
      return false;
    }
    if (filters.vehicleType && vehicle.type !== filters.vehicleType) {
      return false;
    }
    if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
      return false;
    }
    if (filters.seatingCapacity && vehicle.seatingCapacity < filters.seatingCapacity) {
      return false;
    }
    if (filters.location && vehicle.location !== filters.location) {
      return false;
    }
    if (filters.availability !== undefined && vehicle.available !== filters.availability) {
      return false;
    }
    return true;
  });
};

export const searchVehicles = <T extends Record<string, any>>(
  vehicles: T[],
  searchTerm: string
): T[] => {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return vehicles;

  return vehicles.filter((vehicle) => {
    return (
      vehicle.name?.toLowerCase().includes(term) ||
      vehicle.model?.toLowerCase().includes(term) ||
      vehicle.brand?.toLowerCase().includes(term) ||
      vehicle.description?.toLowerCase().includes(term)
    );
  });
};

export const SORT_OPTIONS = {
  PRICE_LOW_HIGH: 'PRICE_LOW_HIGH',
  PRICE_HIGH_LOW: 'PRICE_HIGH_LOW',
  RATING_HIGH_LOW: 'RATING_HIGH_LOW',
  NAME_A_Z: 'NAME_A_Z',
  NAME_Z_A: 'NAME_Z_A',
  NEWEST: 'NEWEST',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

export const sortVehicles = <T extends Record<string, any>>(
  vehicles: T[],
  sortBy: SortOption
): T[] => {
  const sorted = [...vehicles];

  switch (sortBy) {
    case SORT_OPTIONS.PRICE_LOW_HIGH:
      return sorted.sort((a, b) => a.price - b.price);
    case SORT_OPTIONS.PRICE_HIGH_LOW:
      return sorted.sort((a, b) => b.price - a.price);
    case SORT_OPTIONS.RATING_HIGH_LOW:
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case SORT_OPTIONS.NAME_A_Z:
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case SORT_OPTIONS.NAME_Z_A:
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case SORT_OPTIONS.NEWEST:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return sorted;
  }
};
