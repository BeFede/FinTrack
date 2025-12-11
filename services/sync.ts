
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
      await this.syncStore(STORES.CATEGORIES, 'categories', userId);
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
    const allLocal = await db.getAll<BaseEntity>(localStoreName, true);
    const unsynced = allLocal.filter(item => !item.isSynced);

    if (unsynced.length > 0) {
      console.log(`[Sync] Pushing ${unsynced.length} items to ${remoteTableName}`, unsynced);
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
          await db.applySyncUpdate(localStoreName, { ...item, isSynced: true });
        }
        console.log(`[Sync] Push successful for ${remoteTableName}`);
      } else {
        console.error(`[Sync] Failed to push to ${remoteTableName}`, error);
      }
    }

    // --- 2. PULL REMOTE CHANGES ---
    // In a real app, track lastSync per table. Here we grab everything or based on global time.
    const lastSync = parseInt(localStorage.getItem(SYNC_KEY) || '0');

    // SAFETY BUFFER: Subtract 5 minutes to account for clock skew between devices.
    // If Device A (behind) pushes an update, Device B (ahead) might miss it if we use exact lastSync.
    const safetyBuffer = 5 * 60 * 1000;
    const queryTimestamp = Math.max(0, lastSync - safetyBuffer);

    console.log(`[Sync] Pulling from ${remoteTableName} since ${new Date(queryTimestamp).toISOString()}`);

    const { data: remoteData, error: pullError } = await supabase
      .from(remoteTableName)
      .select('*')
      .gt('updated_at', queryTimestamp);

    if (!pullError && remoteData && remoteData.length > 0) {
      console.log(`[Sync] Received ${remoteData.length} items from ${remoteTableName}`);
      for (const row of remoteData) {
        const item = row.data as BaseEntity;
        // Check if our local version is newer (conflict resolution: last write wins)
        const localVersion = allLocal.find(l => l.id === item.id);

        // We update if:
        // 1. We don't have the item locally
        // 2. The remote item is newer than our local copy
        // 3. The timestamps are equal but remote is deleted and local is not (edge case)
        if (!localVersion) {
          console.log(`[Sync] New item from remote: ${item.id} (Deleted: ${item.isDeleted})`);
          await db.applySyncUpdate(localStoreName, { ...item, isSynced: true });
        } else if (item.updatedAt > localVersion.updatedAt) {
          console.log(`[Sync] Updating local item ${item.id} (Remote: ${item.updatedAt}, Local: ${localVersion.updatedAt}, Deleted: ${item.isDeleted})`);
          await db.applySyncUpdate(localStoreName, { ...item, isSynced: true });
        } else {
          console.log(`[Sync] Ignoring remote item ${item.id} (Local is newer or same. Remote: ${item.updatedAt}, Local: ${localVersion.updatedAt})`);
        }
      }
    }
  }
};
