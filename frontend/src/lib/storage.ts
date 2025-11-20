// Local storage utility functions

const STORAGE_PREFIX = "ev_rental_";

export const storage = {
  set: (key: string, value: any): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(STORAGE_PREFIX + key, serializedValue);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  },

  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue || null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  },

  clear: (): void => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },

  has: (key: string): boolean => {
    return localStorage.getItem(STORAGE_PREFIX + key) !== null;
  },
};

// Commonly used storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "theme",
  LANGUAGE: "language",
  RECENT_SEARCHES: "recent_searches",
  FAVORITES: "favorites",
  CART: "cart",
};
