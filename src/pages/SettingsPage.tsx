import { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Zap, Save, RotateCcw, Clock, Mail, Database, Bell, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import {
  fetchAlertSettings,
  updateAlertSetting,
  fetchAppSettings,
  updateSmtpSettings,
  updateMonitoringSettings,
  testSmtpConnection,
} from '../api/client';
import type { AlertSetting, AppSettings } from '../types';

type SettingsTab = 'alerts' | 'email' | 'monitoring' | 'data';

const metricIcons: Record<string, typeof Cpu> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  network: Zap,
};

const metricLabels: Record<string, { title: string; desc: string }> = {
  cpu: { title: 'CPU 사용률 임계값', desc: '5분 이상 설정값을 초과할 경우 알림을 전송합니다.' },
  memory: { title: 'RAM 사용량', desc: '시스템 여유 메모리가 임계값 이하로 떨어지면 알림을 발송합니다.' },
  disk: { title: '디스크 용량 경고', desc: '자동 정리 트리거 및 관리자 경고를 설정합니다.' },
  network: { title: '트래픽 급증', desc: '잠재적 침해를 나타내는 비정상적인 아웃바운드 트래픽 패턴을 감지합니다.' },
};

interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  sender: string;
  useTls: boolean;
}

interface MonitorConfig {
  collectInterval: number;
  retentionDays: number;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('alerts');
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    sender: '',
    useTls: true,
  });
  const [monitorConfig, setMonitorConfig] = useState<MonitorConfig>({
    collectInterval: 5,
    retentionDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const [alertResp, appResp] = await Promise.all([fetchAlertSettings(), fetchAppSettings()]);
        setAlertSettings(alertResp.settings.map((s) => ({ ...s })));
        applyAppSettings(appResp);
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const applyAppSettings = (app: AppSettings) => {
    setEmailConfig({
      smtpHost: app.smtp_host ?? '',
      smtpPort: String(app.smtp_port ?? 587),
      smtpUser: app.smtp_user ?? '',
      smtpPassword: '',
      sender: app.smtp_from ?? '',
      useTls: app.smtp_tls ?? true,
    });
    setMonitorConfig({
      collectInterval: Math.round((app.monitor_interval ?? 300) / 60),
      retentionDays: app.data_retention_days ?? 30,
    });
  };

  const toggleSetting = (id: number) => {
    setAlertSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const updateThreshold = (id: number, value: number) => {
    setAlertSettings((prev) => prev.map((s) => (s.id === id ? { ...s, threshold: value } : s)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === 'alerts') {
        await Promise.all(
          alertSettings.map((s) =>
            updateAlertSetting(s.id, { threshold: s.threshold, enabled: s.enabled })
          )
        );
      } else if (tab === 'email') {
        await updateSmtpSettings({
          smtp_host: emailConfig.smtpHost,
          smtp_port: Number(emailConfig.smtpPort),
          smtp_user: emailConfig.smtpUser || undefined,
          smtp_password: emailConfig.smtpPassword || undefined,
          smtp_from: emailConfig.sender,
          smtp_tls: emailConfig.useTls,
        });
      } else if (tab === 'monitoring') {
        await updateMonitoringSettings({
          monitor_interval: monitorConfig.collectInterval * 60,
        });
      } else if (tab === 'data') {
        await updateMonitoringSettings({
          data_retention_days: monitorConfig.retentionDays,
        });
      }
      setLastSync(new Date());
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    setLoading(true);
    try {
      const [alertResp, appResp] = await Promise.all([fetchAlertSettings(), fetchAppSettings()]);
      setAlertSettings(alertResp.settings.map((s) => ({ ...s })));
      applyAppSettings(appResp);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const result = await testSmtpConnection({
        smtp_host: emailConfig.smtpHost,
        smtp_port: Number(emailConfig.smtpPort),
        smtp_user: emailConfig.smtpUser || undefined,
        smtp_password: emailConfig.smtpPassword || undefined,
        smtp_from: emailConfig.sender,
        smtp_tls: emailConfig.useTls,
      });
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message ?? '요청 실패' });
    } finally {
      setTestLoading(false);
    }
  };

  const formatSync = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 5) return '방금';
    if (diff < 60) return `${diff}초 전`;
    return `${Math.floor(diff / 60)}분 전`;
  };

  const tabs: { key: SettingsTab; label: string; icon: typeof Bell }[] = [
    { key: 'alerts', label: '알림', icon: Bell },
    { key: 'email', label: '이메일', icon: Mail },
    { key: 'monitoring', label: '모니터링', icon: Clock },
    { key: 'data', label: '데이터', icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">설정 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 glass-card border-b border-primary/10 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">설정</h1>
              <p className="text-xs text-accent-mint flex items-center gap-1 uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 bg-accent-mint rounded-full animate-pulse" />
                시스템 정상
              </p>
            </div>
          </div>
          <nav className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                  tab === key ? 'bg-primary text-bg-dark font-semibold' : 'hover:bg-white/5 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* 알림 탭 */}
        {tab === 'alerts' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">알림 임계값</h2>
              <p className="text-slate-400">실시간 모니터링 트리거 및 시스템 알림 민감도를 설정합니다.</p>
            </div>
            <div className="space-y-6">
              {alertSettings.map((setting) => {
                const Icon = metricIcons[setting.metric_type] || Cpu;
                const meta = metricLabels[setting.metric_type];
                return (
                  <GlassCard key={setting.id} hover className="p-6 group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{meta?.title || setting.metric_type}</h3>
                          <p className="text-sm text-slate-400 mt-1">{meta?.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSetting(setting.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          setting.enabled ? 'bg-primary neon-glow' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            setting.enabled ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">경고 수준</span>
                        <span className="text-lg font-bold text-primary">
                          {setting.threshold}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={setting.threshold}
                        onChange={(e) => updateThreshold(setting.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 이메일 탭 */}
        {tab === 'email' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">이메일 설정</h2>
              <p className="text-slate-400">알림 발송을 위한 SMTP 서버를 설정합니다.</p>
            </div>
            <GlassCard className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SMTP 호스트</label>
                  <input
                    value={emailConfig.smtpHost}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 text-sm outline-none"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SMTP 포트</label>
                  <input
                    value={emailConfig.smtpPort}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 text-sm outline-none"
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SMTP 사용자명</label>
                  <input
                    value={emailConfig.smtpUser}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 text-sm outline-none"
                    placeholder="user@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">SMTP 비밀번호</label>
                  <input
                    type="password"
                    value={emailConfig.smtpPassword}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 text-sm outline-none"
                    placeholder="앱 비밀번호"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">발신자 이메일</label>
                <input
                  value={emailConfig.sender}
                  onChange={(e) => setEmailConfig({ ...emailConfig, sender: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-200 text-sm outline-none"
                  placeholder="alerts@homeserver.dev"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEmailConfig({ ...emailConfig, useTls: !emailConfig.useTls })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${emailConfig.useTls ? 'bg-primary neon-glow' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailConfig.useTls ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm text-slate-300">STARTTLS 암호화 사용</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleTestEmail}
                  disabled={testLoading}
                  className="px-6 py-2.5 bg-primary/20 text-primary rounded-lg border border-primary/30 hover:bg-primary/30 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {testLoading ? '전송 중...' : '테스트 이메일 발송'}
                </button>
                {testResult && (
                  <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* 모니터링 탭 */}
        {tab === 'monitoring' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">모니터링 설정</h2>
              <p className="text-slate-400">데이터 수집 주기 및 동작을 설정합니다.</p>
            </div>
            <GlassCard className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">수집 주기 (분)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={monitorConfig.collectInterval}
                    onChange={(e) => setMonitorConfig({ ...monitorConfig, collectInterval: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-lg font-bold text-primary w-16 text-right">{monitorConfig.collectInterval}분</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  주기가 짧을수록 더 세밀한 데이터를 제공하지만 저장 공간이 증가합니다. (범위: 1~60분)
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* 데이터 탭 */}
        {tab === 'data' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">데이터 보존</h2>
              <p className="text-slate-400">히스토리 데이터 저장 및 정리 정책을 관리합니다.</p>
            </div>
            <GlassCard className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">데이터 보존 기간 (일)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={7}
                    max={365}
                    value={monitorConfig.retentionDays}
                    onChange={(e) => setMonitorConfig({ ...monitorConfig, retentionDays: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-lg font-bold text-primary w-20 text-right">{monitorConfig.retentionDays}일</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">설정 기간이 지난 데이터는 매일 03:00에 자동으로 정리됩니다.</p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">모니터링 보존</span>
                  <span className="text-sm font-mono text-primary">{monitorConfig.retentionDays}일</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">로그 보존</span>
                  <span className="text-sm font-mono text-slate-400">
                    {Math.min(monitorConfig.retentionDays * 3, 90)}일
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </main>

      {/* 하단 고정 푸터 */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 glass-card border-t border-primary/10 bg-bg-dark/80 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>마지막 저장: {formatSync(lastSync)}</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              되돌리기
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-2.5 rounded-lg bg-primary text-bg-dark font-bold text-sm transition-all neon-glow hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
