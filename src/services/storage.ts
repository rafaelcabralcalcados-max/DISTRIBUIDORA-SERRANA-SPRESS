import {
  AdminUser,
  CurrentUser,
  LogisticsOption,
  Manufacturer,
  Order,
  PayoutStatus,
  ProductBox,
  Retailer
} from '../types';
import { auth, db, testConnection } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';

// Key strictly for keeping current user session on browser reload
const SESSION_USER_KEY = 'serrana_spress_auth_session';

// Admin credentials specified by the user
export const ADMIN_CREDENTIALS = {
  email: 'rafaelcabraldeoli@gmail.com',
  password: '32255997',
};

// Default platform commission rate for Distribuidora Serrana Spress
export const DEFAULT_COMMISSION_PERCENT = 8.5;

function cleanForFirestore<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj));
}

// PURGE ANY PREVIOUS LOCAL DATABASES COMPLETELY
try {
  const keysToRemove = [
    'serron_hub_products_v1',
    'serron_hub_products_v2',
    'serron_hub_manufacturers_v1',
    'serron_hub_manufacturers_v2',
    'serron_hub_retailers_v1',
    'serron_hub_retailers_v2',
    'serron_hub_orders_v1',
    'serron_hub_orders_v2',
    'serron_hub_current_user_v1',
    'serron_hub_current_user_v2',
    'serron_hub_settings_v2',
  ];
  keysToRemove.forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore in non-browser environments
}

class StorageService {
  // Pure in-memory reactive state fed 100% by Cloud Firestore
  private _products: ProductBox[] = [];
  private _manufacturers: Manufacturer[] = [];
  private _retailers: Retailer[] = [];
  private _orders: Order[] = [];
  private _currentUser: CurrentUser | null = null;
  private _isReady: boolean = false;

  constructor() {
    this.restoreSessionUser();
    this.initFirestoreSync();
  }

  private restoreSessionUser() {
    try {
      const savedSession = localStorage.getItem(SESSION_USER_KEY);
      if (savedSession) {
        this._currentUser = JSON.parse(savedSession);
      }
    } catch {
      this._currentUser = null;
    }
  }

  private initFirestoreSync() {
    // Validate Firestore connection on boot
    testConnection().then(() => {
      this._isReady = true;
    });

    try {
      // 1. Live Cloud Firestore Sync: Products
      onSnapshot(collection(db, 'products'), (snapshot) => {
        const remoteProducts: ProductBox[] = [];
        snapshot.forEach((docSnap) => {
          remoteProducts.push(docSnap.data() as ProductBox);
        });
        this._products = remoteProducts;
        window.dispatchEvent(new Event('serron_storage_update'));
      }, (error) => {
        console.warn('Firestore products listener:', error.message);
      });

      // 2. Live Cloud Firestore Sync: Manufacturers
      onSnapshot(collection(db, 'manufacturers'), (snapshot) => {
        const remoteMfg: Manufacturer[] = [];
        snapshot.forEach((docSnap) => {
          remoteMfg.push(docSnap.data() as Manufacturer);
        });
        this._manufacturers = remoteMfg;
        window.dispatchEvent(new Event('serron_storage_update'));
      }, (error) => {
        console.warn('Firestore manufacturers listener:', error.message);
      });

      // 3. Live Cloud Firestore Sync: Retailers
      onSnapshot(collection(db, 'retailers'), (snapshot) => {
        const remoteRet: Retailer[] = [];
        snapshot.forEach((docSnap) => {
          remoteRet.push(docSnap.data() as Retailer);
        });
        this._retailers = remoteRet;
        window.dispatchEvent(new Event('serron_storage_update'));
      }, (error) => {
        console.warn('Firestore retailers listener:', error.message);
      });

      // 4. Live Cloud Firestore Sync: Orders
      onSnapshot(collection(db, 'orders'), (snapshot) => {
        const remoteOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          remoteOrders.push(docSnap.data() as Order);
        });
        this._orders = remoteOrders;
        window.dispatchEvent(new Event('serron_storage_update'));
      }, (error) => {
        console.warn('Firestore orders listener:', error.message);
      });
    } catch (e) {
      console.warn('Firestore realtime listeners deferred:', e);
    }
  }

  // ==========================================
  // PRODUCTS (EXCLUSIVELY CLOUD FIRESTORE)
  // ==========================================
  getProducts(): ProductBox[] {
    return this._products;
  }

  addProduct(product: ProductBox): ProductBox {
    // Optimistic in-memory update
    this._products = [product, ...this._products.filter(p => p.id !== product.id)];
    window.dispatchEvent(new Event('serron_storage_update'));

    // Persistent Cloud Firestore write
    try {
      setDoc(doc(db, 'products', product.id), cleanForFirestore(product)).catch((err) => {
        console.error('Error writing product to Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore addProduct exception:', e);
    }

    return product;
  }

  updateProduct(product: ProductBox): void {
    const index = this._products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      this._products[index] = product;
      window.dispatchEvent(new Event('serron_storage_update'));
    }

    try {
      setDoc(doc(db, 'products', product.id), cleanForFirestore(product)).catch((err) => {
        console.error('Error updating product in Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore updateProduct exception:', e);
    }
  }

  deleteProduct(id: string): void {
    this._products = this._products.filter(p => p.id !== id);
    window.dispatchEvent(new Event('serron_storage_update'));

    try {
      deleteDoc(doc(db, 'products', id)).catch((err) => {
        console.error('Error deleting product from Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore deleteProduct exception:', e);
    }
  }

  // ==========================================
  // MANUFACTURERS (EXCLUSIVELY CLOUD FIRESTORE)
  // ==========================================
  getManufacturers(): Manufacturer[] {
    return this._manufacturers;
  }

  addManufacturer(m: Manufacturer): Manufacturer {
    this._manufacturers = [...this._manufacturers.filter(item => item.id !== m.id), m];
    window.dispatchEvent(new Event('serron_storage_update'));

    try {
      setDoc(doc(db, 'manufacturers', m.id), cleanForFirestore(m)).catch((err) => {
        console.error('Error writing manufacturer to Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore addManufacturer exception:', e);
    }

    return m;
  }

  updateManufacturer(m: Manufacturer): void {
    const index = this._manufacturers.findIndex(item => item.id === m.id);
    if (index !== -1) {
      this._manufacturers[index] = m;
      if (this._currentUser && this._currentUser.id === m.id) {
        this.setCurrentUser(m);
      }
      window.dispatchEvent(new Event('serron_storage_update'));
    }

    try {
      setDoc(doc(db, 'manufacturers', m.id), cleanForFirestore(m)).catch((err) => {
        console.error('Error updating manufacturer in Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore updateManufacturer exception:', e);
    }
  }

  getManufacturerById(id: string): Manufacturer | undefined {
    return this._manufacturers.find(m => m.id === id);
  }

  // ==========================================
  // RETAILERS (EXCLUSIVELY CLOUD FIRESTORE)
  // ==========================================
  getRetailers(): Retailer[] {
    return this._retailers;
  }

  addRetailer(r: Retailer): Retailer {
    this._retailers = [...this._retailers.filter(item => item.id !== r.id), r];
    window.dispatchEvent(new Event('serron_storage_update'));

    try {
      setDoc(doc(db, 'retailers', r.id), cleanForFirestore(r)).catch((err) => {
        console.error('Error writing retailer to Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore addRetailer exception:', e);
    }

    return r;
  }

  updateRetailer(r: Retailer): void {
    const index = this._retailers.findIndex(item => item.id === r.id);
    if (index !== -1) {
      this._retailers[index] = r;
      if (this._currentUser && this._currentUser.id === r.id) {
        this.setCurrentUser(r);
      }
      window.dispatchEvent(new Event('serron_storage_update'));
    }

    try {
      setDoc(doc(db, 'retailers', r.id), cleanForFirestore(r)).catch((err) => {
        console.error('Error updating retailer in Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore updateRetailer exception:', e);
    }
  }

  // ==========================================
  // ORDERS (EXCLUSIVELY CLOUD FIRESTORE)
  // ==========================================
  getOrders(): Order[] {
    return this._orders;
  }

  addOrder(order: Order): Order {
    this._orders = [order, ...this._orders.filter(o => o.id !== order.id)];
    window.dispatchEvent(new Event('serron_storage_update'));

    try {
      setDoc(doc(db, 'orders', order.id), cleanForFirestore(order)).catch((err) => {
        console.error('Error writing order to Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore addOrder exception:', e);
    }

    return order;
  }

  updateOrderLogistics(orderId: string, logistics: LogisticsOption): void {
    const index = this._orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this._orders[index].logistics = logistics;
      this._orders[index].orderStatus = 'logistica_definida';
      window.dispatchEvent(new Event('serron_storage_update'));

      try {
        setDoc(doc(db, 'orders', orderId), cleanForFirestore(this._orders[index])).catch((err) => {
          console.error('Error updating order logistics in Firestore:', err);
        });
      } catch (e) {
        console.error('Firestore updateOrderLogistics exception:', e);
      }
    }
  }

  updateOrderPayout(orderId: string, status: PayoutStatus, receiptNote?: string): void {
    const index = this._orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      this._orders[index].payoutStatus = status;
      if (receiptNote) {
        this._orders[index].payoutReceiptNote = receiptNote;
      }
      if (status === 'repassado') {
        this._orders[index].payoutDate = new Date().toISOString();
      }
      window.dispatchEvent(new Event('serron_storage_update'));

      try {
        setDoc(doc(db, 'orders', orderId), cleanForFirestore(this._orders[index])).catch((err) => {
          console.error('Error updating order payout in Firestore:', err);
        });
      } catch (e) {
        console.error('Firestore updateOrderPayout exception:', e);
      }
    }
  }

  // ==========================================
  // CURRENT AUTH USER SESSION
  // ==========================================
  getCurrentUser(): CurrentUser | null {
    return this._currentUser;
  }

  setCurrentUser(user: CurrentUser | null): void {
    this._currentUser = user;
    try {
      if (user) {
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_USER_KEY);
      }
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('serron_auth_update'));
  }

  // UNIFIED AUTHENTICATION (SYNC CHECK)
  authenticateUser(email: string, pass: string): CurrentUser | null {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Master Administrator Credentials
    if (
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      cleanPass === ADMIN_CREDENTIALS.password
    ) {
      const adminUser: AdminUser = {
        id: 'admin-serrana-master',
        role: 'admin',
        name: 'Rafael Cabral (Administrador Distribuidora Serrana Spress)',
        email: ADMIN_CREDENTIALS.email,
      };
      this.setCurrentUser(adminUser);
      return adminUser;
    }

    // 2. Match Manufacturer
    const foundMfg = this._manufacturers.find(
      (m) => m.email.toLowerCase() === cleanEmail && (!m.password || m.password === cleanPass)
    );
    if (foundMfg) {
      this.setCurrentUser(foundMfg);
      return foundMfg;
    }

    // 3. Match Retailer
    const foundRet = this._retailers.find(
      (r) => r.email.toLowerCase() === cleanEmail && (!r.password || r.password === cleanPass)
    );
    if (foundRet) {
      this.setCurrentUser(foundRet);
      return foundRet;
    }

    return null;
  }

  // FIREBASE AUTHENTICATION (ASYNC VALIDATION)
  async authenticateUserAsync(email: string, pass: string): Promise<CurrentUser | null> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (
      cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() &&
      cleanPass === ADMIN_CREDENTIALS.password
    ) {
      return this.authenticateUser(email, pass);
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      console.log('Firebase Auth: Sign in validated for', cleanEmail);
    } catch (authError: any) {
      console.warn('Firebase Auth notice:', authError?.code || authError?.message);
    }

    return this.authenticateUser(email, pass);
  }

  // CREATE USER IN FIREBASE AUTH
  async createAuthUserAsync(email: string, pass: string): Promise<string | null> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass.trim());
      console.log('Firebase Auth user created with UID', userCredential.user.uid);
      return userCredential.user.uid;
    } catch (e: any) {
      console.warn('Firebase Auth createUser notice:', e?.code || e?.message);
      return null;
    }
  }

  // LOGOUT
  async logoutUserAsync(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    this.setCurrentUser(null);
  }

  syncLocalToCloud(): void {
    window.dispatchEvent(new Event('serron_storage_update'));
  }

  seedSampleData(): void {
    // Intentionally empty: Zero fake or mock data allowed.
  }

  // PURGE ALL DATA DIRECTLY FROM CLOUD FIRESTORE
  async clearDatabase(): Promise<void> {
    try {
      // Delete all products from Firestore
      const prodSnaps = await getDocs(collection(db, 'products'));
      prodSnaps.forEach((d) => deleteDoc(doc(db, 'products', d.id)));

      // Delete all orders from Firestore
      const orderSnaps = await getDocs(collection(db, 'orders'));
      orderSnaps.forEach((d) => deleteDoc(doc(db, 'orders', d.id)));
    } catch (e) {
      console.warn('Clear Firestore collections notice:', e);
    }

    this._products = [];
    this._orders = [];
    this._currentUser = null;
    try {
      localStorage.removeItem(SESSION_USER_KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('serron_storage_update'));
    window.dispatchEvent(new Event('serron_auth_update'));
  }
}

export const storageService = new StorageService();
