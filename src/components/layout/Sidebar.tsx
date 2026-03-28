import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Layers, FileText, Settings, LogOut, Server } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/monitoring', icon: Activity, label: '모니터링' },
  { to: '/services', icon: Layers, label: '서비스' },
  { to: '/logs', icon: FileText, label: '로그' },
  { to: '/settings', icon: Settings, label: '설정' },
];

export default function Sidebar() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-20 lg:w-60 flex-shrink-0 bg-bg-dark border-r border-white/[0.06] flex flex-col h-screen sticky top-0">
      <div className="p-4 lg:p-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 bg-primary/15 rounded-lg flex items-center justify-center border border-primary/25 shrink-0">
          <Server className="w-4 h-4 text-primary" />
        </div>
        <span className="hidden lg:block font-semibold text-[15px] tracking-tight text-white">
          홈서버 <span className="text-primary font-bold">관리자</span>
        </span>
      </div>

      <nav className="flex-1 px-2 lg:px-3 mt-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0 mx-auto lg:mx-0" />
            <span className="hidden lg:block font-medium text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-2 lg:p-3 mt-auto space-y-3 border-t border-white/[0.06]">
        <div className="hidden lg:block px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">로그인 계정</p>
          <p className="text-xs text-slate-300 font-medium truncate">{username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-2.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/[0.04]"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:block font-medium text-sm">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
