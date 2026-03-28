import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loginApi } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const data = await loginApi(username, password);
      login(data.access_token, data.username);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        '로그인에 실패했습니다';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-bg-dark p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(75,124,243,0.15)]">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-none mb-1">
              Home Server
            </p>
            <p className="text-lg font-bold text-white leading-none">
              관리자 <span className="text-primary">대시보드</span>
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-base font-semibold text-white mb-1">로그인</h1>
          <p className="text-xs text-slate-500 mb-7">관리자 계정으로 접속하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                disabled={loading}
                className="
                  w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                  px-4 py-3 text-sm text-white placeholder-slate-600
                  focus:outline-none focus:border-primary/50 focus:bg-white/[0.06]
                  focus:shadow-[0_0_0_3px_rgba(75,124,243,0.12)]
                  disabled:opacity-50 transition-all duration-150
                "
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="
                    w-full bg-white/[0.04] border border-white/[0.08] rounded-xl
                    px-4 py-3 pr-11 text-sm text-white placeholder-slate-600
                    focus:outline-none focus:border-primary/50 focus:bg-white/[0.06]
                    focus:shadow-[0_0_0_3px_rgba(75,124,243,0.12)]
                    disabled:opacity-50 transition-all duration-150
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-3">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400 leading-snug">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="
                w-full mt-2 flex items-center justify-center gap-2
                bg-primary hover:bg-primary-light
                disabled:opacity-40 disabled:cursor-not-allowed
                text-white text-sm font-semibold
                py-3 rounded-xl
                shadow-[0_4px_14px_rgba(75,124,243,0.3)]
                hover:shadow-[0_4px_20px_rgba(75,124,243,0.45)]
                active:scale-[0.98] transition-all duration-150
              "
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-5">
          HomeServer Dashboard v1.0
        </p>
      </div>
    </div>
  );
}
