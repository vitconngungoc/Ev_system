import { User } from '../types/auth.types';
import { USER_ROLES, ROLE_IDS } from '../constants/app.constants';

export const getUserRole = (user: User): string => {
  return user.role?.roleName || USER_ROLES.CUSTOMER;
};

export const getUserRoleId = (user: User): number | undefined => {
  return user.role?.roleId;
};

export const isAdmin = (user: User): boolean => {
  const roleId = getUserRoleId(user);
  const roleName = getUserRole(user);
  return roleId === ROLE_IDS.ADMIN || 
         roleName === USER_ROLES.ADMIN || 
         roleName === USER_ROLES.EV_ADMIN;
};

export const isStaff = (user: User): boolean => {
  const roleId = getUserRoleId(user);
  const roleName = getUserRole(user);
  return roleId === ROLE_IDS.STATION_STAFF || roleName === USER_ROLES.STATION_STAFF;
};

export const isCustomer = (user: User): boolean => {
  const roleId = getUserRoleId(user);
  const roleName = getUserRole(user);
  return roleId === ROLE_IDS.CUSTOMER || roleName === USER_ROLES.CUSTOMER;
};

export const isVerified = (user: User): boolean => {
  return user.verificationStatus === 'APPROVED';
};

export const isPending = (user: User): boolean => {
  return user.verificationStatus === 'PENDING';
};

export const isRejected = (user: User): boolean => {
  return user.verificationStatus === 'REJECTED';
};

export const isActive = (user: User): boolean => {
  return user.status === 'ACTIVE';
};

export const hasStation = (user: User): boolean => {
  return !!user.station;
};

export const getUserDisplayName = (user: User): string => {
  return user.fullName || user.email || 'User';
};
