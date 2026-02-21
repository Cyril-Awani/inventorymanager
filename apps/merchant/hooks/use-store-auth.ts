import { useState, useCallback, useEffect } from 'react';
import { clearKeeperSession } from '@/lib/keeper-auth';
import { clearKeeperSessionConfig } from '@/lib/keeper-session-timeout';

export interface StoreAuth {
	token: string;
	store: {
		id: string;
		email: string;
		businessName: string;
		storeType?: string;
		currency: string;
		setupCompleted: boolean;
	};
}

const STORAGE_KEY = 'pores_store_auth';

export function useStoreAuth() {
	const [auth, setAuth] = useState<StoreAuth | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load auth from storage on mount
	useEffect(() => {
		const init = async () => {
			if (typeof window === 'undefined') return;
			setIsLoading(true);
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				setIsLoading(false);
				return;
			}

			try {
				const parsed = JSON.parse(stored) as StoreAuth;

				// Try to validate token with server. If network fails (offline), keep local auth.
				let res: Response | null = null;
				try {
					res = await fetch('/api/auth/me', {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${parsed.token}`,
						},
					});
				} catch (networkErr) {
					console.warn(
						'Network error validating token — keeping local auth',
						networkErr,
					);
					setAuth(parsed);
					setIsLoading(false);
					return;
				}

				// If token invalid or store missing, clear local storage. For other server errors, keep local auth.
				if (res.status === 401 || res.status === 404) {
					localStorage.removeItem(STORAGE_KEY);
					setAuth(null);
				} else if (!res.ok) {
					setAuth(parsed);
				} else {
					const data = await res.json();
					setAuth({ token: parsed.token, store: data.store });
				}
			} catch (e) {
				console.error('Failed to validate stored auth:', e);
				localStorage.removeItem(STORAGE_KEY);
				setAuth(null);
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Login failed');
			}

			const data = await response.json();
			const authData: StoreAuth = {
				token: data.token,
				store: data.store,
			};
			setAuth(authData);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));

			// Sync worker data for offline use
			if (typeof window !== 'undefined' && navigator.onLine) {
				try {
					const { syncWorkerDataFromServer } = await import('@/lib/sync-manager');
					await syncWorkerDataFromServer(authData);
				} catch (error) {
					console.warn('Failed to sync workers on login:', error);
					// Don't fail the login if worker sync fails
				}
			}

			return authData;
		} finally {
			setIsLoading(false);
		}
	}, []);

	const signup = useCallback(
		async (
			email: string,
			password: string,
			businessName: string,
			currency: string = 'NGN',
		) => {
			setIsLoading(true);
			try {
				const response = await fetch('/api/auth/signup', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, businessName, currency }),
				});

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.error || 'Signup failed');
				}

				const data = await response.json();
				const authData: StoreAuth = {
					token: data.token,
					store: data.store,
				};
				setAuth(authData);
				localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
				return authData;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	const logout = useCallback(() => {
		setAuth(null);
		localStorage.removeItem(STORAGE_KEY);
		clearKeeperSession();
		clearKeeperSessionConfig();
	}, []);

	const updateStore = useCallback((storeData: Partial<StoreAuth['store']>) => {
		setAuth((prev) => {
			if (!prev) return null;
			const updated: StoreAuth = {
				...prev,
				store: { ...prev.store, ...storeData },
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			return updated;
		});
	}, []);

	// Periodic token validation: validates the stored token every few minutes
	useEffect(() => {
		const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
		let intervalId: number | null = null;

		const validate = async () => {
			if (!auth?.token) return;
			if (typeof window === 'undefined') return;
			if (!navigator.onLine) return; // skip when offline

			try {
				const res = await fetch('/api/auth/me', {
					method: 'GET',
					headers: { Authorization: `Bearer ${auth.token}` },
				});

				if (res.status === 401 || res.status === 404) {
					// token invalid or store removed — clear local auth
					localStorage.removeItem(STORAGE_KEY);
					setAuth(null);
				} else if (res.ok) {
					const data = await res.json();
					// keep local token but refresh store data if changed
					setAuth((prev) => {
						if (!prev)
							return {
								token: prev?.token ?? auth.token,
								store: data.store,
							} as StoreAuth;
						const updated: StoreAuth = { token: prev.token, store: data.store };
						localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
						return updated;
					});
				}
			} catch (e) {
				// network or other errors: keep local auth (we're likely offline)
				console.warn('Periodic token validation failed, keeping local auth', e);
			}
		};

		const onFocus = () => validate();
		const onVisibility = () => {
			if (document.visibilityState === 'visible') validate();
		};

		if (auth?.token) {
			// Run an immediate validation when token is present
			validate();
			// Set periodic validation
			intervalId = window.setInterval(
				validate,
				INTERVAL_MS,
			) as unknown as number;
			window.addEventListener('focus', onFocus);
			document.addEventListener('visibilitychange', onVisibility);
		}

		return () => {
			if (intervalId) clearInterval(intervalId as unknown as number);
			window.removeEventListener('focus', onFocus);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, [auth?.token]);

	return {
		auth,
		isLoading,
		isAuthenticated: !!auth,
		token: auth?.token,
		store: auth?.store,
		login,
		signup,
		logout,
		updateStore,
	};
}
