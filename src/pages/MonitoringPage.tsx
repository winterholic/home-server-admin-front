import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Cpu, MemoryStick, HardDrive, Wifi, Clock, Server, Thermometer, AlertCircle, RefreshCw } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { fetchSystemStatus, fetchSystemHistory, fetchServices } from '../api/client';
import type { SystemStatus, MonitoringHistory } from '../types';

type Period = '1h' | '24h' | '7d' | '30d';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 rounded-lg text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-mono font-medium">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.name.includes('Network') ? ' MB/s' : '%'}
        </p>
      ))}
    </div>
  );
};

export default function MonitoringPage() {
  const [period, setPeriod] = useState<Period>('24h');
  const [sys, setSys] = useState<SystemStatus | null>(null);
  const [history, setHistory] = useState<MonitoringHistory[]>([]);
  const [activeServiceCount, setActiveServiceCount] = useState(0);
  const [sysLoading, setSysLoading] = useState(true);
  const [sysError, setSysError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 5초마다 시스템 상태 갱신
  useEffect(() => {
    let active = true;
    setSysLoading(true);
    setSysError(null);
    const poll = async () => {
      try {
        const data = await fetchSystemStatus();
        if (active) {
          setSys(data);
          setSysError(null);
        }
      } catch (e) {
        console.error('Status poll failed:', e);
        if (active) setSysError('시스템 상태를 불러올 수 없습니다.');
      } finally {
        if (active) setSysLoading(false);
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [retryCount]);

  // 기간 변경 시 이력 데이터 로드
  useEffect(() => {
    let active = true;
    setHistoryError(null);
    fetchSystemHistory(period)
      .then((r) => { if (active) { setHistory(r.data); setHistoryError(null); } })
      .catch((e) => {
        console.error('History load failed:', e);
        if (active) { setHistory([]); setHistoryError('이력 데이터를 불러올 수 없습니다.'); }
      });
    return () => { active = false; };
  }, [period, retryCount]);

  // 활성 서비스 수 조회
  useEffect(() => {
    fetchServices()
      .then((r) => setActiveServiceCount(r.summary.active))
      .catch(() => {});
  }, []);

  const chartData = history.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    network_rx: d.network_rx / 1048576,
    network_tx: d.network_tx / 1048576,
  }));

  if (sysLoading && !sys) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">시스템 데이터 불러오는 중...</div>
      </div>
    );
  }

  if (sysError && !sys) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-1">시스템 데이터를 불러올 수 없습니다</p>
          <p className="text-slate-500 text-sm">{sysError}</p>
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

  if (!sys) return null;

  const swapPercent = sys.memory.swap_total > 0
    ? (sys.memory.swap_used / sys.memory.swap_total) * 100
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              시스템 모니터 <span className="text-xs font-normal text-slate-400 ml-2">v4.2.0</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-mint rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest text-accent-mint font-semibold">실시간 분석</span>
            </div>
          </div>
        </div>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
          {(['1h', '24h', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
                period === p ? 'bg-primary text-bg-dark neon-glow font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 이력 데이터 오류 배너 */}
      {historyError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-yellow-300">{historyError} — 현재 실시간 데이터만 표시됩니다.</span>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs hover:bg-yellow-500/30 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            재시도
          </button>
        </div>
      )}

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CPU 차트 */}
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">CPU 사용률</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{sys.cpu.per_core.length}코어</span>
          </div>
          <div className="flex flex-col lg:flex-row flex-1">
            <div className="flex-1 p-4 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4B7CF3" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4B7CF3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cpu" name="CPU" stroke="#4B7CF3" fill="url(#cpuGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-56 bg-black/20 border-t lg:border-t-0 lg:border-l border-white/5 p-5 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">코어별 부하</p>
                <div className="grid grid-cols-6 lg:grid-cols-4 gap-1.5">
                  {sys.cpu.per_core.map((core, i) => (
                    <div key={i} className="h-12 bg-white/5 rounded-sm relative overflow-hidden" title={`코어 ${i}: ${core.toFixed(1)}%`}>
                      <div className="absolute bottom-0 w-full bg-primary/40 transition-all" style={{ height: `${core}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">평균</span>
                  <span className="text-sm font-mono">{(sys.cpu.per_core.reduce((a, b) => a + b, 0) / sys.cpu.per_core.length).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">최대</span>
                  <span className="text-sm font-mono text-primary">{Math.max(...sys.cpu.per_core).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">전체</span>
                  <span className="text-sm font-mono text-accent-mint">{sys.cpu.percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 메모리 차트 */}
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <MemoryStick className="w-5 h-5 text-accent-mint" />
              <h2 className="font-semibold">메모리 현황</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">전체 {formatBytes(sys.memory.total)}</span>
          </div>
          <div className="flex flex-col lg:flex-row flex-1">
            <div className="flex-1 p-4 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4B7CF3" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#4B7CF3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="memory" name="RAM" stroke="#4B7CF3" fill="url(#memGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-56 bg-black/20 border-t lg:border-t-0 lg:border-l border-white/5 p-5 space-y-5">
              <div className="p-3 bg-white/5 rounded-lg border border-primary/20">
                <p className="text-[10px] uppercase text-slate-500 mb-1">사용 중인 RAM</p>
                <p className="text-xl font-bold text-primary">{formatBytes(sys.memory.used)}</p>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${sys.memory.percent}%` }} />
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-accent-mint/20">
                <p className="text-[10px] uppercase text-slate-500 mb-1">스왑 공간</p>
                <p className="text-xl font-bold text-accent-mint">{formatBytes(sys.memory.swap_used)}</p>
                <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div className="bg-accent-mint h-full rounded-full" style={{ width: `${swapPercent.toFixed(1)}%` }} />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">사용 가능</span>
                  <span>{formatBytes(sys.memory.available)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">사용률</span>
                  <span>{sys.memory.percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 디스크 상태 */}
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-yellow-400" />
              <h2 className="font-semibold">디스크 상태</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{sys.disk.length}개 파티션</span>
          </div>
          <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {sys.disk.map((d) => (
              <div key={d.mountpoint} className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-sm">{d.mountpoint === '/' ? '시스템 루트 (/)' : `저장소 (${d.mountpoint})`}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{d.device}</p>
                  </div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${d.percent < 80 ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                    {d.percent < 80 ? '정상' : '주의'}
                  </span>
                </div>
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-2xl font-bold">{formatBytes(d.used)}</span>
                  <span className="text-xs text-slate-500 mb-1">/ {formatBytes(d.total)}</span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 네트워크 트래픽 */}
        <GlassCard className="overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">네트워크 트래픽</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">실시간 모니터</span>
          </div>
          <div className="flex flex-col lg:flex-row flex-1">
            <div className="flex-1 p-4 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="network_rx" name="Network RX" stroke="#4B7CF3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="network_tx" name="Network TX" stroke="#34D399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full lg:w-56 bg-black/20 border-t lg:border-t-0 lg:border-l border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">수신</p>
                  <p className="text-lg font-mono">{formatSpeed(sys.network.rx_speed)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-accent-mint" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">송신</p>
                  <p className="text-lg font-mono">{formatSpeed(sys.network.tx_speed)}</p>
                </div>
              </div>
              <div className="pt-4 space-y-3 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">총 수신량</span>
                  <span>{formatBytes(sys.network.rx_bytes)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">총 송신량</span>
                  <span>{formatBytes(sys.network.tx_bytes)}</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 하단 정보 카드 */}
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
            <Server className="w-5 h-5 text-accent-mint" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">활성 서비스</p>
            <p className="text-xl font-mono">{activeServiceCount}개 실행 중</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
            <Thermometer className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">프로세스</p>
            <p className="text-xl font-mono">{sys.process_count}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
