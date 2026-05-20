import { api } from './api';
import type { DashboardData } from '../types/dashboard';

export const getDashboard = () =>
  api.get<DashboardData>('/users/dashboard');
