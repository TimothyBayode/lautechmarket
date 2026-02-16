import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, LinkIcon, Store, Flame, ArrowRightLeft } from "lucide-react";
import { Product, VendorBadge } from "../types";
import { addToCart } from "../utils/cart";
import { VerifiedBadge } from "./VerifiedBadge";
import { TrustSummary } from "./TrustSummary";
import { logEvent } from "../services/analytics";
import { logVendorContact } from "../services/vendorContacts";
import { getStudentId } from "../utils/studentId";
import { showToast } from "./ToastContainer";
import { getProxiedImageUrl } from "../utils/imageUrl";
import { createPendingOrder } from "../services/orders";

interface ProductCardProps {
  product: Product;
  isVendorVerified?: boolean;
  onCompare?: (product: Product) => void;
  isSelectedForCompare?: boolean;
  isVendorActive?: boolean;
  vendorBadges?: VendorBadge[];
  verificationLevel?: 'basic' | 'verified' | 'pro';
  isStudent?: boolean;
  searchQuery?: string;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const HighlightText = React.memo(({ text, highlight }: { text: string; highlight?: string }) => {
  if (!highlight || !highlight.trim()) return <span className="highlight-text">{text}</span>;

  const regex = new RegExp(`(${highlight.trim().split(/\s+/).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className="highlight-wrapper inline-block">
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-100 text-gray-900 rounded-px px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
});

export const ProductCard = React.memo(({
  product,
  isVendorVerified,
  onCompare,
  isSelectedForCompare,
  isVendorActive,
  vendorBadges,
  verificationLevel,
  isStudent,
  searchQuery
}: ProductCardProps) => {
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    logEvent("add_to_cart", {
      productId: product.id,
      vendorId: product.vendorId,
      category: product.category
    });
    window.dispatchEvent(new Event("cartUpdated"));

    showToast("Added to cart!");
  };

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // 1. Create a pending order record for GMV tracking
      const orderId = await createPendingOrder(product);
      console.log(`[Order] Created pending order: ${orderId}`);

      // 2. Prepare WhatsApp message with Order Reference
      const message = `Hello 👋\nI found this product on LAUTECH Market.\n\nI’m interested in the *${product.name}* (₦${formatPrice(product.price)}).\n\nMy Order Reference is: ${orderId}\n\nBefore I decide, please confirm:\n– Is it currently available?\n– can you deliver around lautech?\n– How fast can I get it?\n\nThank you 😊`;
      const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodeURIComponent(message)}`;

      // 3. Log analytics event
      logEvent("whatsapp_order", {
        productId: product.id,
        vendorId: product.vendorId,
        category: product.category
      });

      // 4. Log contact background tasks
      const studentId = getStudentId();
      logVendorContact(
        product.vendorId || '',
        studentId,
        'whatsapp',
        product.id
      ).catch(error => console.error('Error logging contact:', error));

      // 5. Redirection
      window.location.assign(whatsappUrl);
    } catch (err) {
      console.error("Failed to track order:", err);
      // Fallback message if tracking fails
      const message = `Hello 👋\nI found this product on LAUTECH Market.\n\nI’m interested in the *${product.name}* (₦${formatPrice(product.price)}).\n\nThank you 😊`;
      const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodeURIComponent(message)}`;
      window.location.assign(whatsappUrl);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard
      .writeText(productUrl)
      .then(() => {
        showToast("Link copied!");
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div onClick={handleCardClick} className="group cursor-pointer relative">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
          <img
            src={getProxiedImageUrl(product.image) || product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                Out of Stock
              </span>
            </div>
          )}

          {product.orderCount && product.orderCount > 0 && (
            <div className="absolute top-2 left-12 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center shadow-sm border border-orange-200 animate-pulse">
              <Flame className="w-3 h-3 mr-1" />
              {product.orderCount} {product.orderCount === 1 ? 'order' : 'orders'}
            </div>
          )}

          <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-600 dark:text-slate-300 shadow-sm">
            {product.category}
          </div>

          <button
            onClick={handleCopyLink}
            className="absolute top-2 left-2 bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-md hover:bg-white dark:hover:bg-slate-700 transition-colors z-10 backdrop-blur-sm"
            title="Copy link"
          >
            <LinkIcon className="w-4 h-4 text-gray-600 dark:text-slate-300" />
          </button>

          {onCompare && (
            <button
              onClick={(e) => { e.stopPropagation(); onCompare(product); }}
              className={`absolute top-12 left-2 p-2 rounded-full shadow-md z-10 transition-colors ${isSelectedForCompare ? 'bg-emerald-600 text-white' : 'bg-white/90 dark:bg-slate-800/90 text-gray-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 backdrop-blur-sm'}`}
              title={isSelectedForCompare ? "Remove from Compare" : "Compare"}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}

          {/* Trust Indicators on Image */}
          <div className="absolute bottom-2 left-2 right-2">
            <TrustSummary
              vendor={{
                isVerified: isVendorVerified,
                isStudent: isStudent || vendorBadges?.some(b => b.type === 'reliable'),
                verificationLevel: verificationLevel || (isVendorVerified ? 'verified' : 'basic'),
                isActiveNow: false
              }}
              metrics={null}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-lg shadow-sm border border-white/20"
            />
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            <HighlightText text={product.name} highlight={searchQuery} />
          </h3>

          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 line-clamp-2">
            <HighlightText text={product.description} highlight={searchQuery} />
          </p>

          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ₦{formatPrice(product.price)}
            </span>
            <div className="mt-1">
              {product.vendorId ? (
                <Link
                  to={`/store/${product.vendorId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors max-w-full"
                  title={product.vendorName}
                >
                  <Store className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{product.vendorName}</span>
                  {verificationLevel && verificationLevel !== 'basic' && (
                    <VerifiedBadge level={verificationLevel} size="sm" />
                  )}
                  {isVendorActive && (
                    <div className="flex items-center gap-1.5 ml-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-100 dark:border-emerald-800/50 shadow-sm animate-in fade-in zoom-in duration-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-tight">Online</span>
                    </div>
                  )}
                </Link>
              ) : (
                <span className="text-xs text-gray-500 dark:text-slate-500 truncate block">
                  by {product.vendorName}
                </span>
              )}
            </div>
          </div>

          {product.inStock && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-emerald-600 dark:bg-emerald-500 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                onClick={handleWhatsAppClick}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                title="Order on WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Order Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
