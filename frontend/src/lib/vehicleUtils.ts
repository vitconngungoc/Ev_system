// Utility functions for vehicle-related translations and formatting

export type VehicleCondition = 'EXCELLENT' | 'GOOD' | 'MINOR_DAMAGE' | 'MAINTENANCE_REQUIRED';

interface ConditionConfig {
  label: string;
  color: string;
}

export const VEHICLE_CONDITION_MAP: Record<VehicleCondition, ConditionConfig> = {
  EXCELLENT: { label: 'Xuất sắc', color: 'bg-blue-100 text-blue-800' },
  GOOD: { label: 'Tốt', color: 'bg-green-100 text-green-800' },
  MINOR_DAMAGE: { label: 'Hư hỏng nhỏ', color: 'bg-yellow-100 text-yellow-800' },
  MAINTENANCE_REQUIRED: { label: 'Cần bảo trì', color: 'bg-red-100 text-red-800' },
};

/**
 * Get Vietnamese label for vehicle condition
 */
export const getConditionLabel = (condition: string): string => {
  return VEHICLE_CONDITION_MAP[condition as VehicleCondition]?.label || condition;
};

/**
 * Get color class for vehicle condition badge
 */
export const getConditionColor = (condition: string): string => {
  return VEHICLE_CONDITION_MAP[condition as VehicleCondition]?.color || 'bg-gray-100 text-gray-800';
};

/**
 * Get full condition configuration
 */
export const getConditionConfig = (condition: string): ConditionConfig => {
  return VEHICLE_CONDITION_MAP[condition as VehicleCondition] || { 
    label: condition, 
    color: 'bg-gray-100 text-gray-800' 
  };
};
