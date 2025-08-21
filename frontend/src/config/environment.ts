export const config = {
  apiVersion: 'v1',
  environment: import.meta.env.MODE || 'development',
  apiUrl: import.meta.env.VITE_API_URL || '/api',
};