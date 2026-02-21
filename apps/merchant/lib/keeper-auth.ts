const STORAGE_KEY = 'pures_keeper_token';
const STORE_ID_KEY = 'pures_keeper_store_id';
const EXPIRY_KEY = 'pures_keeper_expiry';
const OFFLINE_MODE_KEY = 'pures_keeper_offline';
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function getStoredKeeperToken(): string | null {
	if (typeof window === 'undefined') return null;
	const token = sessionStorage.getItem(STORAGE_KEY);
	const expiry = sessionStorage.getItem(EXPIRY_KEY);
	if (!token || !expiry) return null;
	if (Date.now() > parseInt(expiry, 10)) {
		clearKeeperSession();
		return null;
	}
	return token;
}

export function isKeeperOfflineMode(): boolean {
	if (typeof window === 'undefined') return false;
	return sessionStorage.getItem(OFFLINE_MODE_KEY) === 'true';
}

export function getStoredKeeperStoreId(): string | null {
	if (typeof window === 'undefined') return null;
	const storeId = sessionStorage.getItem(STORE_ID_KEY);
	const expiry = sessionStorage.getItem(EXPIRY_KEY);
	if (!storeId || !expiry) return null;
	if (Date.now() > parseInt(expiry, 10)) {
		clearKeeperSession();
		return null;
	}
	return storeId;
}

export function setKeeperSession(
	token: string,
	storeId: string,
	offlineMode: boolean = false,
): void {
	if (typeof window === 'undefined') return;

	// Validate inputs
	if (!token || !storeId) {
		console.error('Invalid keeper session data:', { token, storeId });
		return;
	}

	sessionStorage.setItem(STORAGE_KEY, token);
	sessionStorage.setItem(STORE_ID_KEY, storeId);
	sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + EXPIRY_MS));
	sessionStorage.setItem(OFFLINE_MODE_KEY, String(offlineMode));

	// Verify data was stored (debug sessionStorage issues)
	const verify_token = sessionStorage.getItem(STORAGE_KEY);
	const verify_storeId = sessionStorage.getItem(STORE_ID_KEY);
	if (!verify_token || !verify_storeId) {
		console.error('Failed to store keeper session to sessionStorage');
	}
}

export function clearKeeperSession(): void {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(STORAGE_KEY);
	sessionStorage.removeItem(STORE_ID_KEY);
	sessionStorage.removeItem(EXPIRY_KEY);
	sessionStorage.removeItem(OFFLINE_MODE_KEY);
}

export function isKeeperUnlocked(): boolean {
	return getStoredKeeperToken() != null;
}
