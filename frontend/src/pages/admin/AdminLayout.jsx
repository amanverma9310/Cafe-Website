import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Building2, Clock, ExternalLink, FileText, Home, Images, Inbox, LayoutDashboard, LogOut, Menu as MenuIcon, Settings, Star, Tags, UserRound, UtensilsCrossed, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { enquiryApi } from '../../services/index.js';
import { cn } from '../../utils/cn.js';
import { Loading } from '../../components/admin/ui/kit.jsx';

const NAV = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { group: 'Content' },
  { to: 'home', label: 'Home page', icon: Home },
  { to: 'pages', label: 'Page banners & About', icon: FileText },
  { to: 'menu', label: 'Menu items', icon: UtensilsCrossed },
  { to: 'categories', label: 'Menu categories', icon: Tags },
  { to: 'menus', label: 'Dietary menus & PDFs', icon: BookOpen },
  { to: 'gallery', label: 'Gallery', icon: Images },
  { to: 'reviews', label: 'Reviews', icon: Star },
  { group: 'Cafe' },
  { to: 'business', label: 'Business information', icon: Building2 },
  { to: 'hours', label: 'Opening hours', icon: Clock },
  { to: 'enquiries', label: 'Enquiries', icon: Inbox, badge: true },
  { group: 'Website' },
  { to: 'settings', label: 'Site settings', icon: Settings },
  { to: 'profile', label: 'My profile', icon: UserRound },
];

export default function AdminLayout() {
  const { status, admin, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const unread = useAsync(() => enquiryApi.list({ limit: 1 }), [location.pathname], { enabled: status === 'authed' });
  const unreadCount = unread.data?.meta?.unread || 0;

  useEffect(() => { document.documentElement.classList.remove('public'); setOpen(false); }, [location.pathname]);

  if (status === 'loading') return <div className="admin-ui min-h-screen bg-stone-50"><Loading label="Checking your session…" /></div>;
  if (status === 'guest') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col overflow-y-auto px-3 py-5">
      <Link to="/admin/dashboard" className="mb-6 flex items-center gap-2 px-3 text-lg font-bold text-emerald-900">
        <span className="grid size-8 place-items-center rounded-lg bg-emerald-800 text-white">A</span> Agama admin
      </Link>
      <ul className="space-y-0.5">
        {NAV.map((n, i) => n.group ? (
          <li key={n.group} className={cn('px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-400', i && 'pt-5')}>{n.group}</li>
        ) : (
          <li key={n.to}>
            <NavLink to={n.to} className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition', isActive ? 'bg-emerald-100 text-emerald-900' : 'text-stone-700 hover:bg-stone-200/60')}>
              <n.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{n.label}</span>
              {n.badge && unreadCount ? <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white" aria-label={`${unreadCount} unread`}>{unreadCount}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="admin-ui min-h-screen bg-stone-50 text-stone-900">
      <Helmet><title>Admin | Agama Cafe & Bar</title><meta name="robots" content="noindex, nofollow" /></Helmet>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-white lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-stone-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar}</aside>
        </div>
      ) : null}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button type="button" className="grid size-10 place-items-center rounded-lg hover:bg-stone-100 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X className="size-5" /> : <MenuIcon className="size-5" />}</button>
          <div className="hidden text-sm text-stone-500 lg:block">Signed in as <span className="font-medium text-stone-800">{admin?.name}</span></div>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noreferrer noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100">View site <ExternalLink className="size-3.5" aria-hidden="true" /></a>
            <button type="button" onClick={logout} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"><LogOut className="size-4" aria-hidden="true" /> Sign out</button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
