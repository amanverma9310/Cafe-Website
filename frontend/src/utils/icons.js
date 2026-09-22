import { CalendarCheck, Coffee, Heart, Leaf, MapPin, Package, Salad, Sprout, Star, Utensils, WheatOff } from 'lucide-react';

export const ICON_MAP = {
  leaf: Leaf, 'wheat-off': WheatOff, salad: Salad, coffee: Coffee, package: Package, calendar: CalendarCheck,
  'map-pin': MapPin, sprout: Sprout, heart: Heart, star: Star, utensils: Utensils, 'leaf-heart': Heart,
};
export const iconFor = (name) => ICON_MAP[name] || Leaf;
