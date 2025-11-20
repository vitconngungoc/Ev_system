export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

export const getEnv = (key: string, defaultValue: string = ''): string => {
  return import.meta.env[key] || defaultValue;
};

export const getBrowserInfo = () => {
  if (!isBrowser()) return null;
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
  };
};

export const getScreenSize = () => {
  if (!isBrowser()) return null;
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isMobile = (): boolean => {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = (): boolean => {
  if (!isBrowser()) return false;
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
};

export const isDesktop = (): boolean => {
  return !isMobile() && !isTablet();
};
