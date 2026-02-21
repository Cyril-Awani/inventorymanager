/**
 * Sync manager for offline-first POS system
 * Handles syncing sales, credits, and other data when online
 */

import {
	db,
	syncSalesToServer,
	syncCreditsToServer,
	getOfflineWorkers,
} from './db';
import { getNetworkStatus, updateSyncState, getSyncState } from './network';
import { getStoredKeeperToken, getStoredKeeperStoreId } from './keeper-auth';

let isSyncing = false;
let syncTimeout: NodeJS.Timeout | null = null;

export async function performFullSync(): Promise<void> {
	if (!getNetworkStatus()) {
		console.log('Not syncing - offline');
		return;
	}

	if (isSyncing) {
		console.log('Sync already in progress');
		return;
	}

	isSyncing = true;
	const state = getSyncState();

	try {
		console.log('Starting offline sync...');

		// Sync sales
		await syncSalesToServer();

		// Sync credits
		await syncCreditsToServer();

		// Count remaining unsynced items
		const unsyncedSales = await db.sales.filter((s) => !s.synced).toArray();
		const unsyncedCredits = await db.credits.filter((c) => !c.synced).toArray();

		updateSyncState({
			lastSyncTime: Date.now(),
			pendingSales: unsyncedSales.length,
			pendingCredits: unsyncedCredits.length,
			lastError: undefined,
		});

		console.log('✓ Sync complete', {
			unsyncedSales: unsyncedSales.length,
			unsyncedCredits: unsyncedCredits.length,
		});
	} catch (error) {
		console.error('✗ Sync failed:', error);
		updateSyncState({
			lastError: String(error),
		});
	} finally {
		isSyncing = false;
	}
}

export function scheduleSyncWhenOnline(delayMs: number = 5000): void {
	if (syncTimeout) {
		clearTimeout(syncTimeout);
	}

	syncTimeout = setTimeout(() => {
		if (getNetworkStatus()) {
			performFullSync().catch(console.error);
		}
	}, delayMs);
}

export function cancelScheduledSync(): void {
	if (syncTimeout) {
		clearTimeout(syncTimeout);
		syncTimeout = null;
	}
}

// Sync worker PIN data when online
export async function syncWorkerDataFromServer(storeAuth: {
	token: string;
	store: { id: string };
}): Promise<void> {
	if (!getNetworkStatus()) {
		console.log('Not syncing workers - offline');
		return;
	}

	try {
		const response = await fetch('/api/workers', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${storeAuth.token}`,
				'x-store-id': storeAuth.store.id,
			},
		});

		if (!response.ok) {
			console.error('Failed to fetch workers:', response.status);
			return;
		}

		const workers = await response.json();

		// Store workers locally for offline use
		if (Array.isArray(workers)) {
			await db.workers.clear();
			const workersWithPins = workers.map((w: any) => ({
				workerId: w.id,
				name: w.name,
				pin: w.pin || '', // Server should provide PIN hash
				createdAt: Date.now(),
				lastSynced: Date.now(),
			}));
			await db.workers.bulkAdd(workersWithPins);
			console.log('✓ Synced', workers.length, 'workers to offline storage');
		}
	} catch (error) {
		console.error('Failed to sync workers:', error);
	}
}

export async function isSyncInProgress(): Promise<boolean> {
	return isSyncing;
}

export async function getSyncStatus(): Promise<{
	isSyncing: boolean;
	lastSyncTime: number;
	pendingSales: number;
	pendingCredits: number;
	lastError?: string;
}> {
	const state = getSyncState();
	const unsyncedSales = await db.sales.filter((s) => !s.synced).toArray();
	const unsyncedCredits = await db.credits.filter((c) => !c.synced).toArray();

	return {
		isSyncing,
		lastSyncTime: state.lastSyncTime,
		pendingSales: unsyncedSales.length,
		pendingCredits: unsyncedCredits.length,
		lastError: state.lastError,
	};
}
