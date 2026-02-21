import { useState, useEffect, useCallback } from 'react';
import { getNetworkStatus, onNetworkChange } from '@/lib/network';
import { performFullSync, getSyncStatus } from '@/lib/sync-manager';
import { syncWorkerDataFromServer } from '@/lib/sync-manager';

export interface SyncStatusInfo {
	isSyncing: boolean;
	lastSyncTime: number;
	pendingSales: number;
	pendingCredits: number;
	lastError?: string;
}

export function useNetworkStatus() {
	const [isOnline, setIsOnline] = useState(() => {
		if (typeof window === 'undefined') return true;
		return navigator.onLine;
	});

	const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>({
		isSyncing: false,
		lastSyncTime: 0,
		pendingSales: 0,
		pendingCredits: 0,
	});

	// Set up network change listener
	useEffect(() => {
		const unsubscribe = onNetworkChange(async (online) => {
			setIsOnline(online);

			if (online) {
				// Sync data when coming back online
				try {
					await performFullSync();
					const status = await getSyncStatus();
					setSyncStatus(status);
				} catch (error) {
					console.error('Auto-sync failed:', error);
				}
			}
		});

		return unsubscribe;
	}, []);

	const manualSync = useCallback(async () => {
		if (!isOnline) {
			return;
		}
		try {
			await performFullSync();
			const status = await getSyncStatus();
			setSyncStatus(status);
		} catch (error) {
			console.error('Manual sync failed:', error);
		}
	}, [isOnline]);

	const syncWorkers = useCallback(
		async (storeAuth: { token: string; store: { id: string } }) => {
			if (!isOnline) {
				return;
			}
			try {
				await syncWorkerDataFromServer(storeAuth);
			} catch (error) {
				console.error('Worker sync failed:', error);
			}
		},
		[isOnline],
	);

	return {
		isOnline,
		syncStatus,
		manualSync,
		syncWorkers,
	};
}
