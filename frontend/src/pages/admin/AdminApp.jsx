import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.jsx';

import AdminLayout from './AdminLayout.jsx';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import MenuItems from './MenuItems.jsx';
import Categories from './Categories.jsx';
import MenuDocuments from './MenuDocuments.jsx';
import Gallery from './Gallery.jsx';
import Reviews from './Reviews.jsx';
import Business from './Business.jsx';
import Hours from './Hours.jsx';
import Enquiries from './Enquiries.jsx';
import SiteSettings from './SiteSettings.jsx';
import Profile from './Profile.jsx';
import HomeContent from './HomeContent.jsx';
import PagesContent from './PagesContent.jsx';

/**
 * Everything under /admin.
 * AuthProvider is kept here so normal website visitors
 * do not unnecessarily call the admin authentication API.
 */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin login */}
        <Route path="login" element={<Login />} />

        {/* Protected admin pages */}
        <Route element={<AdminLayout />}>
          {/* /admin -> /admin/dashboard */}
          <Route
            index
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route path="dashboard" element={<Dashboard />} />

          {/* Content */}
          <Route path="home" element={<HomeContent />} />
          <Route path="pages" element={<PagesContent />} />
          <Route path="menu" element={<MenuItems />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menus" element={<MenuDocuments />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="reviews" element={<Reviews />} />

          {/* Cafe information */}
          <Route path="business" element={<Business />} />
          <Route path="hours" element={<Hours />} />
          <Route path="enquiries" element={<Enquiries />} />

          {/* Website/admin settings */}
          <Route path="settings" element={<SiteSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Keep this visible while debugging incorrect admin URLs */}
        <Route
          path="*"
          element={
            <div className="grid min-h-screen place-items-center bg-stone-50 px-6">
              <div className="max-w-md text-center">
                <h1 className="text-2xl font-bold text-stone-900">
                  Admin page not found
                </h1>

                <p className="mt-3 text-sm text-stone-600">
                  The admin URL you opened does not exist.
                </p>

                <a
                  href="/admin/dashboard"
                  className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-800 px-5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  Go to Dashboard
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </AuthProvider>
  );
}