import { create } from 'zustand';
import api from '../api/axios';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/projects');
      set({ projects: response.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProjectDetails: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}`);
      set({ currentProject: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      // projectData is FormData
      const response = await api.post('/projects', projectData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh list
      await get().fetchProjects();
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.detail || err.message, loading: false });
      throw err;
    }
  },

  deleteProject: async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      await get().fetchProjects();
      if (get().currentProject?.project_id === projectId) {
        set({ currentProject: null });
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  addParticipant: async (projectId, userId) => {
    try {
      await api.post(`/projects/${projectId}/participants`, { user_id: userId });
      // Refresh current project to update participants list
      if (get().currentProject?.project_id === projectId) {
        await get().fetchProjectDetails(projectId);
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  removeParticipant: async (projectId, userId) => {
    try {
      await api.delete(`/projects/${projectId}/participants/${userId}`);
      // Refresh current project
      if (get().currentProject?.project_id === projectId) {
        await get().fetchProjectDetails(projectId);
      }
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  }
}));

export default useProjectStore;
