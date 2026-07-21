export type ProjectStatus =
  | "Coming Soon"
  | "Live"
  | "Completed"
  | "Confidential"
  | "MVP Proof of Concept"
  | "Ready to Deliver";
export type AppType = "mobile" | "web";
export type GalleryType = "mobile" | "web";
export type Section = "home" | "projects" | "services" | "clients" | "contact";
export type Lang = "en" | "ar";

export interface NavItem {
  label: string;
  url: string;
  i18nKey?: string;
}
export interface SocialLink {
  platform: string;
  url: string;
}
export interface Platform {
  name: string;
  icon: string;
  version?: string;
  link?: string;
}
export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
}
export interface FAQ {
  question: string;
  answer: string;
}
export interface Feature {
  title: string;
  description: string;
  icon: string;
}
export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}
export interface Result {
  metric: string;
  label: string;
}

export interface HeroSection {
  title: string;
  subtitle: string;
  cta_primary?: string;
  cta_primary_link?: string;
  cta_secondary?: string;
}

export interface Project {
  name: string;
  slug: string;
  type: "branded" | "standard";
  tagline: string;
  description: string;
  icon?: string;
  iconClass?: string;
  color: string;
  gradient: string;
  status: ProjectStatus;
  layoutVariant?: string;
  fontHeading?: string;
  fontBody?: string;
  fontWeights?: string;
  gsapAnimation?: string;
  appType?: AppType;
  brandName?: string;
  bgEffect?: string;
  bgFallbackGradient?: string;
  hero: HeroSection;
  features?: Feature[];
  platforms?: Platform[];
  screenshots?: string[];
  galleryType?: GalleryType;
  testimonials?: Testimonial[];
  faq?: FAQ[];
  tech?: string[];
  navItems?: NavItem[];
  navMetaItems?: NavItem[];
  links?: { ios?: string; android?: string; web?: string };
  /** Client case-study ids that use this product. Single source of truth for client↔product links. */
  clientIds?: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image: string;
  social?: SocialLink[];
}

export interface ClientLogo {
  name: string;
  logo: string;
  link?: string;
}

export interface Highlight {
  metric: string;
  label: string;
  icon?: string;
}

export interface ProjectSummary {
  name: string;
  slug: string;
  tagline: string;
  iconClass: string;
  color: string;
  gradient: string;
  status: ProjectStatus;
  platforms: Array<{ name: string; icon: string }>;
  features: string[];
}

export interface HomePageData {
  hero: {
    title: string;
    text: string;
    buttons: Array<{
      text: string;
      link: string;
      type: "primary" | "secondary";
    }>;
    items: Array<{ icon: string; title: string; text: string }>;
  };
  features: Array<{
    icon: string;
    pretitle: string;
    title: string;
    text: string;
  }>;
  projects: ProjectSummary[];
  team: TeamMember[];
  clients: ClientLogo[];
  highlights: Highlight[];
  clouds: { enable: boolean; enableOnMobile: boolean };
}

// Service types — round 4 services expansion.
// Service is the lightweight card entry used by the /services index page.
// ServiceDetail is the full per-service payload used by /services/<slug>
// detail pages (mirrors the project page data shape: hero, sub-services,
// process, deliverables, tech stack, FAQ and optional metrics).
export interface Service {
  id: string;
  slug: string;
  title: string;
  icon: string;
  color: string;
  gradient: string;
  shortDescription: string;
  tagline?: string;
}

export interface ServiceSubItem {
  id: string;
  name: string;
  icon: string;
  desc: string;
  longDesc: string;
  bullets?: string[];
  image?: string;
  imageLabel?: string;
}

export interface ServiceDeliverable {
  title: string;
  description: string;
  icon?: string;
}

export interface ServiceProcess {
  number: string;
  title: string;
  desc: string;
  icon: string;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceMetric {
  value: string;
  label: string;
}

export interface ServiceDetail {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  color: string;
  gradient: string;
  icon: string;
  shortDescription: string;
  hero: {
    title: string;
    subtitle: string;
    cta_primary: string;
    cta_primary_link: string;
    cta_secondary?: string;
    cta_secondary_link?: string;
  };
  subServices: ServiceSubItem[];
  process: ServiceProcess[];
  deliverables: ServiceDeliverable[];
  tech: string[];
  faq: ServiceFaq[];
  metrics?: ServiceMetric[];
}
// end service types

export type ClientLayoutTemplate = 'showcase' | 'timeline' | 'stack';

export interface ClientStepMedia {
  src: string;
  type: 'image' | 'gif' | 'video';
  alt?: string;
}

export interface ClientStep {
  title: string;
  description: string;
  media?: ClientStepMedia;
}

export interface Client {
  id: string;
  name: string;
  layoutTemplate: ClientLayoutTemplate;
  steps: ClientStep[];
  logo?: string;
  industry?: string;
  serviceType?: string;
  color: string;
  tagline: string;
  shortDescription?: string;
  fullDescription?: string;
  challenge?: string;
  solution?: string;
  results?: Result[];
  features?: string[];
  technologies?: string[];
  testimonial?: Testimonial;
  screenshots?: string[];
  galleryType?: 'mobile' | 'web';
  link?: string;
}

export interface ClientsData {
  title: string;
  subtitle: string;
  description: string;
  clients: Client[];
}

export interface ProjectLinks {
  ios?: string;
  android?: string;
  web?: string;
  app_store?: string;
  play_store?: string;
  waitlist?: string;
  pro_signup?: string;
  features?: string;
  faq?: string;
  contact?: string;
  support?: string;
  press?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
  [key: string]: string | undefined;
}

export interface LinksData {
  social: Record<string, string>;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    whatsapp_link: string;
    address: string;
  };
  forms: { contact_form_url: string };
  projects: Record<string, ProjectLinks>;
}

export interface FooterData {
  links: Array<{ label: string; url: string; i18nKey?: string }>;
  copyright: string;
  social: Array<{ platform: string; icon: string; url: string }>;
}
