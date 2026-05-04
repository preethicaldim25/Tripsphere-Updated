export interface Accommodation {
  name: string;
  price: string;
  address: string;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
}

export interface FoodPlace {
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  reviews: number;
  mustTry: string;
  lat: number;
  lng: number;
}

export interface Attraction {
  name: string;
  description: string;
  time: string;
  fee: string;
  image: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

export interface CityData {
  id: string; // Add id
  name: string;
  tagline: string;
  rating: number;
  distance: string;
  image: string;
  description: string;
  bestTime: string;
  howToReach: string;
  accommodation: Accommodation[];
  food: {
    veg: FoodPlace[];
    nonVeg: FoodPlace[];
  };
  attractions: Attraction[];
  tips: string[];
  itinerary: ItineraryDay[];
}

export const CITIES_DATA: Record<string, CityData> = {
  Chennai: {
    id: 'Chennai',
    name: 'Chennai',
    tagline: 'The Cultural Capital',
    rating: 4.4,
    distance: 'Capital City',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1080&auto=format&fit=crop',
    description: 'Chennai, formerly Madras, is the capital of Tamil Nadu and a vibrant metropolis blending ancient traditions with modern development.',
    bestTime: 'November to February (Winter)',
    howToReach: 'By Air: Chennai International Airport (MAA) | By Rail: Chennai Central, Egmore | By Road: Well-connected by NH',
    accommodation: [
      { name: 'Taj Coromandel', price: '₹12,000/night', address: 'Nungambakkam', rating: 4.8, reviews: 2345, lat: 13.0604, lng: 80.2425 },
      { name: 'ITC Grand Chola', price: '₹15,000/night', address: 'Guindy', rating: 4.9, reviews: 3120, lat: 13.0067, lng: 80.2265 },
    ],
    food: {
      veg: [
        { name: 'Murugan Idli Shop', cuisine: 'South Indian', address: 'T Nagar', rating: 4.6, reviews: 5432, mustTry: 'Idli, Vada, Filter Coffee', lat: 13.0429, lng: 80.2354 },
        { name: 'Sangeetha Veg Restaurant', cuisine: 'South Indian', address: 'Anna Nagar', rating: 4.5, reviews: 4321, mustTry: 'Masala Dosa, Thali', lat: 13.0876, lng: 80.2224 },
      ],
      nonVeg: [
        { name: 'Anjappar', cuisine: 'Chettinad', address: 'T Nagar', rating: 4.7, reviews: 6543, mustTry: 'Chettinad Chicken, Mutton Biryani', lat: 13.0409, lng: 80.2425 },
        { name: 'Buhari Hotel', cuisine: 'Mughlai', address: 'Mount Road', rating: 4.6, reviews: 5432, mustTry: 'Chicken 65, Biryani', lat: 13.0744, lng: 80.2639 },
      ],
    },
    attractions: [
      { name: 'Marina Beach', description: 'Second longest urban beach in the world', time: '2-3 hours', fee: 'Free', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=1080&auto=format&fit=crop' },
      { name: 'Kapaleeshwarar Temple', description: 'Ancient temple in Mylapore', time: '1-2 hours', fee: 'Free', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1080&auto=format&fit=crop' },
      { name: 'Mahabalipuram', description: 'Ancient rock-cut temples', time: 'Half Day', fee: '₹40', image: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=1080&auto=format&fit=crop' }
    ],
    tips: [
      'Start your day with authentic filter coffee',
      'Visit Marina Beach early morning for sunrise',
      'Use Metro for convenient travel',
    ],
    itinerary: [
      { day: 1, title: 'Beach Day & Heritage Walk', activities: ['Morning walk at Marina Beach', 'Breakfast at Murugan Idli Shop', 'Visit Kapaleeshwarar Temple'] },
      { day: 2, title: 'Cultural & Shopping', activities: ['Breakfast at Sangeetha', 'Visit Fort St. George', 'Shopping at T Nagar'] },
    ],
  },
  Coimbatore: {
    id: 'Coimbatore',
    name: 'Coimbatore',
    tagline: 'Manchester of South India',
    rating: 4.3,
    distance: 'Industrial Hub',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1080&auto=format&fit=crop',
    description: 'Coimbatore is a major industrial city known for its textile industries, engineering firms, and pleasant climate. It acts as the gateway to the Nilgiris.',
    bestTime: 'October to March',
    howToReach: 'By Air: Coimbatore International Airport (CJB) | By Rail: Coimbatore Junction | By Road: NH-47, NH-209',
    accommodation: [
      { name: 'Vivanta Coimbatore', price: '₹8,000/night', address: 'Race Course', rating: 4.7, reviews: 1890, lat: 11.0168, lng: 76.9558 },
      { name: 'The Residency', price: '₹5,000/night', address: 'Avinashi Road', rating: 4.5, reviews: 2340, lat: 11.0208, lng: 76.9658 },
    ],
    food: {
      veg: [
        { name: 'Anandhas', cuisine: 'South Indian', address: 'RS Puram', rating: 4.6, reviews: 3456, mustTry: 'Ghee Roast, Pongal', lat: 11.0148, lng: 76.9458 },
        { name: 'Sree Annapoorna', cuisine: 'South Indian', address: 'Gandhipuram', rating: 4.7, reviews: 5678, mustTry: 'Idly, Vada, Chutney', lat: 11.0188, lng: 76.9758 },
      ],
      nonVeg: [
        { name: 'Anjappar', cuisine: 'Chettinad', address: 'RS Puram', rating: 4.6, reviews: 4567, mustTry: 'Chettinad Chicken, Mutton Biryani', lat: 11.0148, lng: 76.9458 },
        { name: 'Valarmathi Mess', cuisine: 'Kongu', address: 'Gandhipuram', rating: 4.5, reviews: 2345, mustTry: 'Kongu Chicken, Mutton Chukka', lat: 11.0188, lng: 76.9758 },
      ],
    },
    attractions: [
      { name: 'Marudamalai Temple', description: 'Ancient hill temple dedicated to Lord Murugan', time: '2-3 hours', fee: 'Free', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1080&auto=format&fit=crop' },
      { name: 'VOC Park', description: 'Zoo and amusement park', time: '3-4 hours', fee: '₹30', image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?q=80&w=1080&auto=format&fit=crop' },
    ],
    tips: [
      'Visit Marudamalai Temple early morning to avoid crowds',
      'Try local Kovai snacks like mushroom fry',
      'Book Ooty trips from here directly',
    ],
    itinerary: [
      { day: 1, title: 'City Tour', activities: ['Morning at Marudamalai Temple', 'Breakfast at Annapoorna', 'Shopping at RS Puram', 'Evening at VOC Park'] },
      { day: 2, title: 'Day Trip to Ooty', activities: ['Early morning drive to Ooty', 'Tea garden visit', 'Ooty Lake boating', 'Return by evening'] },
    ],
  },
  Madurai: {
    id: 'Madurai',
    name: 'Madurai',
    tagline: 'The City that Never Sleeps',
    rating: 4.8,
    distance: 'Cultural Heart',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1080&auto=format&fit=crop',
    description: 'Madurai, the cultural capital of Tamil Nadu, is built around the intricately carved Meenakshi Amman Temple. It has a rich heritage of over 2500 years.',
    bestTime: 'October to March',
    howToReach: 'By Air: Madurai Airport (IXM) | By Rail: Madurai Junction | By Road: NH-44',
    accommodation: [
      { name: 'Heritage Madurai', price: '₹9,500/night', address: 'Kochadai', rating: 4.7, reviews: 1420, lat: 9.9405, lng: 78.1065 },
      { name: 'The Gateway Hotel', price: '₹6,000/night', address: 'Pasumalai', rating: 4.5, reviews: 1850, lat: 9.8972, lng: 78.0963 },
    ],
    food: {
      veg: [
        { name: 'Sree Sabarees', cuisine: 'South Indian', address: 'Town Hall Road', rating: 4.5, reviews: 4210, mustTry: 'Idiyappam, Dosa', lat: 9.9200, lng: 78.1150 },
      ],
      nonVeg: [
        { name: 'Kumar Mess', cuisine: 'Madurai Special', address: 'Tallakulam', rating: 4.8, reviews: 5210, mustTry: 'Mutton Chukka, Kari Dosa', lat: 9.9325, lng: 78.1350 },
        { name: 'Amma Mess', cuisine: 'South Indian Meat', address: 'Anna Nagar', rating: 4.6, reviews: 3100, mustTry: 'Bone Roast, Ayirai Meen', lat: 9.9213, lng: 78.1402 },
      ],
    },
    attractions: [
      { name: 'Meenakshi Temple', description: 'Historic Hindu temple with stunning gopurams', time: '3-4 hours', fee: 'Free (Special Darshan ₹50)', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=1080&auto=format&fit=crop' },
      { name: 'Thirumalai Nayakkar Mahal', description: '17th-century palace', time: '1.5 hours', fee: '₹10', image: 'https://images.unsplash.com/photo-1590074211438-6623668383e7?q=80&w=1080&auto=format&fit=crop' },
    ],
    tips: [
      'Jigarthanda is an absolute must-try',
      'Visit the temple in the early morning and late evening',
      'Expect humid weather year round'
    ],
    itinerary: [
      { day: 1, title: 'Temple Run', activities: ['Dawn visit to Meenakshi Temple', 'Breakfast of Kari Dosa', 'Evening Mahal Sound & Light show'] }
    ]
  },
  Ooty: {
    id: 'Ooty',
    name: 'Ooty',
    tagline: 'Queen of Hill Stations',
    rating: 4.7,
    distance: 'Hill Station',
    image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1080&auto=format&fit=crop',
    description: 'Ooty is a resort town in the Western Ghats mountains known for its tea gardens, pleasant climate, and the historic Nilgiri Mountain Railway.',
    bestTime: 'April to June and September to November',
    howToReach: 'By Air: Fly to Coimbatore then drive | By Rail: Mettupalayam then Toy Train',
    accommodation: [
      { name: 'Savoy', price: '₹14,000/night', address: 'Sylks Road', rating: 4.8, reviews: 2100, lat: 11.4116, lng: 76.6967 },
      { name: 'Sterling Ooty Fern Hill', price: '₹6,500/night', address: 'Fern Hill', rating: 4.4, reviews: 3200, lat: 11.3965, lng: 76.6859 },
    ],
    food: {
      veg: [
        { name: 'Adayar Ananda Bhavan', cuisine: 'South & North Indian', address: 'Commercial Road', rating: 4.2, reviews: 4500, mustTry: 'Mini Tiffin', lat: 11.4100, lng: 76.7000 },
      ],
      nonVeg: [
        { name: 'Earls Secret', cuisine: 'Continental & Indian', address: 'King\'s Cliff', rating: 4.6, reviews: 1800, mustTry: 'Brownies, Steaks', lat: 11.4250, lng: 76.7120 },
      ],
    },
    attractions: [
      { name: 'Botanical Gardens', description: 'Lush gardens laid out in 1848', time: '2 hours', fee: '₹30', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1080&auto=format&fit=crop' },
      { name: 'Ooty Lake', description: 'Artificial lake offering boating', time: '2 hours', fee: '₹15 (Boating extra)', image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?q=80&w=1080&auto=format&fit=crop' },
      { name: 'Doddabetta Peak', description: 'Highest mountain in the Nilgiri Hills', time: '1.5 hours', fee: '₹10', image: 'https://images.unsplash.com/photo-1571216332002-282dce467b32?q=80&w=1080&auto=format&fit=crop' },
    ],
    tips: [
      'Carry warm clothing even in summer',
      'Book Toy Train tickets months in advance',
      'Buy homemade chocolates and local tea'
    ],
    itinerary: [
      { day: 1, title: 'Lakes and Gardens', activities: ['Boating at Ooty Lake', 'Botanical Garden visit', 'Shopping at Commercial Road'] },
      { day: 2, title: 'Peaks and Valleys', activities: ['Sunrise at Doddabetta', 'Tea factory visit', 'Pine forest walk'] }
    ]
  }
};