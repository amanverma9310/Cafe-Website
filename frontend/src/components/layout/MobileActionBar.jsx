import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';

const item = 'grid min-h-12 place-items-center gap-0.5 text-xs font-semibold text-fg';

export default function MobileActionBar() {
  const { business } = useSite();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_-20px_rgb(22_33_23/0.35)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        <a href={business?.phone ? `tel:${business.phone}` : undefined} className={item}><Phone className="size-4 text-accent" aria-hidden="true" /> Call</a>
        <Link to="/menu" className={`${item} border-x border-line`}><BookOpen className="size-4 text-accent" aria-hidden="true" /> Menu</Link>
        <a href={business?.links?.maps || undefined} target="_blank" rel="noreferrer noopener" className={item}><MapPin className="size-4 text-accent" aria-hidden="true" /> Directions</a>
      </div>
    </div>
  );
}
