import { User } from '../types/auth.types';
import { ROUTES } from '../constants/app.constants';
import { isAdmin, isStaff } from './userHelpers';

export const getDefaultRoute = (user: User | null): string => {
  if (!user) return ROUTES.HOME;
  
  if (isAdmin(user)) return ROUTES.ADMIN_DASHBOARD;
  if (isStaff(user)) return ROUTES.STAFF_DASHBOARD;
  
  return ROUTES.HOME;
};

export const canAccessRoute = (user: User | null, route: string): boolean => {
  if (!user) {
    // Public routes
    return [
      ROUTES.HOME,
      ROUTES.LOGIN,
      ROUTES.REGISTER,
      ROUTES.FORGOT_PASSWORD,
      ROUTES.STATIONS,
      ROUTES.VEHICLES,
      ROUTES.VEHICLE_DETAIL,
      ROUTES.TERMS_OF_SERVICE,
      ROUTES.PRIVACY_POLICY,
    ].includes(route as any);
  }
  
  // Admin routes
  if (route === ROUTES.ADMIN_DASHBOARD) {
    return isAdmin(user);
  }
  
  // Staff routes
  if (route === ROUTES.STAFF_DASHBOARD) {
    return isStaff(user);
  }
  
  // Authenticated user routes
  return true;
};

export const requiresAuth = (route: string): boolean => {
  const publicRoutes = [
    ROUTES.HOME,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.STATIONS,
    ROUTES.VEHICLES,
    ROUTES.VEHICLE_DETAIL,
    ROUTES.TERMS_OF_SERVICE,
    ROUTES.PRIVACY_POLICY,
  ];
  
  return !publicRoutes.includes(route as any);
};
