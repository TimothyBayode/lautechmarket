import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Package,
  ChevronRight,
  Check,
  ChevronLeft,
  Store,
} from "lucide-react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Product, Vendor } from "../types";
import { getProductById, fetchProducts } from "../services/products";
import { addToCart } from "../utils/cart";
import { ShareButton } from "../components/ShareButton";
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { VerifiedBadge } from "../components/VerifiedBadge";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { logEvent } from "../services/analytics";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  useDocumentTitle(product?.name || "Product Details");

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await getProductById(id);
      setProduct(data);

      if (data) {
        const allProducts = await fetchProducts();
        const sameCategoryProducts = allProducts.filter(
          (p) => p.id !== data.id && p.category === data.category
        );

        const uniqueProducts = Array.from(
          new Map(sameCategoryProducts.map((p) => [p.id, p])).values()
        ).slice(0, 4);

        setRelatedProducts(uniqueProducts);

        const allCategories = Array.from(
          new Set(allProducts.map((p) => p.category))
        );
        setCategories(allCategories);

        // Fetch vendor to get verification status
        if (data.vendorId) {
          const vendorDoc = await getDoc(doc(db, "vendors", data.vendorId));
          if (vendorDoc.exists()) {
            const vendorData = vendorDoc.data();
            setVendor({
              id: vendorDoc.id,
              name: vendorData.name,
              email: vendorData.email,
              password: "",
              whatsappNumber: vendorData.whatsappNumber,
              businessName: vendorData.businessName,
              description: vendorData.description || "",
              isVerified: vendorData.isVerified || false,
              createdAt: vendorData.createdAt?.toDate() || new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(product, quantity);
    setIsInCart(true);
    logEvent("add_to_cart", {
      productId: product.id,
      vendorId: product.vendorId,
      category: product.category
    });
    window.dispatchEvent(new Event("cartUpdated"));

    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center space-x-2";
    toast.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Added ${quantity} item(s) to cart</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleWhatsAppOrder = () => {
    if (!product) return;

    const message = `Hello 👋\nI found this product on LAUTECH Market.\n\nI’m interested in ${quantity > 1 ? `*${quantity}x ${product.name}*` : `the *${product.name}*`} (₦${formatPrice(product.price * quantity)}).\n\nBefore I decide, please confirm:\n– Is it currently available?\n– can you deliver around lautech?\n– How fast can I get it?\n\nThank you 😊`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${product.whatsappNumber.replace(
      /[^0-9]/g,
      ""
    )}?text=${encodedMessage}`;

    logEvent("whatsapp_order", {
      productId: product.id,
      vendorId: product.vendorId,
      category: product.category
    });

    window.open(whatsappUrl, "_blank");
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onSearch={() => { }} categories={categories} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header onSearch={() => { }} categories={categories} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <Package className="w-24 h-24 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shopping</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onSearch={() => { }} categories={categories} />

      <main className="flex-1">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-emerald-600 mr-2 sm:mr-4"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm sm:text-base">Back</span>
              </button>

              <nav className="hidden xs:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                <Link to="/" className="hover:text-emerald-600 truncate">
                  Home
                </Link>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                <Link
                  to={`/category/${product.category}`}
                  className="hover:text-emerald-600 capitalize truncate"
                >
                  {product.category}
                </Link>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-gray-900 font-medium truncate max-w-[100px] sm:max-w-[200px]">
                  {product.name}
                </span>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-4">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {!product.inStock && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-start justify-between">
                  <div className="pr-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 leading-tight">
                      {product.name}
                    </h1>
                    {product.inStock ? (
                      <span className="inline-flex items-center bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        ✓ In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        ✕ Out of Stock
                      </span>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <ShareButton product={product} />
                  </div>
                </div>

                <div className="flex items-baseline space-x-2 sm:space-x-4 mb-4 sm:mb-6">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">
                    ₦{formatPrice(product.price)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  Description
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      Category
                    </span>
                    <p className="font-medium text-sm sm:text-base capitalize">
                      {product.category}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Sold by
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-semibold text-sm sm:text-base">
                        {product.vendorName.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate flex items-center gap-1">
                        {product.vendorName}
                        {vendor?.isVerified && <VerifiedBadge size="sm" />}
                      </p>
                      {product.vendorId && (
                        <Link
                          to={`/store/${product.vendorId}`}
                          className="flex items-center space-x-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Store className="w-3 h-3" />
                          <span>View Store</span>
                        </Link>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${product.whatsappNumber.replace(
                      /[^0-9]/g,
                      ""
                    )}?text=${encodeURIComponent(`Hi ${product.vendorName} , I saw your store on LAUTECH Marketplace and I will like to...`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium flex-shrink-0 ml-2"
                  >
                    Contact
                  </a>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Quantity
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg self-start">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-3 sm:px-4 py-2 border-l border-r border-gray-300 min-w-10 sm:min-w-12 text-center font-semibold text-sm sm:text-base">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        className="px-3 sm:px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-lg sm:text-xl font-semibold text-gray-900">
                      Total: ₦{formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock || isInCart}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base ${isInCart
                      ? "bg-gray-600 text-white cursor-not-allowed"
                      : product.inStock
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    {isInCart ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Added to Cart</span>
                      </>
                    ) : product.inStock ? (
                      <>
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Add to Cart</span>
                      </>
                    ) : (
                      <span>Out of Stock</span>
                    )}
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    disabled={!product.inStock}
                    className="w-full bg-green-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Order on WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-8 sm:mt-12 lg:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                More from {product.category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2 sm:p-3 lg:p-4">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 truncate">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {relatedProduct.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0">
                        <span className="text-base sm:text-lg font-bold text-emerald-600">
                          ₦{formatPrice(relatedProduct.price)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 text-right">
                          by {relatedProduct.vendorName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
