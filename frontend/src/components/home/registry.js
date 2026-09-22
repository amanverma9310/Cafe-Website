import AboutSection from './AboutSection.jsx';
import DishMoments from './DishMoments.jsx';
import { DietaryMenus, FeaturedMenu } from './MenuTeasers.jsx';
import { AmbienceSection, CtaSection, ReviewsAndHours, VisitSection, WhyChoose } from './MoreSections.jsx';
import ReelSection from './ReelSection.jsx';

export const SECTION_COMPONENTS = {
  about: AboutSection, featuredMenu: FeaturedMenu, dietaryMenus: DietaryMenus, featuredDishes: DishMoments,
  ambience: AmbienceSection, reel: ReelSection, whyChoose: WhyChoose, reviews: ReviewsAndHours, visit: VisitSection, cta: CtaSection,
};
