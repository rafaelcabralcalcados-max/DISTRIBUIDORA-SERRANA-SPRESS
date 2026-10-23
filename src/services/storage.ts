import {
  AdminUser,
  CartItem,
  CurrentUser,
  LogisticsOption,
  Manufacturer,
  Order,
  PayoutStatus,
  ProductBox,
  Retailer
} from '../types';
import { auth, db, testConnection } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, getDoc } from 'firebase/firestore';
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
      // Immediate initial fetch to guarantee instant display on first load
      getDocs(collection(db, 'products')).then((snapshot) => {
        if (snapshot.docs.length > 0) {
          this._products = snapshot.docs.map(docSnap => {
            const data = docSnap.data() as ProductBox;
            const sanitized: ProductBox = {
              ...data,
              manufacturerName: 'Distribuidora Serrana Spress'
            };
            if (data.manufacturerName !== 'Distribuidora Serrana Spress') {
              setDoc(doc(db, 'products', docSnap.id), cleanForFirestore(sanitized)).catch(() => {});
            }
            return sanitized;
          });
          window.dispatchEvent(new Event('serron_storage_update'));
        }
      }).catch(err => console.warn('Initial products fetch:', err));

      // 1. Live Cloud Firestore Sync: Products (strictly enforce masked name Distribuidora Serrana Spress)
      onSnapshot(collection(db, 'products'), (snapshot) => {
        const remoteProducts: ProductBox[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as ProductBox;
          remoteProducts.push({
            ...data,
            manufacturerName: 'Distribuidora Serrana Spress'
          });
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
    return this._products.map(p => ({
      ...p,
      manufacturerName: 'Distribuidora Serrana Spress'
    }));
  }

  addProduct(product: ProductBox): ProductBox {
    const sanitizedProduct: ProductBox = {
      ...product,
      manufacturerName: 'Distribuidora Serrana Spress'
    };

    // Optimistic in-memory update
    this._products = [sanitizedProduct, ...this._products.filter(p => p.id !== sanitizedProduct.id)];
    window.dispatchEvent(new Event('serron_storage_update'));

    // Persistent Cloud Firestore write
    try {
      setDoc(doc(db, 'products', sanitizedProduct.id), cleanForFirestore(sanitizedProduct)).catch((err) => {
        console.error('Error writing product to Firestore:', err);
      });
    } catch (e) {
      console.error('Firestore addProduct exception:', e);
    }

    return sanitizedProduct;
  }

  updateProduct(product: ProductBox): void {
    const sanitizedProduct: ProductBox = {
      ...product,
      manufacturerName: 'Distribuidora Serrana Spress'
    };

    const index = this._products.findIndex(p => p.id === sanitizedProduct.id);
    if (index !== -1) {
      this._products[index] = sanitizedProduct;
      window.dispatchEvent(new Event('serron_storage_update'));
    }

    try {
      setDoc(doc(db, 'products', sanitizedProduct.id), cleanForFirestore(sanitizedProduct)).catch((err) => {
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
    try {
      localStorage.removeItem('serrana_cart_guest');
    } catch {
      // ignore
    }
    this.setCurrentUser(null);
  }

  // ==========================================
  // CARTS (STRICTLY ISOLATED PER USER & FIRESTORE BACKED)
  // ==========================================
  private getCartStorageKey(userId?: string | null): string {
    const cleanId = (userId || '').trim();
    return cleanId ? `serrana_cart_user_${cleanId}` : 'serrana_cart_guest';
  }

  getCartForUser(userId?: string | null): CartItem[] {
    try {
      const key = this.getCartStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && item.product && item.boxQuantity > 0);
      }
      return [];
    } catch {
      return [];
    }
  }

  saveCartForUser(items: CartItem[], userId?: string | null): void {
    const cleanItems = (items || []).filter(item => item && item.product && item.boxQuantity > 0);
    const key = this.getCartStorageKey(userId);
    try {
      if (cleanItems.length > 0) {
        localStorage.setItem(key, JSON.stringify(cleanItems));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }

    // If it's an authenticated user, sync to Cloud Firestore
    const cleanId = (userId || '').trim();
    if (cleanId && cleanId !== 'guest') {
      try {
        if (cleanItems.length > 0) {
          setDoc(doc(db, 'user_carts', cleanId), {
            userId: cleanId,
            items: cleanForFirestore(cleanItems),
            updatedAt: new Date().toISOString()
          }).catch(() => {});
        } else {
          deleteDoc(doc(db, 'user_carts', cleanId)).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }

  async fetchUserCart(userId: string): Promise<CartItem[]> {
    if (!userId || userId === 'guest') {
      return this.getCartForUser('guest');
    }

    // Try local storage first
    const localCart = this.getCartForUser(userId);

    // Also check Cloud Firestore
    try {
      const docSnap = await getDoc(doc(db, 'user_carts', userId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.items)) {
          const remoteItems = data.items as CartItem[];
          if (remoteItems.length > 0) {
            this.saveCartForUser(remoteItems, userId);
            return remoteItems;
          }
        }
      }
    } catch (e) {
      console.warn('Firestore fetchUserCart notice:', e);
    }

    return localCart;
  }

  clearCartForUser(userId?: string | null): void {
    const key = this.getCartStorageKey(userId);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }

    const cleanId = (userId || '').trim();
    if (cleanId && cleanId !== 'guest') {
      try {
        deleteDoc(doc(db, 'user_carts', cleanId)).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  // ==========================================
  // ACCOUNT DELETION VALIDATION & EXECUTION
  // ==========================================
  canDeleteAccount(userId: string, role: 'manufacturer' | 'retailer'): {
    allowed: boolean;
    blockingOrders: Order[];
    reason?: string;
  } {
    const allOrders = this.getOrders();

    if (role === 'manufacturer') {
      // Blocking if the manufacturer has items in any order that is NOT yet delivered
      const blockingOrders = allOrders.filter((ord) => {
        const hasMfgItems = ord.items.some((item) => item.manufacturerId === userId);
        const isIncomplete = ord.orderStatus !== 'entregue';
        return hasMfgItems && isIncomplete;
      });

      return {
        allowed: blockingOrders.length === 0,
        blockingOrders,
        reason:
          blockingOrders.length > 0
            ? `Você possui ${blockingOrders.length} pedido(s) pendente(s) para entregar ao Centro de Distribuição ou em trânsito. Para excluir a conta, todos os pedidos devem estar com status 'entregue'.`
            : undefined,
      };
    } else {
      // Retailer: Blocking if retailer has any order that is NOT yet delivered
      const retailer = this._retailers.find((r) => r.id === userId);
      const blockingOrders = allOrders.filter((ord) => {
        const isThisRetailer =
          ord.retailerId === userId || (retailer?.cnpj && ord.retailerCnpj === retailer.cnpj);
        const isIncomplete = ord.orderStatus !== 'entregue';
        return isThisRetailer && isIncomplete;
      });

      return {
        allowed: blockingOrders.length === 0,
        blockingOrders,
        reason:
          blockingOrders.length > 0
            ? `Você possui ${blockingOrders.length} compra(s) com status em andamento. Para excluir a conta, todas as compras devem estar finalizadas e entregues.`
            : undefined,
      };
    }
  }

  async deleteAccountAsync(
    userId: string,
    role: 'manufacturer' | 'retailer'
  ): Promise<{ success: boolean; error?: string }> {
    const check = this.canDeleteAccount(userId, role);
    if (!check.allowed) {
      return {
        success: false,
        error: check.reason || 'Não é possível excluir a conta enquanto houver pedidos pendentes.',
      };
    }

    try {
      if (role === 'manufacturer') {
        // 1. Delete all manufacturer products from Firestore & local state
        const mfgProducts = this._products.filter((p) => p.manufacturerId === userId);
        for (const prod of mfgProducts) {
          try {
            await deleteDoc(doc(db, 'products', prod.id));
          } catch (err) {
            console.warn('Error deleting product from Firestore:', prod.id, err);
          }
        }
        this._products = this._products.filter((p) => p.manufacturerId !== userId);

        // 2. Delete manufacturer profile document
        await deleteDoc(doc(db, 'manufacturers', userId));
        this._manufacturers = this._manufacturers.filter((m) => m.id !== userId);
      } else {
        // Retailer: delete retailer profile document
        await deleteDoc(doc(db, 'retailers', userId));
        this._retailers = this._retailers.filter((r) => r.id !== userId);
      }

      // 3. Try deleting Firebase Auth user if active
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch {
          // If requires recent login or not logged via Firebase auth, silently ignore
        }
      }

      // 4. Clear current session
      await this.logoutUserAsync();
      window.dispatchEvent(new Event('serron_storage_update'));
      window.dispatchEvent(new Event('serron_auth_update'));

      return { success: true };
    } catch (err: any) {
      console.error('Error during account deletion:', err);
      return {
        success: false,
        error: err?.message || 'Falha ao excluir a conta no banco de dados.',
      };
    }
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
