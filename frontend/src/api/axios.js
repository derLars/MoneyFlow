import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8002/api`,
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getCategoriesByLevel = async (level) => {
  try {
    const response = await api.get(`/categories/${level}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching categories for level ${level}:`, error);
    throw error;
  }
};

export const createCategory = async (categoryName, level) => {
  try {
    const response = await api.post(
      `/categories`,
      { category_name: categoryName, level }
    );
    return response.data;
  } catch (error) {
    console.error(`Error creating category ${categoryName} (level ${level}):`, error);
    throw error;
  }
};

export default api;
