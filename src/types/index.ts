export interface SystemStatus {
  cpu: {
    percent: number;
    per_core: number[];
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
    swap_total: number;
    swap_used: number;
  };
  disk: DiskPartition[];
  network: {
    rx_bytes: number;
    tx_bytes: number;
    rx_speed: number;
    tx_speed: number;
  };
  uptime: number;
  process_count: number;
}

export interface DiskPartition {
  mountpoint: string;
  device: string;
  fstype: string;
  total: number;
  used: number;
  free: number;
  percent: number;
  disk_type: 'ssd' | 'hdd' | 'unknown';
  label: string;
}

export interface ServiceInfo {
  name: string;
  type: 'systemd' | 'docker' | 'nohup';
  description: string;
  status: 'active' | 'inactive' | 'failed' | 'unknown';
  uptime: string;
  memory: number;
  memory_percent: number;
  pid?: number | null;
  container_id?: string | null;
}

export interface ServiceSummary {
  total: number;
  active: number;
  failed: number;
  inactive: number;
}

export interface ServiceListResponse {
  services: ServiceInfo[];
  summary: ServiceSummary;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  log_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  ip_address?: string;
  count?: number;
}

export interface AlertSetting {
  id: number;
  metric_type: string;
  threshold: number;
  enabled: boolean;
  email_recipients: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AlertHistory {
  id: number;
  timestamp: string;
  alert_type: string;
  message: string;
  metric_value: number;
  sent_email: boolean;
  resolved_at?: string | null;
}

export interface MonitoringHistory {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network_rx: number;
  network_tx: number;
}

export interface LogStatistics {
  total: number;
  bruteforce_attempts: number;
  errors: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

export interface TimelineBucket {
  timestamp: string;
  total: number;
  errors: number;
  bruteforce: number;
}

export interface AppSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string;
  smtp_tls: boolean;
  email_recipient: string;
  monitor_interval: number;
  data_retention_days: number;
  systemd_services: string[];
  docker_containers: string[];
}

export interface DashboardData {
  system: SystemStatus;
  services: ServiceSummary;
  recent_alerts: AlertHistory[];
  recent_logs: LogEntry[];
}

export interface AccessIpEntry {
  ip: string;
  count: number;
  last_seen: string;
  paths: string[];
  status_codes: number[];
  suspicious: boolean;
}

export interface AccessIpsResponse {
  recent: AccessIpEntry[];
  total_unique: number;
}
