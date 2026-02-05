import { Product } from '../types';

const HISTORY_KEY = 'lautech_market_view_history';
const MAX_HISTORY = 10;

/**
 * Adds a product to the user's local view history
 */
export const trackProductView = (productId: string) => {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const updated = [productId, ...history.filter((id: string) => id !== productId)].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Error tracking view:', e);
    }
};

/**
 * Gets a list of recommended products based on history and trends
 */
export const getRecommendations = (allProducts: Product[]): Product[] => {
    if (!allProducts || allProducts.length === 0) return [];

    try {
        const historyIds = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

        // 1. Get history products
        const historyProducts = allProducts.filter(p => historyIds.includes(p.id));

        // 2. Identify preferred categories
        const categories = historyProducts.map(p => p.category);
        const categoryCounts = categories.reduce((acc, cat) => {
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 3. Score all products
        const scored = allProducts
            .filter(p => !historyIds.includes(p.id)) // Don't recommend what they just saw
            .map(p => {
                let score = 0;

                // Category match boost
                if (categoryCounts[p.category]) {
                    score += 50 * categoryCounts[p.category];
                }

                // Global trend boost (viewCount, orderCount)
                score += (p.viewCount || 0) * 1;
                score += (p.orderCount || 0) * 10;
                score += (p.cartCount || 0) * 5;

                // Freshness (new items)
                const isNew = p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
                if (isNew) score += 20;

                return { ...p, _score: score };
            })
            .sort((a, b) => b._score - a._score);

        return scored.slice(0, 10);
    } catch (e) {
        // Fallback to trending products
        return [...allProducts]
            .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
            .slice(0, 10);
    }
};

/**
 * Gets similar products for a specific item
 */
export const getSimilarProducts = (product: Product, allProducts: Product[]): Product[] => {
    return allProducts
        .filter(p => p.id !== product.id)
        .map(p => {
            let similarity = 0;
            if (p.category === product.category) similarity += 50;
            if (p.bucketId === product.bucketId && p.bucketId) similarity += 30;

            // Price similarity (within 30% range)
            const priceDiff = Math.abs(p.price - product.price);
            if (priceDiff < product.price * 0.3) similarity += 20;

            return { ...p, _similarity: similarity };
        })
        .filter(p => p._similarity > 0)
        .sort((a, b) => b._similarity - a._similarity)
        .slice(0, 4);
};
