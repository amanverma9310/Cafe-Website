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

/** Everything under /admin. The auth provider lives here so public visitors never call the auth API. */
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="home" element={<HomeContent />} />
          <Route path="pages" element={<PagesContent />} />
          <Route path="menu" element={<MenuItems />} />
          <Route path="categories" element={<Categories />} />
          <Route path="menus" element={<MenuDocuments />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="business" element={<Business />} />
          <Route path="hours" element={<Hours />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="settings" element={<SiteSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
