import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 bg-bg-surface overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>
    </div>
  );
}
