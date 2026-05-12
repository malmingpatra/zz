import React, { createContext, useContext, useState } from "react";
import { useDatabase, Product as DBProduct } from "./DatabaseContext";

export type Product = DBProduct;

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  products: Product[];
  cartItems: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products } = useDatabase();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) return; // jangan tambah jika stok habis
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing) {
        // jangan melebihi stok yang tersedia
        if (existing.qty >= product.stock) return prev;
        return prev.map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, qty } : i))
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        products,
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
