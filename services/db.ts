import { FinancialState, BaseEntity, AppSettings } from '../types';
import { INITIAL_STATE } from '../constants';

const DB_NAME = 'FinTrackDB';
const DB_VERSION = 2;

export const STORES = {
  TRANSACTIONS: 'transactions',
  CREDIT_CARDS: 'creditCards',
  RECURRING: 'recurring',
  ASSETS: 'assets',
  BUDGETS: 'budgets',
  CATEGORIES: 'categories',
  SETTINGS: 'settings'
};

class DBService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // --- Generic CRUD Operations ---

  async getAll<T>(storeName: string, includeDeleted = false): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as (T & { isDeleted?: boolean })[];
        if (includeDeleted) {
          resolve(results);
        } else {
          resolve(results.filter(item => !item.isDeleted));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async add<T extends BaseEntity>(storeName: string, item: T): Promise<T> {
    const enrichedItem = {
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSynced: false,
      isDeleted: false
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.add(enrichedItem);

      tx.oncomplete = () => resolve(enrichedItem);
      tx.onerror = () => reject(tx.error);
    });
  }

  async update<T extends BaseEntity>(storeName: string, item: T): Promise<T> {
    const updatedItem = {
      ...item,
      updatedAt: Date.now(),
      isSynced: false // Mark as unsynced so backend picks it up
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(updatedItem);

      tx.oncomplete = () => resolve(updatedItem);
      tx.onerror = () => reject(tx.error);
    });
  }

  async applySyncUpdate<T extends BaseEntity>(storeName: string, item: T): Promise<T> {
    // This method is used by SyncService to apply remote changes.
    // We trust the remote item's properties (including updatedAt and isDeleted).
    // We explicitly set isSynced to true.
    const syncedItem = {
      ...item,
      isSynced: true
    };
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(syncedItem);

      tx.oncomplete = () => resolve(syncedItem);
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const deletedItem = {
            ...item,
            isDeleted: true,
            isSynced: false,
            updatedAt: Date.now()
          };
          store.put(deletedItem);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Special Operations ---

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    // Ensure we always update the same ID for settings
    const s = { ...settings, id: 'settings_default' };
    return this.update(STORES.SETTINGS, s);
  }

  async loadFullState(): Promise<FinancialState> {
    if (!this.db) await this.init();

    const transactions = await this.getAll<any>(STORES.TRANSACTIONS);
    const creditCards = await this.getAll<any>(STORES.CREDIT_CARDS);
    const recurring = await this.getAll<any>(STORES.RECURRING);
    const assets = await this.getAll<any>(STORES.ASSETS);
    const budgets = await this.getAll<any>(STORES.BUDGETS);
    const categories = await this.getAll<any>(STORES.CATEGORIES);
    const settingsArr = await this.getAll<any>(STORES.SETTINGS);

    let settings = settingsArr[0];

    // Seed Initial Data if empty (first run)
    if (transactions.length === 0 && settingsArr.length === 0) {
      // Check for localStorage migration
      const localData = localStorage.getItem('fintrack_data');
      if (localData) {
        try {
          console.log("Migrating from LocalStorage...");
          const parsed = JSON.parse(localData);
          await this.seedData(parsed);
          localStorage.removeItem('fintrack_data'); // Cleanup
          return this.loadFullState(); // Reload
        } catch (e) {
          console.error("Migration failed", e);
        }
      }

      // Seed Defaults
      await this.seedData(INITIAL_STATE);
      return INITIAL_STATE;
    }

    return {
      transactions,
      creditCards,
      recurring,
      assets,
      budgets,
      categories,
      settings: settings || INITIAL_STATE.settings
    };
  }


  async clearAllData() {
    if (!this.db) return;

    const tx = this.db.transaction(Object.values(STORES), 'readwrite');

    // Clear all object stores
    Object.values(STORES).forEach(storeName => {
      tx.objectStore(storeName).clear();
    });

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async seedData(data: FinancialState) {
    const base = { createdAt: Date.now(), updatedAt: Date.now(), isSynced: false, isDeleted: false };

    const tx = this.db!.transaction(Object.values(STORES), 'readwrite');

    data.transactions.forEach(t => tx.objectStore(STORES.TRANSACTIONS).put({ ...base, ...t }));
    data.creditCards.forEach(c => tx.objectStore(STORES.CREDIT_CARDS).put({ ...base, ...c }));
    data.recurring.forEach(r => tx.objectStore(STORES.RECURRING).put({ ...base, ...r }));
    data.assets.forEach(a => tx.objectStore(STORES.ASSETS).put({ ...base, ...a }));
    data.budgets.forEach(b => tx.objectStore(STORES.BUDGETS).put({ ...base, ...b, id: (b as any).id || `bud_${Math.random()}` }));
    data.categories.forEach(c => tx.objectStore(STORES.CATEGORIES).put({ ...base, ...c }));

    const settings = { ...base, ...data.settings, id: 'settings_default' };
    tx.objectStore(STORES.SETTINGS).put(settings);

    return new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  }
}

export const db = new DBService();
