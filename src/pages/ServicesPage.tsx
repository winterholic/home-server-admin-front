import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Play, Square, RotateCw, FileText, Layers, CheckCircle, XCircle, PauseCircle, X, Box, Terminal, Settings2 } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { fetchServices, controlService, fetchServiceLogs } from '../api/client';
import type { ServiceInfo } from '../types';

function formatMemory(bytes: number): string {
  if (bytes === 0) return '0 MB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

function ServiceTypeIcon({ type }: { type: ServiceInfo['type'] }) {
  if (type === 'docker') return <Box className="w-5 h-5" />;
  if (type === 'nohup') return <Terminal className="w-5 h-5" />;
  return <Settings2 className="w-5 h-5" />;
}

interface LogsModal {
  name: string;
  lines: string[];
  loading: boolean;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logsModal, setLogsModal] = useState<LogsModal | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'failed'>('all');

  const loadServices = useCallback(async () => {
    try {
      const resp = await fetchServices();
      setServices(resp.services);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Failed to load services:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleControl = async (svc: ServiceInfo, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(svc.name);
    try {
      await controlService(svc.name, action, svc.type);
      await loadServices();
    } catch (e) {
      console.error(`Failed to ${action} ${svc.name}:`, e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (svc: ServiceInfo) => {
    setLogsModal({ name: svc.name, lines: [], loading: true });
    try {
      const resp = await fetchServiceLogs(svc.name, 100, svc.type);
      setLogsModal({ name: svc.name, lines: resp.lines, loading: false });
    } catch (e) {
      setLogsModal({ name: svc.name, lines: ['로그를 불러오지 못했습니다'], loading: false });
    }
  };

  const filtered = services.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    total: services.length,
    active: services.filter((s) => s.status === 'active').length,
    failed: services.filter((s) => s.status === 'failed').length,
    inactive: services.filter((s) => s.status === 'inactive').length,
  };

  const formatRefresh = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return '방금';
    if (diff < 60) return `${diff}초 전`;
    return `${Math.floor(diff / 60)}분 전`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* 로그 모달 */}
      {logsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-3xl mx-4 bg-bg-dark border border-primary/20 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                로그: {logsModal.name}
              </h3>
              <button
                onClick={() => setLogsModal(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-0.5 bg-black/30">
              {logsModal.loading ? (
                <p className="text-slate-500 animate-pulse">로그 불러오는 중...</p>
              ) : logsModal.lines.length === 0 ? (
                <p className="text-slate-500">로그 항목이 없습니다.</p>
              ) : (
                logsModal.lines.map((line, i) => (
                  <p key={i} className="whitespace-pre-wrap break-all leading-relaxed hover:bg-white/5 px-1 rounded">
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">서비스 관리</h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Systemd / Docker / 프로세스 제어</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 placeholder-slate-500 transition-all text-sm"
              placeholder="서비스 검색..."
            />
          </div>
          <button
            onClick={loadServices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 flex items-center gap-4 cursor-pointer" hover>
          <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center">
            <Layers className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">전체</p>
            <p className="text-2xl font-bold text-white">{counts.total}</p>
          </div>
        </GlassCard>
        <GlassCard className={`p-5 flex items-center gap-4 cursor-pointer ${filter === 'active' ? 'border-green-500/30' : ''}`} hover>
          <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center" onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">실행 중</p>
            <p className="text-2xl font-bold text-white">{counts.active}</p>
          </div>
        </GlassCard>
        <GlassCard className={`p-5 flex items-center gap-4 cursor-pointer ${filter === 'failed' ? 'border-red-500/30' : ''}`} hover>
          <div className="w-11 h-11 rounded-lg bg-red-500/10 flex items-center justify-center" onClick={() => setFilter(filter === 'failed' ? 'all' : 'failed')}>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">오류</p>
            <p className="text-2xl font-bold text-white">{counts.failed}</p>
          </div>
        </GlassCard>
        <GlassCard className={`p-5 flex items-center gap-4 cursor-pointer ${filter === 'inactive' ? 'border-slate-500/30' : ''}`} hover>
          <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center" onClick={() => setFilter(filter === 'inactive' ? 'all' : 'inactive')}>
            <PauseCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">비활성</p>
            <p className="text-2xl font-bold text-white">{counts.inactive}</p>
          </div>
        </GlassCard>
      </div>

      {/* 서비스 테이블 */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-slate-400 animate-pulse">서비스 목록 불러오는 중...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">서비스 이름</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">가동 시간</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">메모리</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((svc) => {
                  const isActioning = actionLoading === svc.name;
                  return (
                    <tr key={svc.name} className="hover:bg-primary/[0.03] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                              svc.status === 'active'
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : svc.status === 'failed'
                                  ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                  : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                            }`}
                          >
                            <ServiceTypeIcon type={svc.type} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {svc.type === 'systemd' ? `${svc.name}.service` : svc.name}
                            </p>
                            <p className="text-xs text-slate-500">{svc.description || svc.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={svc.status} label={svc.status === 'active' ? '실행 중' : svc.status === 'failed' ? '오류' : '비활성'} />
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-mono ${svc.status === 'active' ? 'text-slate-300' : 'text-slate-600'}`}>
                          {svc.uptime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-40">
                          <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-slate-500">
                            <span>{formatMemory(svc.memory)}</span>
                            <span>{svc.memory_percent.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(svc.memory_percent, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          {isActioning ? (
                            <span className="text-xs text-slate-400 animate-pulse px-2">처리 중...</span>
                          ) : (
                            <>
                              {svc.status !== 'active' && (
                                <button
                                  onClick={() => handleControl(svc, 'start')}
                                  className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-all"
                                  title="시작"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {svc.status === 'active' && (
                                <button
                                  onClick={() => handleControl(svc, 'stop')}
                                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                  title="중지"
                                >
                                  <Square className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleControl(svc, 'restart')}
                                disabled={svc.status === 'inactive'}
                                className={`p-2 rounded-lg transition-all ${
                                  svc.status === 'inactive' ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-primary hover:bg-primary/10'
                                }`}
                                title="재시작"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewLogs(svc)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                title="로그 보기"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">전체 {counts.total}개 중 {filtered.length}개 표시</span>
          <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-slate-600">
            <span>마지막 갱신: {formatRefresh(lastRefresh)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
