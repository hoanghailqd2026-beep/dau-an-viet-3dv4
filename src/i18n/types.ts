export type Language = 'vi' | 'en' | 'zh';

export interface LocalizedString {
  vi: string;
  en: string;
  zh?: string;
}

export interface HotspotTranslation {
  id: string;
  name: string;
  description: string;
}

export interface SiteTranslation {
  officialName: string;
  folkName: string;
  summary: string;
  chronology: string;
  architect: string;
  architecturalStyle: string;
  conservationNotes: string;
  materials: string[];
  dimensionsDescription?: string;
  address?: {
    houseNumber: string;
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  photoCaptions?: string[];
  openingHours: string;
  ticketPrices: string;
  regulations: string[];
  managementUnit: string;
  milestones: Array<{ year: string; event: string }>;
  hotspots?: HotspotTranslation[];
}

export interface TourTranslation {
  title: string;
  subtitle: string;
  region?: string;
  theme: string;
  estimatedDuration: string;
  description: string;
  highlights: string[];
}
