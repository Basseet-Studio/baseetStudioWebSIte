export type ProjectStatus = 'Coming Soon' | 'Live' | 'Completed' | 'Confidential' | 'MVP Proof of Concept' | 'Ready to Deliver'
export type AppType = 'mobile' | 'web'
export type GalleryType = 'mobile' | 'web'
export type Section = 'home' | 'projects' | 'services' | 'clients' | 'contact'
export type Lang = 'en' | 'ar'

export interface NavItem { label: string; url: string; i18nKey?: string }
export interface SocialLink { platform: string; url: string }
export interface Platform { name: string; icon: string; version?: string; link?: string }
export interface Testimonial { quote: string; author: string; role?: string }
export interface FAQ { question: string; answer: string }
export interface Feature { title: string; description: string; icon: string }
export interface ProcessStep { step: number; title: string; description: string }
export interface Result { metric: string; label: string }

export interface HeroSection {
  title: string
  subtitle: string
  cta_primary?: string
  cta_primary_link?: string
  cta_secondary?: string
}

export interface Project {
  name: string; slug: string; type: 'branded' | 'standard'; tagline: string; description: string
  icon?: string; iconClass?: string; color: string; gradient: string
  status: ProjectStatus; layoutVariant?: string
  fontHeading?: string; fontBody?: string; fontWeights?: string; gsapAnimation?: string
  appType?: AppType; brandName?: string; bgEffect?: string; bgFallbackGradient?: string
  hero: HeroSection; features?: Feature[]; platforms?: Platform[]; screenshots?: string[]
  galleryType?: GalleryType; testimonials?: Testimonial[]; faq?: FAQ[]
  tech?: string[]; navItems?: NavItem[]; navMetaItems?: NavItem[]
  links?: { ios?: string; android?: string; web?: string }
}

export interface TeamMember {
  name: string; role: string; bio?: string; image: string
  social?: SocialLink[]
}

export interface ClientLogo { name: string; logo: string; link?: string }

export interface Highlight { metric: string; label: string; icon?: string }

export interface ProjectSummary {
  name: string; slug: string; tagline: string; iconClass: string
  color: string; gradient: string; status: ProjectStatus
  platforms: Array<{ name: string; icon: string }>; features: string[]
}

export interface HomePageData {
  hero: {
    title: string; text: string
    buttons: Array<{ text: string; link: string; type: 'primary' | 'secondary' }>
    items: Array<{ icon: string; title: string; text: string }>
  }
  features: Array<{ icon: string; pretitle: string; title: string; text: string }>
  projects: ProjectSummary[]
  team: TeamMember[]
  clients: ClientLogo[]
  highlights: Highlight[]
  clouds: { enable: boolean; enableOnMobile: boolean }
}

export interface Service {
  id: string; title: string; icon: string
  shortDescription: string; fullDescription: string
  processSteps?: ProcessStep[]
}

export interface Client {
  id: string; name: string; logo?: string; industry: string; color: string
  tagline: string; shortDescription: string; fullDescription: string
  challenge: string; solution: string; results: Result[]
  features?: string[]; technologies?: string[]; testimonial?: Testimonial
  screenshots?: string[]; link?: string
}

export interface ProjectLinks {
  ios?: string
  android?: string
  web?: string
  app_store?: string
  play_store?: string
  waitlist?: string
  pro_signup?: string
  features?: string
  faq?: string
  contact?: string
  support?: string
  press?: string
  twitter?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  youtube?: string
  tiktok?: string
  github?: string
  [key: string]: string | undefined
}

export interface LinksData {
  social: Record<string, string>
  contact: { email: string; phone: string; whatsapp: string; whatsapp_link: string; address: string }
  forms: { contact_form_url: string }
  projects: Record<string, ProjectLinks>
}

export interface FooterData {
  links: Array<{ label: string; url: string; i18nKey?: string }>
  copyright: string
  social: Array<{ platform: string; icon: string; url: string }>
}
