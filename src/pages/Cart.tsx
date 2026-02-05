import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, MessageCircle, ShoppingBag } from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CartItem } from "../types";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  getCartItemsByVendor,
  generateWhatsAppLink,
  clearCart,
} from "../utils/cart";

// Price formatting function
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [vendorGroups, setVendorGroups] = useState<Map<string, CartItem[]>>(
    new Map()
  );

  useEffect(() => {
    loadCart();
    window.addEventListener("cartUpdated", loadCart);
    return () => window.removeEventListener("cartUpdated", loadCart);
  }, []);

  const loadCart = () => {
    const cartData = getCart();
    setCart(cartData);
    setVendorGroups(getCartItemsByVendor());
  };

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    loadCart();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartQuantity(productId, newQuantity);
    loadCart();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleClearCart = () => {
    if (
      window.confirm(
        "Are you sure you want to clear your entire cart? This action cannot be undone."
      )
    ) {
      clearCart();
      loadCart();
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <Header onSearch={() => { }} categories={[]} />

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Add some products to get started!
            </p>
            <Link
              to="/"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Browse Products
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <Header onSearch={() => { }} categories={[]} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Array.from(vendorGroups.entries()).map(([vendor, items]) => (
              <div
                key={vendor}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Vendor: {vendor}
                  </h3>
                  <a
                    href={generateWhatsAppLink(
                      items,
                      items[0].product.whatsappNumber
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Order from {vendor}</span>
                  </a>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-6 flex items-center space-x-4"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block mb-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                          {item.product.category}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₦{formatPrice(item.product.price)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id,
                                item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded-lg border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                          </button>
                          <span className="text-lg font-semibold w-12 text-center dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.product.id,
                                item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-lg border border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>
                    Subtotal (
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">₦{formatPrice(total)}</span>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₦{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
                  Order from each vendor separately via WhatsApp
                </p>

                <Link
                  to="/"
                  className="block w-full text-center bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Continue Shopping
                </Link>

                <div className="text-center">
                  <button
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700 transition-colors text-sm font-medium inline-flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
