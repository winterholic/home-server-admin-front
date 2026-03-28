import axios, { type AxiosRequestConfig } from 'axios';
import { getToken, setToken } from './tokenStore';
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
  AccessIpsResponse,
} from '../types';

declare const __API_BASE_URL__: string;

export const api = axios.create({
  baseURL: __API_BASE_URL__,
  timeout: 15000,
  withCredentials: true, // Always include cookies (refresh token)
});

// ── Refresh token de-duplication ──────────────────────────────────────────────
// Multiple simultaneous 401s share one refresh request instead of racing.
let _refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const res = await api.post<{ access_token: string; username: string }>('/auth/refresh');
  setToken(res.data.access_token);
  return res.data.access_token;
}

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthEndpoint = (original.url ?? '').includes('/auth/');

    // Retry once on 401, but not for auth endpoints (avoids infinite loops)
    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        if (!_refreshPromise) {
          _refreshPromise = doRefresh().finally(() => {
            _refreshPromise = null;
          });
        }
        const newToken = await _refreshPromise;
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Refresh failed — clear token and send to login
        setToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard = () =>
  api.get<DashboardData>('/dashboard').then((r) => r.data);

// ── System ────────────────────────────────────────────────────────────────────
export const fetchSystemStatus = () =>
  api.get<SystemStatus>('/system/status').then((r) => r.data);

export const fetchSystemHistory = (period: '1h' | '24h' | '7d' | '30d') =>
  api
    .get<{ period: string; data: MonitoringHistory[] }>('/system/history', { params: { period } })
    .then((r) => r.data);

export const fetchSystemInfo = () =>
  api
    .get<{
      hostname: string;
      os: string;
      architecture: string;
      processor: string;
      cpu_count_logical: number;
      total_memory: number;
      boot_time: number;
    }>('/system/info')
    .then((r) => r.data);

// ── Services ──────────────────────────────────────────────────────────────────
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

export const fetchServiceLogs = (name: string, lines = 50, service_type?: string) =>
  api
    .get<{ service_name: string; lines: string[] }>(`/services/${name}/logs`, {
      params: { lines, ...(service_type ? { service_type } : {}) },
    })
    .then((r) => r.data);

// ── Logs ──────────────────────────────────────────────────────────────────────
export const fetchLogs = (params: {
  source?: string;
  severity?: string;
  log_type?: string;
  limit?: number;
  offset?: number;
}) =>
  api
    .get<{ logs: LogEntry[]; total: number; limit: number; offset: number }>('/logs/recent', {
      params,
    })
    .then((r) => r.data);

export const fetchLogStatistics = (period: string = '24h') =>
  api
    .get<LogStatistics>('/logs/statistics', { params: { period } })
    .then((r) => r.data);

export const fetchLogTimeline = (period: string = '24h') =>
  api
    .get<{ timeline: TimelineBucket[] }>('/logs/timeline', { params: { period } })
    .then((r) => r.data);

// ── Alerts ────────────────────────────────────────────────────────────────────
export const fetchAlertSettings = () =>
  api.get<{ settings: AlertSetting[] }>('/alerts/settings').then((r) => r.data);

export const updateAlertSetting = (
  id: number,
  data: { threshold?: number; enabled?: boolean; email_recipients?: string[] },
) => api.put<AlertSetting>(`/alerts/settings/${id}`, data).then((r) => r.data);

export const fetchAlertHistory = (limit = 50, offset = 0) =>
  api
    .get<{ alerts: AlertHistory[]; total: number }>('/alerts/history', {
      params: { limit, offset },
    })
    .then((r) => r.data);

// ── App Settings ──────────────────────────────────────────────────────────────
export const fetchAppSettings = () =>
  api.get<AppSettings>('/settings').then((r) => r.data);

export const updateEmailRecipient = (email_recipient: string) =>
  api.put<AppSettings>('/settings/email-recipient', { email_recipient }).then((r) => r.data);

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

export const fetchAccessIps = (hours = 24, limit = 100) =>
  api
    .get<AccessIpsResponse>('/logs/access-ips', { params: { hours, limit } })
    .then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginApi = (username: string, password: string) => {
  const body = new URLSearchParams({ username, password });
  return api
    .post<{ access_token: string; token_type: string; username: string }>(
      '/auth/login',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    .then((r) => r.data);
};
