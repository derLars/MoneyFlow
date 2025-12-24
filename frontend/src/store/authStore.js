import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (username, password) => {
    console.log('Login function called');
    set({ loading: true, error: null });
    try {
      console.log('Attempting login with:', username);
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await api.post('/auth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log('Login response:', response.data);
      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      
      // Fetch user info after login
      console.log('Fetching user info...');
      const userResponse = await api.get('/auth/me');
      console.log('User info response:', userResponse.data);

      set({
        token: access_token,
        isAuthenticated: true,
        user: userResponse.data,
        loading: false,
      });
      return true;
    } catch (err) {
      console.error('Login error:', err);
      set({
        error: err.response?.data?.detail || 'Login failed',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await api.get('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
      });
    } catch (err) {
      localStorage.removeItem('token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  }
}));

export default useAuthStore;
