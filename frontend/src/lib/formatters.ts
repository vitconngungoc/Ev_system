// String formatting utilities

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

export const truncate = (str: string, maxLength: number, suffix: string = "..."): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const parseQueryString = (queryString: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const pairs = queryString.replace("?", "").split("&");

  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  });

  return params;
};

export const buildQueryString = (params: Record<string, any>): string => {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

  return pairs.length > 0 ? `?${pairs.join("&")}` : "";
};

export const extractInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split("@");
  if (!domain) return email;
  const masked = username.slice(0, 2) + "*".repeat(Math.max(0, username.length - 2));
  return `${masked}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  return "*".repeat(cleaned.length - 4) + cleaned.slice(-4);
};
