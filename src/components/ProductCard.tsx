import React, { useState } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { addToCart } from '../utils/cart';
import { ProductDetailModal } from './ProductDetailModal';

interface ProductCardProps {
  product: Product;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

export function ProductCard({ product }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    window.dispatchEvent(new Event('cartUpdated'));
    
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = 'Added to cart!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello! I'm interested in ${encodeURIComponent(product.name)}`;
    const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="group cursor-pointer"
      >
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

            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
              {product.category}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-gray-900">
                ₦{formatPrice(product.price)}
              </span>
              <span className="text-xs text-gray-500">
                by {product.vendorName}
              </span>
            </div>

            {product.inStock && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button 
                  onClick={handleWhatsAppClick}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                  title="Order on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}