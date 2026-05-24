export interface PosterCustomization {
  name: string;
  mobile: string;
  designation: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

export interface PosterExportPayload {
  posterId: string;
  action: 'download' | 'share';
}

export interface PosterSubscriptionStatus {
  active: boolean;
  plan: 'free' | 'premium';
  price: number;
  monthlyDownloadLimit: number;
  downloadsUsed: number;
  downloadsRemaining: number;
  categories: string[];
}
