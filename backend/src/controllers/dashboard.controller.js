import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuDocument } from '../models/MenuDocument.js';
import { MenuItem } from '../models/MenuItem.js';
import { Review } from '../models/Review.js';
import { Visit } from '../models/Visit.js';
import { send } from '../utils/helpers.js';

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0, 10);

/** Builds the last `days` calendar days (oldest first) as zeroed buckets, e.g. for a 7-day trend chart. */
function emptyDayBuckets(days) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: isoDate(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
  });
}

export async function overview(_req, res) {
  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    menuItems, categories, gallery, enquiries, unread, featured, reviews, menus, recent,
    visitsTotal, visitsToday, recentVisits, uniqueVisitorHashes,
  ] = await Promise.all([
    MenuItem.countDocuments(),
    MenuCategory.countDocuments(),
    GalleryImage.countDocuments(),
    ContactEnquiry.countDocuments(),
    ContactEnquiry.countDocuments({ isRead: false }),
    MenuItem.countDocuments({ featured: true }),
    Review.countDocuments(),
    MenuDocument.countDocuments(),
    ContactEnquiry.find().sort({ createdAt: -1 }).limit(5),
    Visit.countDocuments(),
    Visit.countDocuments({ createdAt: { $gte: today } }),
    Visit.find({ createdAt: { $gte: sevenDaysAgo } }, { createdAt: 1 }),
    Visit.distinct('visitorHash', { createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  const last7Days = emptyDayBuckets(7);
  const indexByDate = new Map(last7Days.map((d, i) => [d.date, i]));
  recentVisits.forEach((v) => {
    const idx = indexByDate.get(isoDate(v.createdAt));
    if (idx !== undefined) last7Days[idx].count += 1;
  });

  send(res, {
    counts: { menuItems, categories, gallery, enquiries, unread, featured, reviews, menus },
    recentEnquiries: recent,
    visits: { total: visitsTotal, today: visitsToday, uniqueVisitors: uniqueVisitorHashes.length, last7Days },
  });
}
