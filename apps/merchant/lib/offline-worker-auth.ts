/**
 * Offline worker authentication
 * Allows worker PIN validation when offline
 */

import { getOfflineWorkers } from './db';
import { createKeeperToken } from './auth';
import { setKeeperSession } from './keeper-auth';

export interface WorkerAuth {
	workerId: string;
	name: string;
	token: string;
}

/**
 * Validate worker PIN offline
 * Returns worker auth if PIN matches, null otherwise
 */
export async function validateWorkerOffline(
	pin: string,
	storeId: string,
): Promise<WorkerAuth | null> {
	try {
		// Get all workers from offline storage
		const workers = await getOfflineWorkers();

		if (workers.length === 0) {
			console.warn('No workers in offline storage - sync workers first');
			return null;
		}

		// Find worker with matching PIN
		// Simple string comparison - ideally the PIN would be hashed
		const matchedWorker = workers.find((w) => w.pin === pin);

		if (!matchedWorker) {
			console.log('Worker PIN not found in offline storage');
			return null;
		}

		// Create session token for this worker
		const token = createKeeperToken();

		// Store in session storage
		setKeeperSession(token, storeId, true); // true = offline mode

		return {
			workerId: matchedWorker.workerId,
			name: matchedWorker.name,
			token,
		};
	} catch (error) {
		console.error('Error validating worker offline:', error);
		return null;
	}
}

/**
 * Validate worker online (connects to server)
 * This is the original server-based validation
 */
export async function validateWorkerOnline(
	pin: string,
	storeId: string,
	storeToken: string,
): Promise<WorkerAuth | null> {
	try {
		const response = await fetch('/api/workers/validate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${storeToken}`,
				'x-store-id': storeId,
			},
			body: JSON.stringify({ pin }),
		});

		if (!response.ok) {
			console.log('Worker validation failed:', response.status);
			return null;
		}

		const data = await response.json();
		const token = createKeeperToken();

		setKeeperSession(token, storeId, false); // false = online mode

		return {
			workerId: data.id,
			name: data.name,
			token,
		};
	} catch (error) {
		console.error('Error validating worker online:', error);
		return null;
	}
}

/**
 * Try online first, fallback to offline
 */
export async function validateWorker(
	pin: string,
	storeId: string,
	storeToken: string,
	isOnline: boolean,
): Promise<WorkerAuth | null> {
	if (isOnline) {
		// Try online first
		try {
			return await validateWorkerOnline(pin, storeId, storeToken);
		} catch (error) {
			console.warn('Online validation failed, trying offline:', error);
			// Fall through to offline validation
		}
	}

	// Use offline validation
	return validateWorkerOffline(pin, storeId);
}
