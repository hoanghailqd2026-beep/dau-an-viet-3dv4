export type RankingLevel = 'Special National' | 'National' | 'City';

export type HeritageType = 'Architecture' | 'History' | 'Archaeology' | 'Scenic';

export type ConservationStatus = 'Good' | 'Needs Conservation' | 'Under Restoration';

export interface VN2000Coordinate {
  x: number; // Northing (m)
  y: number; // Easting (m)
  zone: '3_degree' | '6_degree';
  centralMeridian: string; // e.g., "105°45'"
}

export interface WGS84Coordinate {
  lat: number;
  lng: number;
}

export interface AddressInfo {
  houseNumber: string;
  street: string;
  ward: string;
  district: string;
  city: string;
}

export interface HistoryMilestone {
  year: string;
  event: string;
}

export interface AudioGuideContent {
  title: string;
  duration: string;
  transcript: string;
  audioUrl?: string;
}

export interface ExpertReview {
  id: string;
  reviewerName: string;
  title: string;
  organization: string;
  ratingScore: number;
  comment: string;
  verdict: 'approved' | 'revision_requested';
  timestamp: string;
}

export interface HeritageSite {
  id: string;
  officialName: string;
  folkName: string;
  identifierCode: string;
  rankingLevel: RankingLevel;
  type: HeritageType;
  gps: WGS84Coordinate;
  vn2000: VN2000Coordinate;
  address: AddressInfo;
  
  // History & Chronology
  summary: string;
  chronology: string;
  commencementYear: number;
  architect: string;
  milestones: HistoryMilestone[];

  // Architecture & Conservation
  architecturalStyle: string;
  conservationStatus: ConservationStatus;
  conservationNotes: string;
  materials: string[];
  dimensionsDescription?: string;

  // Multimedia
  photos: string[];
  has3D: boolean;
  model3DType?: 'photogrammetry' | 'lidar' | 'bim_cad';
  model3DUrl?: string;
  hasVR360: boolean;
  audioGuide: {
    vn: AudioGuideContent;
    en: AudioGuideContent;
    fr: AudioGuideContent;
  };

  // Tourist Information
  openingHours: string;
  ticketPrices: string;
  regulations: string[];
  managementUnit: string;

  // Administration & Appraisal
  dossierStatus: 'draft' | 'district_submitted' | 'expert_review' | 'approved_published';
  visibility?: 'published' | 'hidden';
  decisionDecreeNumber?: string;
  submittedByUnit: string;
  expertReviews: ExpertReview[];
  updatedAt: string;

  // Canonical default media & 3D metadata embedded in heritageData.ts
  photoCaptionsByLang?: HeritagePhotoCaptionSet;
  config3D?: HeritageSite3DDefaultConfig;

  // On-site Physical Signage
  signage?: {
    installed: boolean;
    installedByUnit?: string;
    installedYear?: number | string;
    material?: string;
  };
}

export interface HeritagePhotoCaptionSet {
  vi: [string, string];
  en: [string, string];
  zh: [string, string];
}

export interface HeritageSite3DDefaultConfig {
  mode: 'glb_only' | 'interactive_3d_museum';
  glbUrl: string;
  scale: number;
  rotationY: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  hotspots: HeritageHotspotFeature[];
}

export type BaseMapMode = 'admin' | 'satellite' | 'historical_1815' | 'historical_1898' | 'historical_1966';

export interface HeritageHotspotFeature {
  id: string;
  name: string;
  description: string;
  cameraPos: [number, number, number];
  targetPos: [number, number, number];
  thumbnailUrl: string;
}

export interface TourRoute {
  id: string;
  title: string;
  subtitle: string;
  region?: string;
  colorHex?: string;
  theme: string;
  estimatedDuration: string;
  distanceKm: number;
  sites: string[]; // HeritageSite ids
  description: string;
  highlights: string[];
}
