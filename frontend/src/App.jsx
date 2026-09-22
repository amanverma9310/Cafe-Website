import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteProvider } from './context/SiteContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Gallery from './pages/Gallery.jsx';
import Home from './pages/Home.jsx';
import MenuPage from './pages/Menu.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin dashboard is code-split so public visitors never download it.
const AdminApp = lazy(() => import('./pages/admin/AdminApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Suspense fallback={<div className="grid min-h-screen place-items-center text-stone-500">Loading…</div>}><AdminApp /></Suspense>} />
      <Route element={<SiteProvider><MainLayout /></SiteProvider>}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="dietary-menu" element={<MenuPage pageKey="dietary-menu" title="Dietary Menu" path="/dietary-menu" types={['dietary']} />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
