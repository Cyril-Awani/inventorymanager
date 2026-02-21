// Manages keeper session timeout for re-authenticating after inactivity
interface KeeperSessionConfig {
	timeoutMinutes: number;
	lastUnlockTime: number;
}

const SESSION_CONFIG_KEY = 'pores_keeper_session_config';
const DEFAULT_TIMEOUT_MINUTES = 30; // Default 30 minutes

export function getSessionConfig(): KeeperSessionConfig {
	if (typeof window === 'undefined') {
		return {
			timeoutMinutes: DEFAULT_TIMEOUT_MINUTES,
			lastUnlockTime: Date.now(),
		};
	}

	const stored = localStorage.getItem(SESSION_CONFIG_KEY);
	if (!stored) {
		return {
			timeoutMinutes: DEFAULT_TIMEOUT_MINUTES,
			lastUnlockTime: Date.now(),
		};
	}

	try {
		return JSON.parse(stored) as KeeperSessionConfig;
	} catch {
		return {
			timeoutMinutes: DEFAULT_TIMEOUT_MINUTES,
			lastUnlockTime: Date.now(),
		};
	}
}

export function setSessionConfig(timeoutMinutes: number): void {
	if (typeof window === 'undefined') return;

	const config: KeeperSessionConfig = {
		timeoutMinutes: Math.max(1, timeoutMinutes), // Minimum 1 minute
		lastUnlockTime: Date.now(),
	};

	localStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(config));
}

export function recordKeeperUnlock(): void {
	if (typeof window === 'undefined') return;

	const config = getSessionConfig();
	config.lastUnlockTime = Date.now();
	localStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(config));
}

export function clearKeeperSessionConfig(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(SESSION_CONFIG_KEY);
}

export function isKeeperSessionExpired(): boolean {
	if (typeof window === 'undefined') return false;

	const config = getSessionConfig();
	const elapsedMinutes = (Date.now() - config.lastUnlockTime) / (1000 * 60);
	return elapsedMinutes > config.timeoutMinutes;
}

export function getKeeperSessionExpiryDate(): Date {
	const config = getSessionConfig();
	return new Date(config.lastUnlockTime + config.timeoutMinutes * 60 * 1000);
}

export function getRemainingSessionTime(): number {
	const config = getSessionConfig();
	const remaining =
		config.timeoutMinutes * 60 * 1000 - (Date.now() - config.lastUnlockTime);
	return Math.max(0, remaining);
}
