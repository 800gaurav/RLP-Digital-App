export interface PosterCustomization {
  name: string;
  mobile: string;
  email: string;
  designation: string;
  district: string;
  address: string;
  facebookInstagram: string;
  posterPhotoUri: string;
  layoutId: string;
  themeId: string;
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
