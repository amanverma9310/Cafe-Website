import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { GalleryImage } from '../models/GalleryImage.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { MenuDocument } from '../models/MenuDocument.js';
import { MenuItem } from '../models/MenuItem.js';
import { Review } from '../models/Review.js';
import { send } from '../utils/helpers.js';

export async function overview(_req, res) {
  const [menuItems, categories, gallery, enquiries, unread, featured, reviews, menus, recent] = await Promise.all([
    MenuItem.countDocuments(),
    MenuCategory.countDocuments(),
    GalleryImage.countDocuments(),
    ContactEnquiry.countDocuments(),
    ContactEnquiry.countDocuments({ isRead: false }),
    MenuItem.countDocuments({ featured: true }),
    Review.countDocuments(),
    MenuDocument.countDocuments(),
    ContactEnquiry.find().sort({ createdAt: -1 }).limit(5),
  ]);
  send(res, { counts: { menuItems, categories, gallery, enquiries, unread, featured, reviews, menus }, recentEnquiries: recent });
}
