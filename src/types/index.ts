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
    image: string;
    inStock: boolean;
    whatsappNumber: string;
    vendorName: string;
    vendorId?: string;
    orderCount?: number;
    viewCount?: number;
    cartCount?: number;
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
    isVerified?: boolean;
    verifiedAt?: Date | null;
    totalOrders?: number;
    createdAt: Date;
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
