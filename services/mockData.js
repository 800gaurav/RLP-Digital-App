export const demoUser = {
  id: 'rlp-demo-member',
  fullName: 'RLP Admin',
  email: 'admin@rlp.com',
  voterId: 'RLP2024001',
  dob: '1972-03-02',
  gender: 'Male',
  address: 'Nagaur, Rajasthan',
  state: 'Rajasthan',
  district: 'Nagaur',
  city: 'Nagaur',
  pincode: '341001',
  role: 'admin',
  stampPadAccess: true,
  subscriptionStatus: 'active',
  createdAt: '2024-01-15T08:00:00.000Z',
};

export const demoOfficials = [
  {
    id: 'official-1',
    fullName: 'Hanuman Beniwal',
    designation: 'National Convenor',
    rank: 'national',
    state: 'Rajasthan',
    district: 'Nagaur',
    phone: '+91 90000 00001',
    email: 'office@rlpindia.org',
    contactVisible: true,
  },
  {
    id: 'official-2',
    fullName: 'Narayan Beniwal',
    designation: 'State President',
    rank: 'state',
    state: 'Rajasthan',
    district: 'Jaipur',
    phone: '+91 90000 00002',
    email: 'state@rlpindia.org',
    contactVisible: true,
  },
  {
    id: 'official-3',
    fullName: 'Sunita Chaudhary',
    designation: 'District Coordinator',
    rank: 'district',
    state: 'Rajasthan',
    district: 'Jodhpur',
    phone: '+91 90000 00003',
    email: 'jodhpur@rlpindia.org',
    contactVisible: false,
  },
];

export const demoTrainingVideos = [
  {
    id: 'training-1',
    title: 'Booth Level Membership Training',
    language: 'Hindi',
    duration: '12:45',
    thumbnailUrl: '',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Training module for local membership drives.',
  },
  {
    id: 'training-2',
    title: 'Digital Poster Campaign Basics',
    language: 'Hindi',
    duration: '08:30',
    thumbnailUrl: '',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'How to prepare and share approved campaign posters.',
  },
];

export const demoReels = [
  {
    id: 'reel-1',
    caption: 'Kisan Samman Sabha Highlights',
    mediaType: 'image',
    mediaUrl: '',
  },
  {
    id: 'reel-2',
    caption: 'Youth Wing Training',
    mediaType: 'image',
    mediaUrl: '',
  },
];

export const demoNotifications = [
  {
    id: 'notification-1',
    title: 'District meeting update',
    message: 'Rajasthan district coordinators meeting at 5 PM today.',
    priority: true,
    createdAt: new Date().toISOString(),
  },
];

export const demoTemplates = [
  { id: 'template-1', name: 'Rally Announcement', category: 'Rally', isPremium: false, accent: '#0F7B3E' },
  { id: 'template-2', name: 'Festival Greeting', category: 'Tyohaar', isPremium: true, accent: '#FFD700' },
  { id: 'template-3', name: 'Leadership Quote', category: 'Leadership', isPremium: true, accent: '#0B5D32' },
  { id: 'template-4', name: 'Membership Drive', category: 'Election 2024', isPremium: false, accent: '#1F2937' },
];

export const demoSubscription = {
  active: true,
  plan: 'premium',
  price: 99,
};

export const demoAdminStats = {
  users: 12480,
  pendingApprovals: 38,
  activeSubscriptions: 2140,
  reels: 86,
};
