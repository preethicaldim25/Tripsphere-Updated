export const images = {
  categories: {
    temple: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=500&auto=format&fit=crop',
    hillStation: 'https://images.unsplash.com/photo-1571216332002-282dce467b32?q=80&w=500&auto=format&fit=crop',
    beach: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&auto=format&fit=crop',
    heritage: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=500&auto=format&fit=crop',
    wildlife: 'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=500&auto=format&fit=crop',
    city: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&auto=format&fit=crop',
    nature: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?q=80&w=500&auto=format&fit=crop',
    waterfall: 'https://images.unsplash.com/photo-1592927946945-c98511f87bcc?q=80&w=500&auto=format&fit=crop',
  },

  destinations: {
    ooty: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1080&auto=format&fit=crop',
    kodaikanal: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1080&auto=format&fit=crop',
    madurai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1080&auto=format&fit=crop',
    chennai: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1080&auto=format&fit=crop',
    rameswaram: 'https://images.unsplash.com/photo-1587135941948-670b381f08ce?q=80&w=1080&auto=format&fit=crop',
    yercaud: 'https://images.unsplash.com/photo-1624886510372-f7311d2c6e6e?q=80&w=1080&auto=format&fit=crop',
    hogenakkal: 'https://images.unsplash.com/photo-1592927946945-c98511f87bcc?q=80&w=1080&auto=format&fit=crop',
    kolli: 'https://images.unsplash.com/photo-1516646255117-f9f933680173?q=80&w=1080&auto=format&fit=crop',
    coimbatore: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1080&auto=format&fit=crop',
    mahabalipuram: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=1080&auto=format&fit=crop',
  },

  placeholders: {
    travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop',
    nature: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop',
  },

  profile: {
    avatar: 'https://images.unsplash.com/photo-1494790108777-385fd4a3b8b4?q=80&w=200&auto=format&fit=crop',
  },
};

export const getCategoryImage = (category: string | null | undefined): string => {
  if (!category) return images.placeholders.travel;
  const cat = category.toLowerCase();
  if (cat.includes('temple')) return images.categories.temple;
  if (cat.includes('hill')) return images.categories.hillStation;
  if (cat.includes('beach') || cat.includes('coastal')) return images.categories.beach;
  if (cat.includes('heritage')) return images.categories.heritage;
  if (cat.includes('wildlife')) return images.categories.wildlife;
  if (cat.includes('city')) return images.categories.city;
  if (cat.includes('nature')) return images.categories.nature;
  if (cat.includes('waterfall')) return images.categories.waterfall;
  return images.placeholders.travel;
};

export const getDestinationImage = (name: string): string => {
  if (!name) return '';
  const n = name.toLowerCase();

  // Check for hardcoded images first
  if (n.includes('ooty')) return images.destinations.ooty;
  if (n.includes('kodai')) return images.destinations.kodaikanal;
  if (n.includes('madurai')) return images.destinations.madurai;
  if (n.includes('chennai')) return images.destinations.chennai;
  if (n.includes('rameswaram')) return images.destinations.rameswaram;
  if (n.includes('yercaud')) return images.destinations.yercaud;
  if (n.includes('hogenakkal')) return images.destinations.hogenakkal;
  if (n.includes('kolli')) return images.destinations.kolli;
  if (n.includes('coimbatore')) return images.destinations.coimbatore;
  if (n.includes('mahabalipuram')) return images.destinations.mahabalipuram;

  // We no longer use loremflickr as it looks unprofessional
  // Return empty string; the SmartImage component will handle the fallback UI
  return '';
};

export const getDynamicPlaceImage = (name: string, keywords?: string): string => {
  // We avoid random fallbacks now
  return '';
};

export const CATEGORY_THEMES: Record<string, { colors: [string, string], icon: string, vibe: string }> = {
  'hill station': { colors: ['#059669', '#0284C7'], icon: 'terrain', vibe: 'Peaceful' },
  'beach': { colors: ['#0891B2', '#22D3EE'], icon: 'waves', vibe: 'Relaxing' },
  'temple': { colors: ['#B45309', '#F59E0B'], icon: 'home-variant', vibe: 'Spiritual' },
  'heritage': { colors: ['#7C3AED', '#8B5CF6'], icon: 'bank', vibe: 'Historic' },
  'nature': { colors: ['#047857', '#10B981'], icon: 'leaf', vibe: 'Refreshing' },
  'city': { colors: ['#4338CA', '#6366F1'], icon: 'city-variant', vibe: 'Vibrant' },
  'waterfall': { colors: ['#1D4ED8', '#60A5FA'], icon: 'water', vibe: 'Pure' },
  'wildlife': { colors: ['#92400E', '#D97706'], icon: 'elephant', vibe: 'Wild' },
  'default': { colors: ['#1E293B', '#334155'], icon: 'map-marker', vibe: 'Adventure' }
};


