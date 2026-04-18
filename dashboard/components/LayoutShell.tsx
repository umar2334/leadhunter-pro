'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isLogin = path === '/login';

  if (isLogin) return <>{children}</>;

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}
