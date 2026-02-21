/**
 * Network detection and sync utilities for offline-first POS system
 */

export interface SyncQueue {
	id: string;
	type: 'sale' | 'credit' | 'worker' | 'product';
	data: any;
	timestamp: number;
	retries: number;
}

let isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
let syncListeners: Set<(online: boolean) => void> = new Set();

// Initialize network listeners if in browser
if (typeof window !== 'undefined') {
	window.addEventListener('online', () => {
		isOnline = true;
		console.log('✓ Back online - syncing data...');
		notifySyncListeners(true);
	});

	window.addEventListener('offline', () => {
		isOnline = false;
		console.log('✗ Offline - queuing operations...');
		notifySyncListeners(false);
	});
}

export function getNetworkStatus(): boolean {
	return isOnline;
}

export function onNetworkChange(
	callback: (online: boolean) => void,
): () => void {
	syncListeners.add(callback);
	// Return unsubscribe function
	return () => {
		syncListeners.delete(callback);
	};
}

function notifySyncListeners(online: boolean): void {
	syncListeners.forEach((callback) => {
		try {
			callback(online);
		} catch (e) {
			console.error('Error in network change listener:', e);
		}
	});
}

// HTTP request wrapper that works offline
export async function fetchWithOfflineFallback<T>(
	url: string,
	options?: RequestInit,
	fallback?: T,
): Promise<T> {
	try {
		const response = await fetch(url, {
			...options,
			// Add timeout for slow connections
			signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.warn(`Network request failed (${url}):`, error);
		if (fallback !== undefined) {
			return fallback;
		}
		throw error;
	}
}

// Store sync state
const SYNC_STATE_KEY = 'pores_sync_state';

export interface SyncState {
	lastSyncTime: number;
	pendingSales: number;
	pendingCredits: number;
	lastError?: string;
}

export function getSyncState(): SyncState {
	if (typeof window === 'undefined') {
		return { lastSyncTime: 0, pendingSales: 0, pendingCredits: 0 };
	}

	const stored = localStorage.getItem(SYNC_STATE_KEY);
	if (!stored) {
		return { lastSyncTime: 0, pendingSales: 0, pendingCredits: 0 };
	}

	try {
		return JSON.parse(stored);
	} catch {
		return { lastSyncTime: 0, pendingSales: 0, pendingCredits: 0 };
	}
}

export function setSyncState(state: SyncState): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
}

export function updateSyncState(updates: Partial<SyncState>): void {
	const current = getSyncState();
	setSyncState({ ...current, ...updates });
}
