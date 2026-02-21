const WORKER_KEY = 'pures_worker';
const WORKER_EXPIRY_KEY = 'pures_worker_expiry';
const WORKER_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function getStoredWorker(): { id: string; name: string } | null {
	if (typeof window === 'undefined') return null;
	const raw = sessionStorage.getItem(WORKER_KEY);
	const expiry = sessionStorage.getItem(WORKER_EXPIRY_KEY);
	if (!raw || !expiry) return null;
	if (Date.now() > parseInt(expiry, 10)) {
		clearWorkerSession();
		return null;
	}
	try {
		return JSON.parse(raw);
	} catch {
		clearWorkerSession();
		return null;
	}
}

export function setWorkerSession(worker: { id: string; name: string }): void {
	if (typeof window === 'undefined') return;
	sessionStorage.setItem(WORKER_KEY, JSON.stringify(worker));
	sessionStorage.setItem(
		WORKER_EXPIRY_KEY,
		String(Date.now() + WORKER_EXPIRY_MS),
	);
}

export function clearWorkerSession(): void {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(WORKER_KEY);
	sessionStorage.removeItem(WORKER_EXPIRY_KEY);
}

export function isWorkerUnlocked(): boolean {
	return getStoredWorker() != null;
}
