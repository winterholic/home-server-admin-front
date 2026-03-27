import axios from 'axios';
import type {
  SystemStatus,
  ServiceListResponse,
  LogEntry,
  LogStatistics,
  TimelineBucket,
  AlertSetting,
  AlertHistory,
  MonitoringHistory,
  AppSettings,
  DashboardData,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// ── Dashboard ─────────────────────────────────────────────
export const fetchDashboard = () =>
  api.get<DashboardData>('/dashboard').then((r) => r.data);

// ── System ────────────────────────────────────────────────
export const fetchSystemStatus = () =>
  api.get<SystemStatus>('/system/status').then((r) => r.data);

export const fetchSystemHistory = (period: '1h' | '24h' | '7d' | '30d') =>
  api
    .get<{ period: string; data: MonitoringHistory[] }>('/system/history', { params: { period } })
    .then((r) => r.data);

export const fetchSystemInfo = () =>
  api.get<{
    hostname: string;
    os: string;
    architecture: string;
    processor: string;
    cpu_count_logical: number;
    total_memory: number;
    boot_time: number;
  }>('/system/info').then((r) => r.data);

// ── Services ──────────────────────────────────────────────
export const fetchServices = () =>
  api.get<ServiceListResponse>('/services').then((r) => r.data);

export const controlService = (
  name: string,
  action: 'start' | 'stop' | 'restart' | 'reload',
  service_type?: string,
) =>
  api
    .post<{ success: boolean; message: string }>(`/services/${name}/control`, {
      action,
      service_type,
    })
    .then((r) => r.data);

export const fetchServiceLogs = (name: string, lines = 50) =>
  api
    .get<{ service_name: string; lines: string[] }>(`/services/${name}/logs`, {
      params: { lines },
    })
    .then((r) => r.data);

// ── Logs ──────────────────────────────────────────────────
export const fetchLogs = (params: {
  source?: string;
  severity?: string;
  log_type?: string;
  limit?: number;
  offset?: number;
}) =>
  api
    .get<{ logs: LogEntry[]; total: number; limit: number; offset: number }>(
      '/logs/recent',
      { params },
    )
    .then((r) => r.data);

export const fetchLogStatistics = (period: string = '24h') =>
  api
    .get<LogStatistics>('/logs/statistics', { params: { period } })
    .then((r) => r.data);

export const fetchLogTimeline = (period: string = '24h') =>
  api
    .get<{ timeline: TimelineBucket[] }>('/logs/timeline', { params: { period } })
    .then((r) => r.data);

// ── Alerts ────────────────────────────────────────────────
export const fetchAlertSettings = () =>
  api.get<{ settings: AlertSetting[] }>('/alerts/settings').then((r) => r.data);

export const updateAlertSetting = (
  id: number,
  data: { threshold?: number; enabled?: boolean; email_recipients?: string[] },
) =>
  api.put<AlertSetting>(`/alerts/settings/${id}`, data).then((r) => r.data);

export const fetchAlertHistory = (limit = 50, offset = 0) =>
  api
    .get<{ alerts: AlertHistory[]; total: number }>('/alerts/history', {
      params: { limit, offset },
    })
    .then((r) => r.data);

// ── App Settings ──────────────────────────────────────────
export const fetchAppSettings = () =>
  api.get<AppSettings>('/settings').then((r) => r.data);

export const updateSmtpSettings = (data: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from?: string;
  smtp_tls?: boolean;
}) => api.put<AppSettings>('/settings/smtp', data).then((r) => r.data);

export const updateMonitoringSettings = (data: {
  monitor_interval?: number;
  data_retention_days?: number;
}) => api.put<AppSettings>('/settings/monitoring', data).then((r) => r.data);

export const testSmtpConnection = (data: {
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from?: string;
  smtp_tls?: boolean;
}) =>
  api
    .post<{ success: boolean; message: string }>('/settings/smtp/test', data)
    .then((r) => r.data);
