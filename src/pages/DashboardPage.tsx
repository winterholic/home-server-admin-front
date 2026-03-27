import { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, Clock, Hash, Layers, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import SeverityBadge from '../components/common/SeverityBadge';
import { fetchDashboard, fetchServices } from '../api/client';
import type { DashboardData, ServiceInfo } from '../types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}일 ${h}시간 ${m}분`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1048576) return (bytesPerSec / 1048576).toFixed(1) + ' MB/s';
  return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
}

export default function DashboardPage() {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const [dash, svcResp] = await Promise.all([fetchDashboard(), fetchServices()]);
        if (!active) return;
        setDashData(dash);
        setServices(svcResp.services);
        setError(null);
      } catch (e) {
        console.error('Dashboard load failed:', e);
        if (active) setError('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인하세요.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [retryCount]);

  if (loading && !dashData) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">대시보드 불러오는 중...</div>
      </div>
    );
  }

  if (error && !dashData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-1">대시보드 데이터를 불러올 수 없습니다</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm border border-primary/20 hover:bg-primary/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          다시 시도
        </button>
      </div>
    );
  }

  if (!dashData) return null;

  const sys = dashData.system;
  const activeServices = dashData.services.active;
  const failedServices = dashData.services.failed;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* 상단 메트릭 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* CPU */}
        <GlassCard hover className="p-6 group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">CPU 사용률</p>
              <h3 className="text-3xl font-mono font-bold text-white leading-none">
                {sys.cpu.percent.toFixed(1)}
                <span className="text-primary text-lg">%</span>
              </h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="w-full h-12 flex items-end gap-1 px-1">
            {sys.cpu.per_core.slice(0, 8).map((core, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/30 rounded-t-sm transition-all duration-500 group-hover:bg-primary/50"
                style={{ height: `${core}%` }}
              />
            ))}
          </div>
        </GlassCard>

        {/* 메모리 */}
        <GlassCard hover className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">메모리 사용</p>
              <h3 className="text-2xl font-mono font-bold text-white">
                {formatBytes(sys.memory.used)}
                <span className="text-slate-400 text-sm font-sans font-normal ml-1">
                  / {formatBytes(sys.memory.total)}
                </span>
              </h3>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MemoryStick className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-500">{sys.memory.percent.toFixed(1)}% 사용 중</span>
              <span className="text-slate-400">스왑: {formatBytes(sys.memory.swap_used)}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary neon-glow rounded-full transition-all" style={{ width: `${sys.memory.percent}%` }} />
            </div>
          </div>
        </GlassCard>

        {/* 디스크 */}
        <GlassCard hover className="p-6 flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="transparent"
                stroke="#4B7CF3"
                strokeWidth="4"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * (sys.disk[0]?.percent ?? 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
              {sys.disk[0]?.percent ?? 0}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">디스크 상태</p>
            <h3 className="text-lg font-mono font-bold text-white truncate">
              {formatBytes(sys.disk[0]?.used ?? 0)} <span className="text-slate-500 text-xs">사용</span>
            </h3>
            <p className="text-[10px] text-green-400 flex items-center gap-1 mt-1">
              <HardDrive className="w-3 h-3" /> {sys.disk[0]?.device ?? 'Disk'}
            </p>
          </div>
        </GlassCard>

        {/* 네트워크 */}
        <GlassCard hover className="p-6">
          <div className="flex justify-between items-start mb-2">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">네트워크 트래픽</p>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Network className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs text-slate-400">다운로드</span>
              </div>
              <span className="font-mono text-sm text-white">{formatSpeed(sys.network.rx_speed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-xs text-slate-400">업로드</span>
              </div>
              <span className="font-mono text-sm text-white">{formatSpeed(sys.network.tx_speed)}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 중간 행: 서비스 + 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 서비스 현황 */}
        <GlassCard className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              서비스 현황
            </h2>
            <span className="text-xs text-slate-500">
              {activeServices}개 실행 중 / 전체 {dashData.services.total}개
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.slice(0, 6).map((svc) => (
              <div
                key={svc.name}
                className="p-4 bg-white/[0.03] rounded-lg border border-white/5 flex items-center justify-between hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      svc.status === 'active'
                        ? 'bg-green-500 neon-glow-green'
                        : svc.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-slate-600'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-sm">{svc.name}</p>
                    <p className="text-xs text-slate-500">
                      {svc.status === 'active' ? `가동 시간: ${svc.uptime}` : svc.description}
                    </p>
                  </div>
                </div>
                <StatusBadge status={svc.status} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 최근 알림 */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-red-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              최근 알림
              {failedServices > 0 && (
                <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                  {failedServices}개 위험
                </span>
              )}
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {dashData.recent_alerts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">최근 알림 없음</p>
            ) : (
              dashData.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-sm">!</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{alert.message}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* 하단: 시스템 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">시스템 가동 시간</p>
            <p className="text-xl font-mono">{formatUptime(sys.uptime)}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-mint/10 rounded-lg flex items-center justify-center">
            <Layers className="w-5 h-5 text-accent-mint" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">활성 서비스</p>
            <p className="text-xl font-mono">{activeServices}개 실행 중</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">프로세스</p>
            <p className="text-xl font-mono">{sys.process_count}</p>
          </div>
        </GlassCard>
      </div>

      {/* 최근 로그 이벤트 */}
      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-400" />
            최근 로그 이벤트
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs border border-primary/20 hover:bg-primary/30 transition-colors font-medium">
              실시간
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">시간</th>
                <th className="px-6 py-4">출처</th>
                <th className="px-6 py-4">메시지</th>
                <th className="px-6 py-4 text-right">등급</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashData.recent_logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-semibold">
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 max-w-md truncate">{log.message}</td>
                  <td className="px-6 py-4 text-right">
                    <SeverityBadge severity={log.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
