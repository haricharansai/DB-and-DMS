import { Category, Product, Vendor, User, Review } from '../types';

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat_electronics',
    name: 'Electronics & Audio',
    slug: 'electronics',
    iconName: 'Headphones',
    itemCount: 48,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    description: 'High-fidelity audio, wireless noise-canceling headphones & studio acoustics'
  },
  {
    id: 'cat_laptops',
    name: 'Laptops & Computing',
    slug: 'laptops',
    iconName: 'Laptop',
    itemCount: 36,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
    description: 'Workstations, ultrabooks, gaming rigs & high-performance processors'
  },
  {
    id: 'cat_smartphones',
    name: 'Smartphones & Wearables',
    slug: 'smartphones',
    iconName: 'Smartphone',
    itemCount: 52,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    description: 'Next-gen flagship smartphones, OLED smartwatches & fitness bands'
  },
  {
    id: 'cat_cameras',
    name: 'Cameras & Optics',
    slug: 'cameras',
    iconName: 'Camera',
    itemCount: 24,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    description: 'Full-frame mirrorless bodies, cinema lenses & 4K vlogging rigs'
  },
  {
    id: 'cat_gaming',
    name: 'Gaming & Accessories',
    slug: 'gaming',
    iconName: 'Gamepad2',
    itemCount: 42,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    description: 'Mechanical tactile keyboards, wireless gaming mice & custom keycaps'
  },
  {
    id: 'cat_workspace',
    name: 'Workspace & Ergonomics',
    slug: 'workspace',
    iconName: 'Armchair',
    itemCount: 30,
    image: 'https://images.unsplash.com/photo-1580481077197-2a44b1d6833c?w=600&auto=format&fit=crop&q=80',
    description: 'Motorized standing desks, ergonomic mesh chairs & ambient desk lamps'
  }
];

export const SEED_VENDORS: Vendor[] = [
  {
    id: 'v_soundcrafters',
    businessName: 'SoundCrafters Pro',
    ownerName: 'Vikram Mehta',
    email: 'contact@soundcrafters.io',
    phone: '+91 98201 44521',
    rating: 4.9,
    reviewsCount: 342,
    isVerified: true,
    status: 'approved',
    badge: 'Diamond Merchant',
    logo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    joinedDate: '2023-01-15',
    dispatchTime: 'Same Day Dispatch',
    city: 'Bengaluru, KA',
    kycDetails: {
      gstNumber: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      businessLicense: 'BL-BLR-2023-9901',
      documentUrl: 'https://marketnexus.io/docs/kyc-soundcrafters.pdf',
      submittedAt: '2023-01-14T10:00:00Z'
    },
    metrics: {
      totalRevenue: 4850000,
      totalOrders: 1420,
      fulfillmentRate: 99.4
    }
  },
  {
    id: 'v_nexuscomputing',
    businessName: 'Nexus Computing & Tech',
    ownerName: 'Ananya Sharma',
    email: 'support@nexuscomp.com',
    phone: '+91 98450 77890',
    rating: 4.8,
    reviewsCount: 512,
    isVerified: true,
    status: 'approved',
    badge: 'Top Rated Tech',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    joinedDate: '2022-11-20',
    dispatchTime: 'Ships within 24 hrs',
    city: 'Hyderabad, TS',
    kycDetails: {
      gstNumber: '36AAFCN4412K1Z9',
      panNumber: 'AAFCN4412K',
      businessLicense: 'BL-HYD-2022-4412',
      documentUrl: 'https://marketnexus.io/docs/kyc-nexus.pdf',
      submittedAt: '2022-11-18T14:30:00Z'
    },
    metrics: {
      totalRevenue: 9240000,
      totalOrders: 2180,
      fulfillmentRate: 98.9
    }
  },
  {
    id: 'v_opticsvision',
    businessName: 'Lumina Studio & Optics',
    ownerName: 'Rajesh Kulkarni',
    email: 'sales@luminastudio.in',
    phone: '+91 99100 88231',
    rating: 4.7,
    reviewsCount: 198,
    isVerified: true,
    status: 'approved',
    badge: 'Authorized Dealer',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    joinedDate: '2023-06-10',
    dispatchTime: '1-2 Business Days',
    city: 'Mumbai, MH',
    kycDetails: {
      gstNumber: '27AAACL9901M1Z2',
      panNumber: 'AAACL9901M',
      businessLicense: 'BL-MUM-2023-8821',
      documentUrl: 'https://marketnexus.io/docs/kyc-lumina.pdf',
      submittedAt: '2023-06-08T09:15:00Z'
    },
    metrics: {
      totalRevenue: 3410000,
      totalOrders: 640,
      fulfillmentRate: 97.8
    }
  },
  {
    id: 'v_ergohaven',
    businessName: 'ErgoHaven Workspace Solutions',
    ownerName: 'Priya Iyer',
    email: 'care@ergohaven.co',
    phone: '+91 98800 22345',
    rating: 4.85,
    reviewsCount: 276,
    isVerified: true,
    status: 'approved',
    badge: 'Ergonomics Choice',
    logo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    joinedDate: '2023-04-05',
    dispatchTime: 'Same Day Dispatch',
    city: 'Pune, MH',
    kycDetails: {
      gstNumber: '27AABCE5541L1Z0',
      panNumber: 'AABCE5541L',
      businessLicense: 'BL-PUN-2023-1102',
      documentUrl: 'https://marketnexus.io/docs/kyc-ergohaven.pdf',
      submittedAt: '2023-04-02T16:00:00Z'
    },
    metrics: {
      totalRevenue: 5120000,
      totalOrders: 980,
      fulfillmentRate: 99.1
    }
  },
  {
    id: 'v_pending_hypertech',
    businessName: 'HyperTech Innovations Ltd',
    ownerName: 'Deepak Verma',
    email: 'info@hypertech.tech',
    phone: '+91 97111 55667',
    rating: 0,
    reviewsCount: 0,
    isVerified: false,
    status: 'pending',
    badge: 'Under Review',
    logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    joinedDate: '2025-02-28',
    dispatchTime: 'Pending Review',
    city: 'Gurugram, HR',
    kycDetails: {
      gstNumber: '06AABCH7762J1Z8',
      panNumber: 'AABCH7762J',
      businessLicense: 'BL-GGN-2025-0044',
      documentUrl: 'https://marketnexus.io/docs/kyc-hypertech.pdf',
      submittedAt: '2025-02-28T11:20:00Z'
    }
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_wh1000xm5',
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    description: 'Industry-leading noise cancellation with 8 microphones and Auto NC Optimizer. Ultra-comfortable lightweight design with soft fit leather. Up to 30-hour battery life with quick charging (3 min charge for 3 hours playback). Crystal clear hands-free calling with 4 beamforming microphones.',
    price: 29990,
    originalPrice: 34990,
    discountPercentage: 14,
    category: 'electronics',
    brand: 'Sony',
    vendorId: 'v_soundcrafters',
    vendorName: 'SoundCrafters Pro',
    rating: 4.9,
    reviewsCount: 184,
    stock: 24,
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Midnight Black', 'Silver Grey', 'Midnight Blue'],
    isFeatured: true,
    isTrending: true,
    isFlashDeal: true,
    dealEndsInHours: 18,
    specs: {
      anc: 'Dual Processor V1 + HD QN1 (8 Mics)',
      battery: '30 Hours (ANC On) / 40 Hours (ANC Off)',
      codecs: 'LDAC, AAC, SBC, DSEE Extreme',
      weight: '250 grams',
      connectivity: 'Bluetooth 5.2, Multipoint Pair',
      warranty: '1 Year Brand Warranty',
      processor: 'Sony Integrated Processor V1'
    },
    tags: ['wireless', 'anc', 'audiophile', 'headphones', 'sony'],
    createdAt: '2024-01-10T12:00:00Z'
  },
  {
    id: 'prod_bose_qc45',
    title: 'Bose QuietComfort 45 Bluetooth Wireless Headphones',
    description: 'High-fidelity audio with proprietary TriPort acoustic architecture. Quiet and Aware modes allow you to toggle silence or hear ambient surroundings. Lightweight luxury with smooth pleatless ear cushions. 24 hours battery life per charge.',
    price: 24900,
    originalPrice: 29900,
    discountPercentage: 17,
    category: 'electronics',
    brand: 'Bose',
    vendorId: 'v_soundcrafters',
    vendorName: 'SoundCrafters Pro',
    rating: 4.7,
    reviewsCount: 142,
    stock: 18,
    thumbnail: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Triple Black', 'White Smoke', 'Eclipse Grey'],
    isFeatured: true,
    isTrending: false,
    specs: {
      anc: 'Acoustic Noise Cancelling (Quiet/Aware)',
      battery: '24 Hours Playback',
      codecs: 'AAC, SBC, TriPort Tech',
      weight: '240 grams',
      connectivity: 'Bluetooth 5.1 (Up to 9m)',
      warranty: '1 Year Bose India Warranty'
    },
    tags: ['bose', 'anc', 'travel', 'comfort'],
    createdAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'prod_airpods_max',
    title: 'Apple AirPods Max - Space Grey with Smart Case',
    description: 'Apple-designed dynamic driver delivers high-fidelity audio. Active Noise Cancellation with Transparency mode. Computational audio combines custom acoustic design with the Apple H1 chip and software. Knit-mesh canopy and memory foam ear cushions.',
    price: 54900,
    originalPrice: 59900,
    discountPercentage: 8,
    category: 'electronics',
    brand: 'Apple',
    vendorId: 'v_nexuscomputing',
    vendorName: 'Nexus Computing & Tech',
    rating: 4.8,
    reviewsCount: 96,
    stock: 12,
    thumbnail: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Space Grey', 'Silver', 'Sky Blue', 'Pink'],
    isFeatured: true,
    isTrending: true,
    specs: {
      anc: 'Apple Computational Audio ANC + Transparency',
      battery: '20 Hours with ANC & Spatial Audio',
      codecs: 'AAC, Apple Spatial Audio, Dolby Atmos',
      weight: '384.8 grams',
      connectivity: 'Bluetooth 5.0, Dual H1 Chips',
      warranty: '1 Year Apple Official Warranty'
    },
    tags: ['apple', 'airpods', 'spatial-audio', 'luxury'],
    createdAt: '2024-01-20T15:00:00Z'
  },
  {
    id: 'prod_macbook_pro_16',
    title: 'Apple MacBook Pro 16" (M3 Max, 36GB RAM, 1TB SSD)',
    description: 'Blazing-fast M3 Max chip with 14-core CPU and 30-core GPU. Liquid Retina XDR display with 1600 nits peak brightness. Up to 22 hours of battery life. Magic Keyboard with Touch ID, studio-quality three-mic array and six-speaker sound system.',
    price: 319900,
    originalPrice: 349900,
    discountPercentage: 9,
    category: 'laptops',
    brand: 'Apple',
    vendorId: 'v_nexuscomputing',
    vendorName: 'Nexus Computing & Tech',
    rating: 4.95,
    reviewsCount: 78,
    stock: 8,
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Space Black', 'Silver'],
    isFeatured: true,
    isTrending: true,
    specs: {
      display: '16.2" Liquid Retina XDR (3456x2234, 120Hz ProMotion)',
      processor: 'Apple M3 Max (14-core CPU, 30-core GPU)',
      ram: '36GB Unified Memory',
      storage: '1TB Superfast PCIe NVMe SSD',
      battery: '100Wh (Up to 22 hrs video playback)',
      weight: '2.16 kg',
      warranty: '1 Year Apple Care included'
    },
    tags: ['macbook', 'm3-max', 'pro-laptop', 'creator'],
    createdAt: '2024-02-15T11:00:00Z'
  },
  {
    id: 'prod_dell_xps_15',
    title: 'Dell XPS 15 9530 (Intel Core i9 13th Gen, 32GB, RTX 4070, 1TB)',
    description: 'Immersive 3.5K OLED InfinityEdge touch display with 100% DCI-P3 color gamut. Powered by Intel Core i9-13900H and NVIDIA GeForce RTX 4070 graphics. Precision crafted CNC machined aluminum with carbon fiber palm rest.',
    price: 245000,
    originalPrice: 279000,
    discountPercentage: 12,
    category: 'laptops',
    brand: 'Dell',
    vendorId: 'v_nexuscomputing',
    vendorName: 'Nexus Computing & Tech',
    rating: 4.75,
    reviewsCount: 64,
    stock: 10,
    thumbnail: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Platinum Silver', 'Frost White'],
    isFeatured: false,
    isTrending: true,
    specs: {
      display: '15.6" 3.5K OLED Touch (3456x2160, 400 nits)',
      processor: 'Intel Core i9-13900H (14 Cores, up to 5.4 GHz)',
      ram: '32GB DDR5 4800MHz Dual Channel',
      storage: '1TB M.2 PCIe NVMe Gen 4 SSD',
      battery: '86Wh 6-Cell Battery',
      weight: '1.92 kg',
      warranty: '2 Year Onsite Premier Support'
    },
    tags: ['dell', 'xps', 'oled', 'workstation', 'gaming'],
    createdAt: '2024-01-25T08:00:00Z'
  },
  {
    id: 'prod_galaxy_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra 5G (Titanium Gray, 512GB, 12GB RAM)',
    description: 'Galaxy AI is here. 200MP camera system with 5x optical zoom and 100x Space Zoom. Titanium frame with Corning Gorilla Armor. Embedded S Pen with instant notes and circle to search. Snapdragon 8 Gen 3 for Galaxy.',
    price: 139999,
    originalPrice: 149999,
    discountPercentage: 7,
    category: 'smartphones',
    brand: 'Samsung',
    vendorId: 'v_nexuscomputing',
    vendorName: 'Nexus Computing & Tech',
    rating: 4.88,
    reviewsCount: 210,
    stock: 15,
    thumbnail: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Titanium Gray', 'Titanium Black', 'Titanium Violet', 'Titanium Yellow'],
    isFeatured: true,
    isTrending: true,
    isFlashDeal: true,
    dealEndsInHours: 12,
    specs: {
      display: '6.8" Dynamic AMOLED 2X QHD+ (120Hz, 2600 nits)',
      processor: 'Snapdragon 8 Gen 3 for Galaxy (4nm)',
      ram: '12GB LPDDR5X',
      storage: '512GB UFS 4.0',
      camera: '200MP Main + 50MP Periscope + 12MP UltraWide + 10MP Tele',
      battery: '5000 mAh (45W Fast Charging)',
      weight: '232 grams',
      warranty: '1 Year Comprehensive Brand Warranty'
    },
    tags: ['samsung', 'galaxy-ai', 's24-ultra', 'flagship'],
    createdAt: '2024-02-10T14:00:00Z'
  },
  {
    id: 'prod_sony_a7iv',
    title: 'Sony Alpha 7 IV Full-Frame Mirrorless Camera (Body Only)',
    description: '33MP Exmor R back-illuminated CMOS sensor. BIONZ XR image processing engine with up to 8x processing power. Real-time Eye AF for human, animal, and birds in stills and movies. 4K 60p 10-bit 4:2:2 video recording with S-Cinetone color profile.',
    price: 219990,
    originalPrice: 242990,
    discountPercentage: 9,
    category: 'cameras',
    brand: 'Sony',
    vendorId: 'v_opticsvision',
    vendorName: 'Lumina Studio & Optics',
    rating: 4.9,
    reviewsCount: 88,
    stock: 6,
    thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Matte Black'],
    isFeatured: true,
    isTrending: false,
    specs: {
      display: '3.0" Vari-angle Touch LCD (1.03M dots)',
      processor: 'Dual BIONZ XR Processing Engine',
      camera: '33.0 MP Full-Frame Exmor R Sensor (ISO 50-204800)',
      connectivity: 'Dual Band Wi-Fi 5GHz, Bluetooth 5.0, USB-C 10Gbps',
      weight: '658 grams with battery',
      warranty: '2 Years Sony India Extended Warranty'
    },
    tags: ['sony', 'alpha', 'mirrorless', 'cinema-camera', '4k'],
    createdAt: '2024-01-18T09:00:00Z'
  },
  {
    id: 'prod_herman_miller_aeron',
    title: 'Herman Miller Aeron Ergonomic Office Chair (Graphite, Size B)',
    description: 'The benchmark for ergonomic seating. 8Z Pellicle breathable suspension membrane provides 8 zones of varied tension across seat and back. PostureFit SL adjustable sacral and lumbar support. Fully adjustable arms and harmonic tilt mechanism.',
    price: 118000,
    originalPrice: 135000,
    discountPercentage: 13,
    category: 'workspace',
    brand: 'Herman Miller',
    vendorId: 'v_ergohaven',
    vendorName: 'ErgoHaven Workspace Solutions',
    rating: 4.96,
    reviewsCount: 154,
    stock: 14,
    thumbnail: 'https://images.unsplash.com/photo-1580481077197-2a44b1d6833c?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1580481077197-2a44b1d6833c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Graphite Black', 'Mineral White', 'Carbon Grey'],
    isFeatured: true,
    isTrending: true,
    specs: {
      material: 'Recycled Ocean Bound Plastic & Die-Cast Aluminum',
      weight: '18.6 kg',
      warranty: '12 Year 24/7 Multi-Shift Herman Miller Warranty',
      connectivity: 'Harmonic 2 Tilt System with Forward Angle Limiter'
    },
    tags: ['herman-miller', 'ergonomic', 'office-chair', 'posture'],
    createdAt: '2024-01-05T08:00:00Z'
  },
  {
    id: 'prod_keychron_q1_pro',
    title: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard (Banana Tactile)',
    description: 'Full CNC machined 6063 aluminum body. Double-gasket mount design with sound absorbing foams. QMK/VIA programmable software. Connects up to 3 devices seamlessly via Bluetooth 5.1 or type-C wired mode. South-facing RGB backlighting with KSA double-shot PBT keycaps.',
    price: 18999,
    originalPrice: 21999,
    discountPercentage: 14,
    category: 'gaming',
    brand: 'Keychron',
    vendorId: 'v_nexuscomputing',
    vendorName: 'Nexus Computing & Tech',
    rating: 4.86,
    reviewsCount: 112,
    stock: 20,
    thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
    ],
    colors: ['Carbon Black', 'Silver Grey', 'Shell White'],
    isFeatured: false,
    isTrending: true,
    specs: {
      connectivity: 'Bluetooth 5.1 + Type-C Wired (1000Hz Polling)',
      battery: '4000 mAh (Up to 300 hrs RGB Off)',
      weight: '1.75 kg (Full Solid Metal)',
      material: 'CNC Aluminum Body + Brass/FR4 Plate',
      warranty: '1 Year Replacement Warranty'
    },
    tags: ['keychron', 'mechanical-keyboard', 'custom-rgb', 'qmk-via'],
    createdAt: '2024-02-12T16:30:00Z'
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'u_buyer_demo',
    name: 'Aarav Patel',
    email: 'buyer@marketnexus.io',
    role: 'buyer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    createdAt: '2024-01-01T00:00:00Z',
    savedAddresses: [
      {
        id: 'addr_1',
        fullName: 'Aarav Patel',
        phone: '+91 98765 43210',
        street: 'Flat 402, Skyline Residency, 100 Feet Rd, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560038',
        isDefault: true
      },
      {
        id: 'addr_2',
        fullName: 'Aarav Patel (Office)',
        phone: '+91 98765 43210',
        street: 'Tech Park 4, Outer Ring Road, Bellandur',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560103',
        isDefault: false
      }
    ]
  },
  {
    id: 'u_vendor_demo',
    name: 'Vikram Mehta (SoundCrafters)',
    email: 'vendor@marketnexus.io',
    role: 'vendor',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98201 44521',
    vendorId: 'v_soundcrafters',
    createdAt: '2023-01-15T00:00:00Z'
  },
  {
    id: 'u_admin_demo',
    name: 'Devika Singhania (Platform Admin)',
    email: 'admin@marketnexus.io',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+91 99999 11223',
    createdAt: '2022-01-01T00:00:00Z'
  }
];

export const SEED_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_wh1000xm5',
    userId: 'u_buyer_demo',
    userName: 'Aarav Patel',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Absolute game changer for flights and remote work!',
    comment: 'The noise cancellation is unmatched. Tested on an 8-hour flight and it eliminated engine drone completely. The multipoint connection seamlessly toggles between my MacBook and iPhone. Battery lasts for days.',
    createdAt: '2024-02-18T14:20:00Z',
    isVerifiedPurchase: true,
    helpfulCount: 42
  },
  {
    id: 'rev_2',
    productId: 'prod_wh1000xm5',
    userId: 'u_user_priya',
    userName: 'Priya Nambiar',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    title: 'Crisp audio and ultra comfortable for 6+ hours',
    comment: 'The earcups are butter soft. Even with glasses, there is zero pressure on the temples. Soundstage with LDAC enabled on Android is mind-blowing.',
    createdAt: '2024-02-22T09:15:00Z',
    isVerifiedPurchase: true,
    helpfulCount: 19
  }
];
