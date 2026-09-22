import { Link } from 'react-router-dom';
import { Building2, Clock, Images, Inbox, Plus, Star, Tags, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { dashboardApi } from '../../services/index.js';
import { dateTime } from '../../utils/format.js';
import { Badge, Card, ErrorPanel, Loading, PageHeader } from '../../components/admin/ui/kit.jsx';

const STATS = [
  { key: 'menuItems', label: 'Menu items', to: '/admin/menu', icon: UtensilsCrossed },
  { key: 'categories', label: 'Categories', to: '/admin/categories', icon: Tags },
  { key: 'gallery', label: 'Gallery photos', to: '/admin/gallery', icon: Images },
  { key: 'reviews', label: 'Reviews', to: '/admin/reviews', icon: Star },
  { key: 'enquiries', label: 'Enquiries', to: '/admin/enquiries', icon: Inbox },
  { key: 'featured', label: 'Featured dishes', to: '/admin/menu', icon: Star },
];
const ACTIONS = [
  { to: '/admin/menu', label: 'Add a dish', icon: Plus },
  { to: '/admin/gallery', label: 'Upload photos', icon: Images },
  { to: '/admin/hours', label: 'Update opening hours', icon: Clock },
  { to: '/admin/business', label: 'Edit business details', icon: Building2 },
];

export default function Dashboard() {
  const { admin } = useAuth();
  const { data, loading, error, reload } = useAsync(() => dashboardApi.overview(), []);
  return (
    <>
      <PageHeader title={`Welcome back, ${admin?.name?.split(' ')[0] || 'there'}`} description="A quick look at your website content and the latest enquiries." />
      {loading ? <Loading /> : error ? <ErrorPanel error={error} onRetry={reload} /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {STATS.map((s) => (
              <Link key={s.key} to={s.to} className="group">
                <Card className="p-5 transition group-hover:border-emerald-600">
                  <div className="flex items-center justify-between text-stone-500"><span className="text-sm font-medium">{s.label}</span><s.icon className="size-4" aria-hidden="true" /></div>
                  <p className="mt-3 text-3xl font-bold text-stone-900">{data.counts[s.key]}</p>
                  {s.key === 'enquiries' && data.counts.unread ? <Badge tone="red" className="mt-2">{data.counts.unread} unread</Badge> : null}
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card className="p-5">
              <h2 className="font-semibold">Quick actions</h2>
              <ul className="mt-3 space-y-1">
                {ACTIONS.map((a) => <li key={a.to + a.label}><Link to={a.to} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"><a.icon className="size-4 text-emerald-800" aria-hidden="true" />{a.label}</Link></li>)}
              </ul>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Recent enquiries</h2><Link to="/admin/enquiries" className="text-sm font-medium text-emerald-800 hover:underline">View all</Link></div>
              {data.recentEnquiries.length === 0 ? <p className="py-8 text-center text-sm text-stone-500">No enquiries yet. They’ll show up here when guests use the contact form.</p> : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {data.recentEnquiries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{!e.isRead ? <span className="mr-2 inline-block size-2 rounded-full bg-red-600" aria-label="Unread" /> : null}{e.name} <span className="font-normal text-stone-500">· {e.enquiryType}</span></p><p className="truncate text-sm text-stone-500">{e.message}</p></div>
                      <div className="shrink-0 text-right"><Badge tone={e.status === 'resolved' ? 'green' : 'amber'}>{e.status}</Badge><p className="mt-1 text-xs text-stone-400">{dateTime(e.createdAt)}</p></div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
