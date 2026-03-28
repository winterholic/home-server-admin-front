import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Download, Settings, Eye, ShieldAlert, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import SeverityBadge from '../components/common/SeverityBadge';
import { fetchLogs, fetchLogTimeline, fetchLogStatistics, fetchAccessIps } from '../api/client';
import type { LogEntry, TimelineBucket, LogStatistics, AccessIpEntry } from '../types';

type TimePeriod = '1h' | '6h' | '24h' | '7d';
type MainTab = 'logs' | 'access-ips';

const PAGE_SIZE = 50;

function formatLogType(type: string): string {
  const labels: Record<string, string> = {
    auth: '인증 / SSH',
    nginx_access: '웹 접근',
    nginx_error: '웹 오류',
    bruteforce: '무차별 대입',
    system: '시스템 이벤트',
    error: '시스템 오류',
    network: '네트워크 트래픽',
  };
  return labels[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function AccessIpsTab() {
  const [hours, setHours] = useState(24);
  const [entries, setEntries] = useState<AccessIpEntry[]>([]);
  const [totalUnique, setTotalUnique] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIp, setExpandedIp] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchAccessIps(hours)
      .then((r) => {
        setEntries(r.recent);
        setTotalUnique(r.total_unique);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [hours]);

  const filtered = useMemo(() =>
    entries.filter((e) => !search || e.ip.includes(search)),
    [entries, search]
  );

  const suspicious = entries.filter((e) => e.suspicious).length;

  return (
    <div className="p-8 space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">고유 IP</p>
            <p className="text-2xl font-mono font-bold">{totalUnique}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">의심 IP</p>
            <p className="text-2xl font-mono font-bold text-red-400">{suspicious}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent-mint/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-accent-mint" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">전체 요청</p>
            <p className="text-2xl font-mono font-bold">{entries.reduce((s, e) => s + e.count, 0).toLocaleString()}</p>
          </div>
        </GlassCard>
      </div>

      {/* 필터 바 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="IP 검색..."
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex bg-primary/5 rounded-lg p-1 border border-primary/10">
          {([1, 6, 24, 72] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                hours === h ? 'bg-primary text-bg-dark' : 'text-slate-400 hover:text-white'
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* IP 테이블 */}
      <GlassCard className="overflow-hidden rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-slate-400 animate-pulse">IP 데이터 불러오는 중...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary/5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-primary/10">
                  <th className="px-6 py-4">IP 주소</th>
                  <th className="px-6 py-4">요청 수</th>
                  <th className="px-6 py-4">마지막 접속</th>
                  <th className="px-6 py-4">상태코드</th>
                  <th className="px-6 py-4">요청 경로</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((entry) => (
                  <>
                    <tr
                      key={entry.ip}
                      onClick={() => setExpandedIp(expandedIp === entry.ip ? null : entry.ip)}
                      className={`cursor-pointer transition group ${
                        entry.suspicious
                          ? 'bg-red-500/5 hover:bg-red-500/10'
                          : 'hover:bg-primary/5'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {entry.suspicious && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                          <span className={`font-mono text-sm font-semibold ${entry.suspicious ? 'text-red-300' : 'text-white'}`}>
                            {entry.ip}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm font-bold ${entry.suspicious ? 'text-red-400' : 'text-primary'}`}>
                          {entry.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {formatRelativeTime(entry.last_seen)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.status_codes.map((code) => (
                            <span
                              key={code}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                code >= 500 ? 'bg-red-500/20 text-red-400' :
                                code >= 400 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-primary/20 text-primary'
                              }`}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono truncate max-w-xs">
                        {entry.paths[0] ?? '-'}
                        {entry.paths.length > 1 && (
                          <span className="text-slate-600 ml-1">+{entry.paths.length - 1}</span>
                        )}
                      </td>
                    </tr>
                    {expandedIp === entry.ip && (
                      <tr key={`${entry.ip}-expanded`} className={entry.suspicious ? 'bg-red-500/5' : 'bg-primary/5'}>
                        <td colSpan={5} className="px-6 py-3">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">요청 경로 목록</p>
                            {entry.paths.map((path, i) => (
                              <p key={i} className="text-xs font-mono text-slate-300 hover:text-white transition">
                                {path}
                              </p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                      데이터가 없습니다. nginx access.log를 확인하세요.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3 border-t border-primary/10 bg-primary/5">
          <p className="text-xs text-slate-500">
            최근 {hours}시간 기준 · 고유 IP {totalUnique}개 · 의심 IP 50회 이상 기준
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default function LogsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('logs');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<TimePeriod>('24h');
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(
    new Set(['critical', 'error', 'warning', 'info'])
  );
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineBucket[]>([]);
  const [stats, setStats] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchLogs({ limit: 500 })
      .then((resp) => {
        setLogs(resp.logs);
        const types = new Set(resp.logs.map((l) => l.log_type));
        setTypeFilter(types);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLogTimeline(period)
      .then((r) => setTimeline(r.timeline))
      .catch(console.error);
    fetchLogStatistics(period)
      .then(setStats)
      .catch(console.error);
  }, [period]);

  const toggleSeverity = (s: string) => {
    const next = new Set(severityFilter);
    next.has(s) ? next.delete(s) : next.add(s);
    setSeverityFilter(next);
    setPage(1);
  };

  const toggleType = (t: string) => {
    const next = new Set(typeFilter);
    next.has(t) ? next.delete(t) : next.add(t);
    setTypeFilter(next);
    setPage(1);
  };

  const availableTypes = useMemo(() => [...new Set(logs.map((l) => l.log_type))], [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!severityFilter.has(log.severity)) return false;
      if (typeFilter.size > 0 && !typeFilter.has(log.log_type)) return false;
      if (
        search &&
        !log.message.toLowerCase().includes(search.toLowerCase()) &&
        !log.source.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [logs, search, severityFilter, typeFilter]);

  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));

  const chartData = timeline.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    events: d.total,
    errors: d.errors,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 사이드바 필터 */}
      <aside className="w-72 glass-card border-r border-primary/10 flex flex-col h-full shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">
                로그<span className="text-primary">센트리</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold">로그 뷰어</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* 검색 */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-primary/5 border border-primary/20 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-200 placeholder-slate-500"
              placeholder="로그 검색..."
            />
          </div>

          {/* 이벤트 유형 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">이벤트 유형</h3>
            <div className="space-y-3">
              {availableTypes.length === 0 ? (
                <p className="text-xs text-slate-600">데이터 없음</p>
              ) : (
                availableTypes.map((type) => (
                  <label key={type} className="flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeFilter.has(type)}
                      onChange={() => toggleType(type)}
                      className="rounded border-primary/30 bg-bg-dark text-primary focus:ring-primary/50"
                    />
                    <span className="ml-3 text-sm text-slate-300 group-hover:text-primary transition">
                      {formatLogType(type)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 심각도 */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">심각도</h3>
            <div className="space-y-3">
              {[
                { key: 'critical', color: 'bg-red-500', label: '치명적' },
                { key: 'error', color: 'bg-red-400', label: '오류' },
                { key: 'warning', color: 'bg-yellow-500', label: '경고' },
                { key: 'info', color: 'bg-primary', label: '정보' },
              ].map(({ key, color, label }) => (
                <label key={key} className="flex items-center group cursor-pointer" onClick={() => toggleSeverity(key)}>
                  <div className={`w-3 h-3 rounded-full ${color} mr-3 ${severityFilter.has(key) ? 'opacity-100' : 'opacity-30'}`} />
                  <span className={`text-sm font-medium transition ${severityFilter.has(key) ? 'text-slate-300' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 통계 */}
          <div className="pt-6 border-t border-primary/10">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">전체 로그</span>
                <span className="text-xs font-bold text-primary tracking-tighter">
                  {stats?.total.toLocaleString() ?? logs.length.toLocaleString()}
                </span>
              </div>
              {stats && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">무차별 대입</span>
                    <span className="text-xs font-bold text-red-400">{stats.bruteforce_attempts.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">오류</span>
                    <span className="text-xs font-bold text-yellow-400">{stats.errors.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-primary h-full"
                  style={{ width: stats && stats.total > 0 ? `${Math.min((stats.errors / stats.total) * 100 * 3, 100)}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-primary/10">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition text-sm font-semibold">
            <Download className="w-4 h-4" />
            리포트 내보내기
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 px-8 py-4 glass-card border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMainTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mainTab === 'logs'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              로그 대시보드
            </button>
            <button
              onClick={() => setMainTab('access-ips')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mainTab === 'access-ips'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4" />
              IP 접속 현황
            </button>
          </div>
          {mainTab === 'logs' && (
            <div className="flex items-center gap-4">
              <div className="flex bg-primary/5 rounded-lg p-1 border border-primary/10">
                {(['1h', '6h', '24h', '7d'] as TimePeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      period === p ? 'bg-primary text-bg-dark' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
        </header>

        {mainTab === 'access-ips' ? (
          <AccessIpsTab />
        ) : (
          <div className="p-8 space-y-8">
            {/* 타임라인 차트 */}
            <GlassCard className="p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent-mint/50 to-primary/50" />
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">이벤트 빈도</h3>
                  <p className="text-2xl font-bold">
                    {stats?.total.toLocaleString() ?? '—'}{' '}
                    <span className="text-xs font-normal text-slate-500">이벤트 / {period}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-slate-400 font-medium">이벤트</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger" />
                    <span className="text-xs text-slate-400 font-medium">오류</span>
                  </div>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="eventGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4B7CF3" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#4B7CF3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(75,124,243,0.05)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={30} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(22,27,39,0.95)', border: '1px solid rgba(75,124,243,0.2)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="events" name="이벤트" stroke="#4B7CF3" fill="url(#eventGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="errors" name="오류" stroke="#F87171" fill="transparent" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* 로그 테이블 */}
            <GlassCard className="rounded-2xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-slate-400 animate-pulse">로그 불러오는 중...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-primary/5 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-primary/10">
                      <tr>
                        <th className="px-6 py-4">시간</th>
                        <th className="px-6 py-4">출처</th>
                        <th className="px-6 py-4">심각도</th>
                        <th className="px-6 py-4">메시지</th>
                        <th className="px-6 py-4 text-right">처리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {pagedLogs.map((log) => (
                        <tr
                          key={log.id}
                          className={`transition group ${
                            log.severity === 'critical' ? 'bg-danger/5 hover:bg-danger/10 neon-glow-red' : 'hover:bg-primary/5'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">{log.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-primary">{log.source}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <SeverityBadge severity={log.severity} />
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-slate-300 max-w-lg truncate">
                            {log.severity === 'critical' && (
                              <span className="text-danger font-bold">[무차별 대입] </span>
                            )}
                            {log.message}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {log.severity === 'critical' && log.ip_address ? (
                              <button className="bg-danger text-white text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-danger/80 transition uppercase tracking-wider">
                                IP 차단
                              </button>
                            ) : (
                              <button className="text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition">
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {pagedLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                            현재 필터 조건에 맞는 로그가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="p-6 flex items-center justify-between border-t border-primary/10 bg-primary/5">
                <p className="text-xs text-slate-500 italic">
                  필터 결과 {filteredLogs.length}개 중 {pagedLogs.length}개 표시 (전체 {logs.length}개)
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded text-xs font-bold transition ${
                          page === p
                            ? 'bg-primary/20 border border-primary text-primary'
                            : 'hover:bg-primary/10 text-slate-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    {totalPages > 7 && <span className="text-slate-600 text-xs">...</span>}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
