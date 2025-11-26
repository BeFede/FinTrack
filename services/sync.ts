
import { db, STORES } from './db';
import { supabase } from './supabase';
import { BaseEntity } from '../types';

/**
 * SyncService handles the bi-directional data flow.
 * 
 * Strategy:
 * 1. PUSH: Find all local items where `isSynced` is false. Upsert them to Supabase.
 * 2. PULL: Fetch all items from Supabase where `updated_at` > last_sync_time. Update local DB.
 */

const SYNC_KEY = 'last_sync_timestamp';

export const SyncService = {
  
  async syncAll(userId: string) {
    if (!supabase) return { success: false, error: 'No Supabase config' };

    try {
      // We sync each store sequentially
      await this.syncStore(STORES.TRANSACTIONS, 'transactions', userId);
      await this.syncStore(STORES.CREDIT_CARDS, 'credit_cards', userId);
      await this.syncStore(STORES.RECURRING, 'recurring', userId);
      await this.syncStore(STORES.ASSETS, 'assets', userId);
      await this.syncStore(STORES.BUDGETS, 'budgets', userId);
      await this.syncStore(STORES.SETTINGS, 'settings', userId);

      localStorage.setItem(SYNC_KEY, Date.now().toString());
      return { success: true };
    } catch (error) {
      console.error("Sync failed:", error);
      return { success: false, error };
    }
  },

  async syncStore(localStoreName: string, remoteTableName: string, userId: string) {
    if (!supabase) return;

    // --- 1. PUSH LOCAL CHANGES ---
    const allLocal = await db.getAll<BaseEntity>(localStoreName);
    const unsynced = allLocal.filter(item => !item.isSynced);

    if (unsynced.length > 0) {
      const payload = unsynced.map(item => ({
        id: item.id,
        user_id: userId,
        data: item, // We store the whole JSON blob for simplicity
        updated_at: item.updatedAt
      }));

      const { error } = await supabase.from(remoteTableName).upsert(payload);

      if (!error) {
        // Mark as synced locally
        for (const item of unsynced) {
          await db.update(localStoreName, { ...item, isSynced: true });
        }
      } else {
        console.error(`Failed to push to ${remoteTableName}`, error);
      }
    }

    // --- 2. PULL REMOTE CHANGES ---
    // In a real app, track lastSync per table. Here we grab everything or based on global time.
    const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0');
    
    const { data: remoteData, error: pullError } = await supabase
      .from(remoteTableName)
      .select('*')
      .gt('updated_at', lastSync);

    if (!pullError && remoteData && remoteData.length > 0) {
      for (const row of remoteData) {
        const item = row.data as BaseEntity;
        // Check if our local version is newer (conflict resolution: last write wins)
        const localVersion = allLocal.find(l => l.id === item.id);
        
        if (!localVersion || localVersion.updatedAt < item.updatedAt) {
            // Remote is newer, update local
            await db.update(localStoreName, { ...item, isSynced: true });
        }
      }
    }
  }
};
