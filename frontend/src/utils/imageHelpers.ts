// Image fallback component utilities
export const getImageUrl = (path: string | undefined, baseUrl: string = ''): string => {
  if (!path) return '/placeholder-vehicle.png';
  if (path.startsWith('http')) return path;
  return `${baseUrl}${path}`;
};

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.src = '/placeholder-vehicle.png';
  event.currentTarget.onerror = null;
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};
