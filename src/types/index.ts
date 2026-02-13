// Type definitions for LAUTECH Market

/**
 * Product type - represents an item being sold
 */
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    bucketId?: string; // ID of the bucket this product belongs to
    image: string;
    inStock: boolean;
    whatsappNumber: string;
    vendorName: string;
    vendorId?: string;
    orderCount?: number;
    viewCount?: number;
    cartCount?: number;
    compareCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Vendor type - represents a seller on the platform
 */
export interface Vendor {
    id: string;
    name: string;
    email: string;
    password: string;
    whatsappNumber: string;
    businessName: string;
    description?: string;
    storeAddress?: string;
    bannerImage?: string;
    profileImage?: string;
    slug?: string;
    tagline?: string;
    isVerified?: boolean;
    verificationLevel?: 'basic' | 'verified' | 'pro';
    isStudent?: boolean;
    verifiedAt?: Date | null;
    totalOrders?: number;
    createdAt: Date;

    // Responsiveness & Trust
    metrics?: {
        responsivenessScore: number;
        trustScore: number;
        averageResponseMinutes: number;
        responseRate: number;
    };
    badges?: VendorBadge[];
    lastActive?: Date | null;
    isActiveNow?: boolean;
    claimedResponseTime?: string;
}

/**
 * CartItem type - represents an item in the shopping cart
 */
export interface CartItem {
    product: Product;
    quantity: number;
}

/**
 * FilterOptions type - represents available filter options
 */
export interface FilterOptions {
    categories: string[];
    priceRange: {
        min: number;
        max: number;
    };
    instantBuy?: boolean;
}

/**
 * CategoryStats type - for admin dashboard category statistics
 */
export interface CategoryStats {
    name: string;
    count: number;
}

/**
 * Announcement type - for homepage banner carousel
 */
export interface Announcement {
    id: string;
    type: 'image' | 'text';
    imageUrl?: string;
    title?: string;
    message?: string;
    backgroundColor?: string;
    link?: string;
    active: boolean;
    order: number;
    createdAt: Date;
}

/**
 * Vendor Badge - Trust signals and achievements
 */
export interface VendorBadge {
    type: 'quick_response' | 'reliable' | 'top_rated' | 'best_price' | 'premium' | 'trending' | 'active_now';
    label: string;
    icon: string;
    color: 'yellow' | 'green' | 'gold' | 'blue';
    earnedAt: Date;
    criteria: string;
}

/**
 * Vendor Metrics - Aggregated performance data
 */
export interface VendorMetrics {
    vendorId: string;

    // Self-reported
    claimedResponseTime: '15min' | '30min' | '1hr' | '2hr' | '4hr' | '24hr';

    // Student feedback (calculated)
    totalContacts: number;
    feedbackCount: number;
    averageResponseMinutes: number;
    responseRate: number; // 0-100
    helpfulRate: number; // 0-100
    purchaseRate: number; // 0-100

    // Platform activity
    lastActive: Date;
    isActiveNow: boolean;
    loginFrequency: number;
    productUpdateFrequency: number;
    activityScore: number; // 0-100

    // Composite scores
    responsivenessScore: number; // 0-100
    trustScore: number; // 0-100

    // Badges
    badges: VendorBadge[];

    // Last calculated
    lastCalculated: Date;
}

/**
 * Vendor Contact - Track student-vendor interactions
 */
export interface VendorContact {
    id: string;
    vendorId: string;
    studentId: string;
    contactedAt: Date;
    contactMethod: 'whatsapp' | 'call' | 'other';
    productId?: string;

    // Feedback (filled later)
    feedbackSubmitted: boolean;
    responseTime?: 'under_30min' | '30min_2hr' | '2hr_24hr' | 'over_24hr' | 'no_response';
    wasHelpful?: boolean;
    purchaseMade?: boolean;
    feedbackAt?: Date;
    feedbackNote?: string;
}

/**
 * Contact Feedback - Simplified feedback submission
 */
export interface ContactFeedback {
    responseTime: 'under_30min' | '30min_2hr' | '2hr_24hr' | 'over_24hr' | 'no_response';
    wasHelpful: boolean;
    purchaseMade: boolean;
    note?: string;
}

/**
 * Curated List - For "Top 3" and "Featured" lists
 */
export interface CuratedList {
    id: string;
    title: string;
    description: string;
    category: string;
    vendorIds: string[];
    type: 'top_3' | 'featured' | 'certified';
    active: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Expansion Response - Data collected from OJA Expansion Circle
 */
export interface ExpansionResponse {
    id: string;
    // Identity
    fullName: string;
    whatsappNumber: string;
    email?: string;

    // Location
    city: string;
    state: string;
    country: string;

    // Usage Plan
    usagePlan: ('buy' | 'sell' | 'audience' | 'partner' | 'interested')[];

    // Business Details (Conditional)
    businessName?: string;
    businessType?: string;
    whatsappBusinessNumber?: string;
    currentOperatingCity?: string;

    // Audience Power (Conditional)
    hasAudience: boolean;
    audiencePlatform?: string;
    audienceSize?: 'small' | 'medium' | 'large' | 'massive'; // e.g., <1k, 1k-10k, 10k-50k, 50k+

    // Intent Strength
    intentStrength: 'definitely' | 'very_likely' | 'maybe' | 'curious';

    // Permissions
    wantsEarlyAccess: boolean;
    openToHelping: boolean;

    // Metadata
    createdAt: Date;
    source: 'oja_form';
}
