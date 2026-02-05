import { Product, Vendor } from "../types";

/**
 * Levenshtein Distance for fuzzy matching
 */
const getLevenshteinDistance = (a: string, b: string): number => {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) tmp[i] = [i];
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,
                tmp[i][j - 1] + 1,
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return tmp[a.length][b.length];
};

/**
 * Semantic relationships to boost relevance (English and Campus Slang)
 */
const SEMANTIC_SYNONYMS: Record<string, string[]> = {
    'hostel': ['accommodation', 'room', 'lodge', 'apartment', 'house'],
    'phone': ['mobile', 'smartphone', 'iphone', 'android', 'gadget'],
    'laptop': ['pc', 'computer', 'macbook'],
    'food': ['meal', 'eat', 'restaurant', 'canteen'],
    'cloth': ['fashion', 'wear', 'dress', 'shirt'],
};


/**
 * Calculates a score for a product based on a search query.
 * The score determines the ranking (higher is better).
 */
export const calculateProductScore = (product: Product, query: string): number => {
    const rawQ = query.toLowerCase().trim();
    if (!rawQ) return 0;

    // Split query into individual keywords to handle vague searches (e.g., "cheap phone")
    const keywords = rawQ.split(/\s+/).filter(k => k.length > 1);
    if (keywords.length === 0) return 0;

    // 1. RELEVANCE (0 - 100 points)
    let relevanceScore = 0;
    const nameMatch = product.name.toLowerCase();
    const descMatch = product.description.toLowerCase();
    const categoryMatch = product.category.toLowerCase();

    // -- PHRASE MATCH BOOST (Tier 1 - The Domination Layer) --
    // If they typed exactly what's in the name/category, huge boost
    // Multiplied by 5 to ensure it outweighs freshness/engagement
    if (nameMatch.includes(rawQ)) relevanceScore += 300;

    // Tier 2 - Category Match
    if (categoryMatch.includes(rawQ)) relevanceScore += 150;

    // -- KEYWORD INTELLIGENCE --
    // Check how many of their keywords match the product
    let wordsMatched = 0;
    keywords.forEach(word => {
        let wordFound = false;
        if (nameMatch.includes(word)) {
            relevanceScore += (100 / keywords.length);
            wordFound = true;
        }
        if (categoryMatch.includes(word)) {
            relevanceScore += (50 / keywords.length);
            wordFound = true;
        }
        if (descMatch.includes(word)) {
            // Description matches are Tier 3
            relevanceScore += (20 / keywords.length);
            wordFound = true;
        }
        if (wordFound) wordsMatched++;
    });

    // Bonus for matching ALL words (the "Google" effect)
    if (wordsMatched === keywords.length && keywords.length > 1) {
        relevanceScore += 50;
    }

    // No Cap on relevance anymore to allow it to scale
    // relevanceScore = Math.min(100, relevanceScore);

    // 2. ENGAGEMENT (Normalized 0 - 50 points max)
    // We cap this lower so it never beats a good relevance match
    const engagementPoints =
        ((product.orderCount || 0) * 10) +
        ((product.cartCount || 0) * 5) +
        ((product.viewCount || 0) * 1);

    const engagementScore = Math.min(50, engagementPoints);

    // 3. FRESHNESS (0 - 30 points max)
    // Freshness is a tie-breaker, not a king-maker
    let freshnessScore = 0;
    const now = new Date().getTime();
    const createdTime = product.createdAt ? new Date(product.createdAt).getTime() : 0;
    const updatedTime = product.updatedAt ? new Date(product.updatedAt).getTime() : 0;

    const hoursSinceCreated = (now - createdTime) / (1000 * 60 * 60);
    const hoursSinceUpdated = (now - updatedTime) / (1000 * 60 * 60);

    // New items (posted in last 48h) get max freshness
    if (hoursSinceCreated < 48) freshnessScore = 30;
    else if (hoursSinceCreated < 168) freshnessScore = 20; // 1 week
    else if (hoursSinceUpdated < 24) freshnessScore = 15; // Recently updated
    else freshnessScore = 5;

    // 4. SEMANTIC BOOST (0 - 50 points)
    keywords.forEach(word => {
        for (const [key, synonyms] of Object.entries(SEMANTIC_SYNONYMS)) {
            if (synonyms.includes(word) || key === word) {
                if (nameMatch.includes(key) || categoryMatch.includes(key)) {
                    relevanceScore += 50;
                }
            }
        }
    });

    // FINAL SCORE 
    return relevanceScore + engagementScore + freshnessScore;
};

/**
 * Ranks a list of products based on a search query.
 */
export const rankProducts = (products: Product[], query: string): Product[] => {
    if (!query.trim()) return products;

    return [...products]
        .map(p => ({
            ...p,
            _score: calculateProductScore(p, query)
        }))
        .filter(p => (p as any)._score > 0)
        .sort((a, b) => (b as any)._score - (a as any)._score);
};

/**
 * Gets real-time suggestions (products, vendors, categories)
 */
export const getSearchSuggestions = (
    query: string,
    products: Product[],
    vendors: Vendor[],
    categories: string[]
) => {
    const rawQ = query.toLowerCase().trim();
    if (!rawQ) return { products: [], vendors: [], categories: [] };

    const suggestedProducts = products
        .map(p => ({ ...p, _score: calculateProductScore(p, rawQ) }))
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 4);

    const suggestedVendors = vendors
        .filter(v =>
            v.businessName.toLowerCase().includes(rawQ) ||
            v.name.toLowerCase().includes(rawQ)
        )
        .slice(0, 2);

    const suggestedCategories = categories
        .filter(c => c.toLowerCase().includes(rawQ))
        .slice(0, 3);

    return {
        products: suggestedProducts,
        vendors: suggestedVendors,
        categories: suggestedCategories
    };
};

/**
 * Fuzzy spelling correction ("Did you mean?")
 */
export const getSpellingCorrection = (query: string, dictionary: string[]): string | null => {
    const words = query.toLowerCase().split(/\s+/);
    let corrected = false;
    const result = words.map(word => {
        if (word.length < 3) return word;
        if (dictionary.some(d => d.toLowerCase() === word)) return word;

        let bestMatch = word;
        let minDistance = 2; // Threshold for typo

        dictionary.forEach(d => {
            const dist = getLevenshteinDistance(word, d.toLowerCase());
            if (dist < minDistance) {
                minDistance = dist;
                bestMatch = d;
                corrected = true;
            }
        });
        return bestMatch;
    });

    return corrected ? result.join(' ') : null;
};
