import type { SystemStatus, ServiceInfo, LogEntry, AlertSetting, AlertHistory, MonitoringHistory } from '../types';

export const mockSystemStatus: SystemStatus = {
  cpu: {
    percent: 45.2,
    per_core: [40.1, 50.3, 42.8, 48.5, 38.2, 55.1, 44.0, 41.7, 36.9, 52.4, 47.3, 39.8],
  },
  memory: {
    total: 34359738368,
    used: 16106127360,
    available: 18253611008,
    percent: 46.9,
    swap_total: 4294967296,
    swap_used: 524288000,
  },
  disk: [
    { mountpoint: '/', device: '/dev/nvme0n1p2', fstype: 'ext4', total: 512110190592, used: 153632972800, free: 358477217792, percent: 30.0 },
    { mountpoint: '/home', device: '/dev/sda1', fstype: 'ext4', total: 1099511627776, used: 769658339737, free: 329853288039, percent: 70.0 },
  ],
  network: {
    rx_bytes: 1234567890,
    tx_bytes: 987654321,
    rx_speed: 45800000,
    tx_speed: 12200000,
  },
  uptime: 1209600,
  process_count: 248,
};

export const mockServices: ServiceInfo[] = [
  { name: 'nginx', type: 'systemd', description: 'High Performance HTTP Server', status: 'active', uptime: '14d 8h 22m', memory: 52428800, memory_percent: 8 },
  { name: 'mariadb', type: 'systemd', description: 'MariaDB Database Server', status: 'active', uptime: '45d 12h 5m', memory: 314572800, memory_percent: 24 },
  { name: 'redis-server', type: 'systemd', description: 'Advanced Key-Value Store', status: 'active', uptime: '14d 8h 22m', memory: 157286400, memory_percent: 12 },
  { name: 'cloudflared', type: 'systemd', description: 'Cloudflare Tunnel Daemon', status: 'active', uptime: '14d 8h 22m', memory: 41943040, memory_percent: 3 },
  { name: 'ariari-app', type: 'nohup', description: 'Ariari Web Application', status: 'active', uptime: '7d 3h 15m', memory: 209715200, memory_percent: 16 },
  { name: 'postgresql', type: 'systemd', description: 'PostgreSQL Database Server', status: 'failed', uptime: '0s', memory: 0, memory_percent: 0 },
  { name: 'docker', type: 'docker', description: 'Container Runtime Engine', status: 'active', uptime: '30d 18h 12m', memory: 1258291200, memory_percent: 65 },
  { name: 'fail2ban', type: 'systemd', description: 'Intrusion Prevention Service', status: 'inactive', uptime: '-', memory: 0, memory_percent: 0 },
];

export const mockLogs: LogEntry[] = [
  { id: 1, timestamp: '2024-02-16 14:32:01', log_type: 'bruteforce', severity: 'critical', source: 'auth-gateway', message: "[BruteForce] Multiple failed login attempts for user 'admin' from IP 192.168.1.104", ip_address: '192.168.1.104', count: 15 },
  { id: 2, timestamp: '2024-02-16 14:31:55', log_type: 'system', severity: 'info', source: 'sys-monitor', message: 'CPU temperature normalized at 42°C. Power supply voltage stable.' },
  { id: 3, timestamp: '2024-02-16 14:31:40', log_type: 'error', severity: 'warning', source: 'db-service', message: 'Query execution time exceeded threshold: 2400ms. [SELECT * FROM telemetry WHERE...]' },
  { id: 4, timestamp: '2024-02-16 14:30:12', log_type: 'bruteforce', severity: 'critical', source: 'auth-gateway', message: '[BruteForce] Login attempt frequency limit exceeded for IP 45.2.19.122', ip_address: '45.2.19.122', count: 42 },
  { id: 5, timestamp: '2024-02-16 14:28:44', log_type: 'system', severity: 'info', source: 'app-docker', message: "Container 'grafana-instance' health check passed. Status: Running." },
  { id: 6, timestamp: '2024-02-16 14:25:31', log_type: 'network', severity: 'info', source: 'net-traffic', message: 'Inbound traffic surge detected: 450Mbps on eth0 interface.' },
  { id: 7, timestamp: '2024-02-16 14:22:10', log_type: 'system', severity: 'info', source: 'sys-scheduler', message: "Scheduled backup job 'DAILY_OFFSITE' completed successfully in 12m 4s." },
  { id: 8, timestamp: '2024-02-16 14:19:05', log_type: 'error', severity: 'error', source: 'docker-d', message: "Container 'pi-hole' exited with status code 137 (OOM)" },
  { id: 9, timestamp: '2024-02-16 14:18:32', log_type: 'system', severity: 'info', source: 'syslog', message: 'System backup scheduled for 02:00 UTC' },
  { id: 10, timestamp: '2024-02-16 14:15:00', log_type: 'network', severity: 'warning', source: 'firewall', message: 'Unusual outbound traffic pattern detected on port 8443' },
];

export const mockAlertSettings: AlertSetting[] = [
  { id: 1, metric_type: 'cpu', threshold: 85, enabled: true, email_recipients: ['admin@example.com'] },
  { id: 2, metric_type: 'memory', threshold: 90, enabled: true, email_recipients: ['admin@example.com'] },
  { id: 3, metric_type: 'disk', threshold: 95, enabled: false, email_recipients: ['admin@example.com'] },
  { id: 4, metric_type: 'network', threshold: 80, enabled: true, email_recipients: ['admin@example.com'] },
];

export const mockAlertHistory: AlertHistory[] = [
  { id: 1, timestamp: '2024-02-16 14:00:00', alert_type: 'cpu_high', message: 'CPU usage exceeded 85%', metric_value: 92.3, sent_email: true },
  { id: 2, timestamp: '2024-02-16 12:30:00', alert_type: 'disk_warning', message: 'Low Disk Space: /var/log (95%)', metric_value: 95.0, sent_email: true },
  { id: 3, timestamp: '2024-02-16 08:15:00', alert_type: 'service_down', message: 'Service postgresql failed', metric_value: 0, sent_email: true },
];

export function generateMonitoringHistory(hours: number = 24): MonitoringHistory[] {
  const data: MonitoringHistory[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 48;

  for (let i = 48; i >= 0; i--) {
    const ts = new Date(now - i * interval);
    data.push({
      timestamp: ts.toISOString(),
      cpu: 30 + Math.random() * 40 + Math.sin(i / 5) * 10,
      memory: 40 + Math.random() * 20 + Math.cos(i / 8) * 5,
      disk: 28 + i * 0.04,
      network_rx: 100 + Math.random() * 400,
      network_tx: 50 + Math.random() * 150,
    });
  }
  return data;
}
