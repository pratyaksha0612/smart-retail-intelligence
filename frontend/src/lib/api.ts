import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const getDashboardOverview = async () => {
  const { data } = await api.get('/dashboard/overview');
  return data;
};

export const getDashboardCharts = async (period: string) => {
  const { data } = await api.get(`/dashboard/charts?period=${period}`);
  return data;
};

export const getDashboardActivity = async () => {
  const { data } = await api.get('/dashboard/activity');
  return data;
};

export const getSystemStatus = async () => {
  const { data } = await api.get('/dashboard/system-status');
  return data;
};

export const getModelStatus = async () => {
  const { data } = await api.get('/dashboard/model-status');
  return data;
};

export const getDatabaseHealth = async () => {
  const { data } = await api.get('/dashboard/health');
  return data;
};

export const searchEntities = async (q: string) => {
  const { data } = await api.get(`/dashboard/search?q=${q}`);
  return data;
};

export const getDashboardRecent = async () => {
  const { data } = await api.get('/dashboard/recent');
  return data;
};
