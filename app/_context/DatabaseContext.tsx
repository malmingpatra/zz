import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocFromServer, increment, writeBatch, serverTimestamp, getDocs, query, limit, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase-setup";
import { onAuthStateChanged } from "firebase/auth";

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  role: "admin" | "staff";
  theme?: string;
  area?: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  stockStatus: "ok" | "warn";
  desc?: string;
}

export interface Order {
  id: string;
  buyer: string;
  staff: string;
  total: number;
  cat: string;
  date: string;
  createdAt?: any;
  status: "selesai" | "diproses" | "menunggu" | "dibatalkan" | "dikirim";
  items?: any[];
  phone?: string;
  address?: string;
  subtotal?: number;
  discountType?: "pct" | "rp";
  discountValue?: number;
  discountAmount?: number;
}

export interface Member {
  id: string;
  initials: string;
  name: string;
  sub: string;
  status: "aktif" | "nonaktif";
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  area?: string;
}

export interface Bantuan {
  id: string;
  icon: any;
  name: string;
  bg: string;
  color: string;
  link?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) throw error;
}

interface DatabaseContextType {
  products: Product[];
  orders: Order[];
  members: Member[];
  bantuan: Bantuan[];
  userProfile: UserProfile | null;
  storeSettings: StoreSettings | null;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addOrder: (o: Order) => Promise<void>;
  addBantuan: (b: Bantuan) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, newStatus: Order["status"], staffName?: string) => Promise<void>;
  updateBantuan: (b: Bantuan) => Promise<void>;
  deleteBantuan: (id: string) => Promise<void>;
  loading: boolean;
}

export const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bantuan, setBantuan] = useState<Bantuan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    let isMounted = true;

    // A. PUBLIC LISTENERS (Always active)
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      if (!isMounted) return;
      const data = snapshot.docs.map(doc => doc.data() as Product);
      console.log("Products snapshot received:", data.length, "items");
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Products listener error:", error);
      if (isMounted) setLoading(false);
    });
    unsubs.push(unsubProducts);

    const unsubBantuan = onSnapshot(collection(db, "bantuan"), (snapshot) => {
      if (isMounted) {
        const data = snapshot.docs.map(doc => doc.data() as Bantuan);
        console.log("Bantuan snapshot received:", data.length, "items");
        setBantuan(data);
      }
    }, (error) => {
      console.error("Bantuan listener error:", error);
    });
    unsubs.push(unsubBantuan);

    const unsubSettings = onSnapshot(doc(db, "settings", "toko"), (docSnap) => {
      if (isMounted) {
        if (docSnap.exists()) {
          setStoreSettings(docSnap.data() as StoreSettings);
        } else {
          setStoreSettings(null);
        }
      }
    }, (error) => {
      console.error("Settings listener error:", error);
    });
    unsubs.push(unsubSettings);

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      if (!isMounted) return;
      const data = snapshot.docs.map(doc => {
        const u = doc.data() as UserProfile;
        return {
          id: u.uid,
          name: u.displayName || "User",
          initials: (u.displayName || "U")
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          sub: u.role === "admin" ? "Administrator" : "Staff Member",
          status: "aktif",
          email: u.email,
          phone: u.phoneNumber,
          address: u.address,
          role: u.role,
          area: u.area,
        } as Member;
      });
      console.log("Users (members) snapshot received:", data.length, "items");
      setMembers(data);
    }, (error) => {
      console.error("Users listener error:", error);
    });
    unsubs.push(unsubUsers);

    // B. AUTH SYNC & PRIVATE LISTENERS
    let privateUnsubs: (() => void)[] = [];
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      // Clean up previous private listeners
      privateUnsubs.forEach(u => u());
      privateUnsubs = [];

      if (user) {
        console.log("User logged in:", user.email);
        // Setup profile sync (Reactive)
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userRef, async (snap) => {
          if (!isMounted) return;
          if (!snap.exists()) {
            console.log("Creating new user profile...");
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || "User",
              email: user.email || "",
              role: "staff",
              theme: "classic",
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            // The snapshot listener will fire again with the new data
          } else {
            setUserProfile(snap.data() as UserProfile);
          }
        }, (error) => {
          console.error("Error syncing user profile:", error);
        });
        privateUnsubs.push(unsubProfile);

        // Setup Private Listeners (Orders, etc)
        const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
          if (isMounted) setOrders(snapshot.docs.map(doc => doc.data() as Order));
        }, (error) => {
          if (auth.currentUser && isMounted) handleFirestoreError(error, OperationType.LIST, "orders", false);
        });
        privateUnsubs.push(unsubOrders);

      } else {
        console.log("User logged out");
        if (isMounted) {
          setUserProfile(null);
          setOrders([]);
        }
      }
    });

    // C. Validate connection (once on mount)
    async function testConnection() {
      try {
         await getDocFromServer(doc(db, 'test', 'connection'));
         console.log("Firebase connection test: SUCCESS");
      } catch (error) {
        console.warn("Firebase connection test: FAILED", error);
      }
    }
    testConnection();

    return () => {
      isMounted = false;
      unsubAuth();
      unsubs.forEach(u => u());
      privateUnsubs.forEach(u => u());
    };
  }, []);

  const addProduct = async (p: Product) => {
    try {
      await setDoc(doc(db, "products", p.id), p);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "products/" + p.id);
    }
  };

  const updateProduct = async (p: Product) => {
    try {
      await updateDoc(doc(db, "products", p.id), { ...p });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "products/" + p.id);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "products/" + id);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "orders/" + id);
    }
  };

  const addOrder = async (o: Order) => {
    try {
      const batch = writeBatch(db);

      // Add the order
      const orderRef = doc(db, "orders", o.id);
      batch.set(orderRef, o);

      // Update stock (and stockStatus) for each item
      if (o.items) {
        for (const item of o.items) {
          if (item.id) {
            const productRef = doc(db, "products", item.id);
            const currentProduct = products.find(p => p.id === item.id);
            if (currentProduct) {
              const newStock = currentProduct.stock - item.qty;
              batch.update(productRef, {
                stock: increment(-item.qty),
                stockStatus: newStock <= 10 ? "warn" : "ok",
              });
            } else {
              batch.update(productRef, { stock: increment(-item.qty) });
            }
          }
        }
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "orders/" + o.id);
    }
  };

  const addBantuan = async (b: Bantuan) => {
    try {
      await setDoc(doc(db, "bantuan", b.id), b);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "bantuan/" + b.id);
    }
  };

  const updateStoreSettings = async (settings: StoreSettings) => {
    try {
      await setDoc(doc(db, "settings", "toko"), settings, { merge: true });
    } catch (e) {
      console.error("Failed to update store settings", e);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: Order["status"], staffName?: string) => {
    try {
      const orderRef = doc(db, "orders", id);
      const updates: any = { status: newStatus };
      if (staffName !== undefined) updates.staff = staffName;
      
      const orderSnap = orders.find(o => o.id === id);
      if (!orderSnap) return;

      const batch = writeBatch(db);
      batch.update(orderRef, updates);

      // If cancelled, return stock
      if (newStatus === "dibatalkan" && orderSnap.status !== "dibatalkan") {
        if (orderSnap.items) {
          for (const item of orderSnap.items) {
            if (item.id) {
              const productRef = doc(db, "products", item.id);
              const currentProduct = products.find(p => p.id === item.id);
              const restoredStock = (currentProduct?.stock ?? 0) + item.qty;
              batch.update(productRef, {
                stock: increment(item.qty),
                stockStatus: restoredStock > 10 ? "ok" : "warn",
              });
            }
          }
        }
      }
      // If moved from dibatalkan back to something else, deduct stock again
      else if (orderSnap.status === "dibatalkan" && newStatus !== "dibatalkan") {
        if (orderSnap.items) {
          for (const item of orderSnap.items) {
            if (item.id) {
              const productRef = doc(db, "products", item.id);
              const currentProduct = products.find(p => p.id === item.id);
              const newStock = (currentProduct?.stock ?? 0) - item.qty;
              batch.update(productRef, {
                stock: increment(-item.qty),
                stockStatus: newStock <= 10 ? "warn" : "ok",
              });
            }
          }
        }
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "orders/" + id);
    }
  };

  const cancelOrder = async (id: string) => {
    await updateOrderStatus(id, "dibatalkan", "");
  };

  const updateBantuan = async (b: Bantuan) => {
    try {
      await setDoc(doc(db, "bantuan", b.id), b);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "bantuan/" + b.id);
    }
  };

  const deleteBantuan = async (id: string) => {
    try {
      await deleteDoc(doc(db, "bantuan", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "bantuan/" + id);
    }
  };

  return (
    <DatabaseContext.Provider value={{
      products, orders, members, bantuan, userProfile, storeSettings, updateStoreSettings, addProduct, updateProduct, deleteProduct, deleteOrder, addOrder, addBantuan, updateBantuan, deleteBantuan, cancelOrder, updateOrderStatus, loading
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be used within DatabaseProvider");
  return ctx;
}
// sync-trigger
