import React, { useState, useEffect } from "react";
import {
  X,
  ShoppingCart,
  MessageCircle,
  Star,
  Truck,
  Shield,
} from "lucide-react";
import { Product } from "../types";
import { addToCart } from "../utils/cart";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAddedToCart(false);
  }, [product]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      setAddedToCart(true);
      window.dispatchEvent(new Event("cartUpdated"));

      const toast = document.createElement("div");
      toast.className =
        "fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in";
      toast.textContent = "Added to cart!";
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
        setAddedToCart(false);
      }, 2000);
    }
  };

  const handleWhatsAppOrder = () => {
    if (product) {
      const message = `Hello! I want to order:\n\n*${
        product.name
      }*\nQuantity: ${quantity}\nPrice: ₦${formatPrice(
        product.price * quantity
      )}\n\nProduct Details: ${product.description}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(
        /[^0-9]/g,
        ""
      )}?text=${encodedMessage}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !product) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full lg:h-full object-cover rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none"
              />

              <div
                className={`absolute top-4 left-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  product.inStock
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    product.inStock ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {product.inStock ? "In Stock" : "Out of Stock"}
              </div>

              <div className="absolute top-4 right-16 bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-600">
                {product.category}
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    {product.name}
                  </h1>

                  {/* <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4 lg:w-5 lg:h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">(24 reviews)</span>
                  </div> */}

                  <p className="text-2xl lg:text-3xl font-bold text-emerald-600">
                    ₦{formatPrice(product.price)}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Vendor Information
                  </h4>
                  <p className="text-gray-600">Sold by: {product.vendorName}</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() =>
                          setQuantity((prev) => Math.max(1, prev - 1))
                        }
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 border-l border-r border-gray-300 min-w-12 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((prev) => prev + 1)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      Total: ₦{formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || addedToCart}
                    className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {addedToCart ? "Added to Cart!" : "Add to Cart"}
                    </span>
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    disabled={!product.inStock}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Order on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
