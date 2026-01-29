import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, LinkIcon, Store } from "lucide-react";
import { Product } from "../types";
import { addToCart } from "../utils/cart";
import { VerifiedBadge } from "./VerifiedBadge";
import { logEvent } from "../services/analytics";
import { Flame } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isVendorVerified?: boolean;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export function ProductCard({ product, isVendorVerified }: ProductCardProps) {
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

    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
    toast.textContent = "Added to cart!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello 👋\nI found this product on LAUTECH Market.\n\nI’m interested in the *${product.name}* (₦${formatPrice(product.price)}).\n\nBefore I decide, please confirm:\n– Is it currently available?\n– can you deliver around lautech?\n– How fast can I get it?\n\nThank you 😊`;
    const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodeURIComponent(message)}`;

    logEvent("whatsapp_order", {
      productId: product.id,
      vendorId: product.vendorId,
      category: product.category
    });

    window.open(whatsappUrl, "_blank");
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product.id}`;
    navigator.clipboard
      .writeText(productUrl)
      .then(() => {
        const toast = document.createElement("div");
        toast.className =
          "fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
        toast.textContent = "Link copied!";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const handleCardClick = () => {
    logEvent("product_view", {
      productId: product.id,
      vendorId: product.vendorId,
      category: product.category
    });
    navigate(`/product/${product.id}`);
  };

  return (
    <div onClick={handleCardClick} className="group cursor-pointer relative">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-300">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image}
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

          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
            {product.category}
          </div>

          <button
            onClick={handleCopyLink}
            className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
            title="Copy link"
          >
            <LinkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>

          <div className="mb-3">
            <span className="text-2xl font-bold text-gray-900">
              ₦{formatPrice(product.price)}
            </span>
            <div className="mt-1">
              {product.vendorId ? (
                <Link
                  to={`/store/${product.vendorId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-emerald-600 transition-colors max-w-full"
                  title={product.vendorName}
                >
                  <Store className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{product.vendorName}</span>
                  {isVendorVerified && <VerifiedBadge size="sm" />}
                </Link>
              ) : (
                <span className="text-xs text-gray-500 truncate block">
                  by {product.vendorName}
                </span>
              )}
            </div>
          </div>

          {product.inStock && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
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
}
