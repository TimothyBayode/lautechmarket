import { CartItem, Product } from "../types";
import { logger } from "./logger";

const CART_KEY = "shopping_cart";

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const getCart = (): CartItem[] => {
  try {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error("Error loading cart:", error);
    return [];
  }
};

export const saveCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Error saving cart:", error);
  }
};

export const addToCart = (product: Product, quantity: number = 1): void => {
  const cart = getCart();

  const productIdentifier =
    product.id || `${product.name}-${product.vendorName}`;

  logger.log("Adding to cart:", {
    productId: productIdentifier,
    productName: product.name,
    quantity,
  });

  const existingItemIndex = cart.findIndex((item) => {
    const itemId =
      item.product.id || `${item.product.name}-${item.product.vendorName}`;
    return itemId === productIdentifier;
  });

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += quantity;
    logger.log("Increased quantity for existing product");
  } else {
    cart.push({
      product: {
        ...product,
        id: productIdentifier,
      },
      quantity,
    });
    logger.log("Added new product to cart");
  }

  saveCart(cart);
  logger.log("Cart after add:", getCart());
};

export const removeFromCart = (productId: string): void => {
  const cart = getCart().filter((item) => item.product.id !== productId);
  saveCart(cart);
};

export const updateCartQuantity = (
  productId: string,
  quantity: number
): void => {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  const cart = getCart();
  const item = cart.find((item) => item.product.id === productId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
};

export const clearCart = (): void => {
  localStorage.removeItem(CART_KEY);
};

export const getCartItemsByVendor = (): Map<string, CartItem[]> => {
  const cart = getCart();
  const vendorMap = new Map<string, CartItem[]>();

  cart.forEach((item) => {
    const vendor = item.product.vendorName;
    if (!vendorMap.has(vendor)) {
      vendorMap.set(vendor, []);
    }
    vendorMap.get(vendor)!.push(item);
  });

  return vendorMap;
};

export const generateWhatsAppLink = (
  items: CartItem[],
  whatsappNumber: string
): string => {
  const message = items
    .map(
      (item) =>
        `– *${item.quantity}x ${item.product.name}* (₦${formatPrice(
          item.product.price * item.quantity
        )})`
    )
    .join("\n");

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const fullMessage = encodeURIComponent(`Hello 👋\nI found these products on LAUTECH Market.\n\nI’m interested in:\n${message}\n*Total: ₦${formatPrice(total)}*\n\nBefore I decide, please confirm:\n– Is it currently available?\n– can you deliver around lautech?\n– How fast can I get it?\n\nThank you 😊`);

  return `https://wa.me/${whatsappNumber.replace(
    /[^0-9]/g,
    ""
  )}?text=${fullMessage}`;
};

export const getCartItemCount = (): number => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const getCartTotal = (): number => {
  const cart = getCart();
  return cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
};

export const isProductInCart = (productId: string): boolean => {
  const cart = getCart();
  return cart.some((item) => item.product.id === productId);
};