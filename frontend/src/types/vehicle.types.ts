// Vehicle type utilities
export interface Vehicle {
  vehicleId: number;
  vehicleCode: string;
  status: string;
  currentKilometer: number;
  batteryLevel?: number;
  model: {
    modelId: number;
    modelName: string;
    brand: string;
    year: number;
    batteryCapacity: number;
    maxSpeed: number;
    range: number;
    seats: number;
    pricePerHour: number;
    pricePerDay: number;
    vehicleType: string;
    imagePath?: string;
  };
  station: {
    stationId: number;
    name: string;
    address: string;
  };
}

export const getVehicleStatusColor = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800';
    case 'RENTED':
      return 'bg-blue-100 text-blue-800';
    case 'MAINTENANCE':
      return 'bg-yellow-100 text-yellow-800';
    case 'OUT_OF_SERVICE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getVehicleStatusLabel = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
      return 'Sẵn sàng';
    case 'RENTED':
      return 'Đang cho thuê';
    case 'MAINTENANCE':
      return 'Bảo trì';
    case 'OUT_OF_SERVICE':
      return 'Ngừng hoạt động';
    default:
      return status;
  }
};

export const isVehicleAvailable = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'AVAILABLE';
};

export const calculateRentalPrice = (
  pricePerHour: number,
  pricePerDay: number,
  hours: number
): number => {
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return days * pricePerDay + remainingHours * pricePerHour;
  }
  return hours * pricePerHour;
};
