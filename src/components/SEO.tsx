import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: object;
}

export function SEO({
    title,
    description,
    keywords,
    image,
    url,
    type = "website",
    schema,
}: SEOProps) {
    const siteName = "LAUTECH Market";
    const fullTitle = title ? `${title} | ${siteName}` : siteName;
    const defaultDescription = "Discover verified vendors for electronics, fashion & services at LAUTECH. Buy & sell easily, anytime - 100% student-focused & free.";
    const defaultKeywords = "lautech market, lautech marketplace, lautech ogbomoso, lautech vendors, lautech student market, lautech campus shopping";
    const siteUrl = "https://lautechmarket.com.ng";
    const defaultImage = "https://res.cloudinary.com/dji0rdzhk/image/upload/v1763678803/logo_rmgj8n.svg";

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description || defaultDescription} />
            <meta name="keywords" content={keywords || defaultKeywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description || defaultDescription} />
            <meta property="og:image" content={image || defaultImage} />
            <meta property="og:url" content={url ? `${siteUrl}${url}` : siteUrl} />
            <meta property="og:site_name" content={siteName} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description || defaultDescription} />
            <meta name="twitter:image" content={image || defaultImage} />

            {/* Schema.org JSON-LD */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
}
