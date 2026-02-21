'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import {
	getStoredKeeperToken,
	setKeeperSession,
	clearKeeperSession,
} from '@/lib/keeper-auth';
import {
	recordKeeperUnlock,
	isKeeperSessionExpired,
} from '@/lib/keeper-session-timeout';
import { PinDialog } from './PinDialog';
import { getStoredWorker, setWorkerSession } from '@/lib/worker-auth';
import { useStoreAuth } from '@/hooks/use-store-auth';

interface KeeperGateProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	allowWorkers?: boolean;
}

export function KeeperGate({
	children,
	title = 'Store keeper access',
	description = 'Enter the store keeper password to access this page. Only the store keeper can manage workers and sensitive settings.',
	allowWorkers = false,
}: KeeperGateProps) {
	const { auth, isLoading } = useStoreAuth();
	const [unlocked, setUnlocked] = useState(false);
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [needSetup, setNeedSetup] = useState(false);
	const [showPinDialog, setShowPinDialog] = useState(false);
	const [workerSession, setWorkerSessionState] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Check auth: Require password immediately on login, or if session expired
	useEffect(() => {
		if (!isLoading && auth) {
			// Store owner is authenticated - check if they have a valid keeper session
			const keeperToken = getStoredKeeperToken();
			if (keeperToken && !isKeeperSessionExpired()) {
				// Session still valid - grant access
				setUnlocked(true);
			} else {
				// No session or session expired - require password
				setUnlocked(false);
			}
		} else if (!isLoading && !auth) {
			// Not authenticated - check for legacy keeper or worker tokens
			setUnlocked(
				!!getStoredKeeperToken() || (allowWorkers && !!getStoredWorker()),
			);
			setWorkerSessionState(getStoredWorker());
		}
	}, [auth, isLoading, allowWorkers]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const action = needSetup ? 'setup' : 'verify';
			const headers: HeadersInit = { 'Content-Type': 'application/json' };

			// If store owner is authenticated, pass their token
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const res = await fetch('/api/auth/store-keeper', {
				method: 'POST',
				headers,
				body: JSON.stringify({ password, action }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				if (data.needSetup) setNeedSetup(true);
				setError(data.error || 'Wrong password');
				return;
			}
			if (data.token && data.storeId) {
				setKeeperSession(data.token, data.storeId);
				recordKeeperUnlock();
				setUnlocked(true);
				setPassword('');
				setNeedSetup(false);

				// Sync workers after successfully unlocking
				if (auth && typeof window !== 'undefined' && navigator.onLine) {
					try {
						const { syncWorkerDataFromServer } =
							await import('@/lib/sync-manager');
						await syncWorkerDataFromServer(auth);
					} catch (error) {
						console.warn('Failed to sync workers on unlock:', error);
						// Don't interrupt the unlock for sync failures
					}
				}
			} else {
				// API returned success but missing token or storeId
				console.error('API returned incomplete keeper data:', data);
				setError('Server error: Missing session data. Please try again.');
			}
		} catch {
			setError('Network error');
		} finally {
			setLoading(false);
		}
	};

	const handleWorkerVerified = (workerId: string, workerName: string) => {
		// workerId === 'keeper' is possible when store keeper entered their password via PIN verify
		if (workerId === 'keeper') {
			recordKeeperUnlock();
			setUnlocked(true);
			setWorkerSessionState(null);
			return;
		}
		const w = { id: workerId, name: workerName };
		setWorkerSession(w);
		setWorkerSessionState(w);
		setUnlocked(true);
		setShowPinDialog(false);
	};

	if (unlocked) {
		return <>{children}</>;
	}

	if (isLoading) {
		return (
			<div className="min-h-[60vh] flex items-center justify-center p-6">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
					<p className="text-gray-600">Checking authentication...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[60vh] flex items-center justify-center p-6">
			<div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-8">
				<div className="flex justify-center mb-6">
					<div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
						<Shield className="w-7 h-7 text-amber-700" />
					</div>
				</div>
				<h1 className="text-xl font-bold text-gray-900 text-center mb-2">
					{title}
				</h1>
				<p className="text-sm text-gray-600 text-center mb-6">{description}</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Store keeper password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Enter password"
						error={error}
						autoComplete="current-password"
					/>
					{needSetup && (
						<p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
							No password set yet. Enter a new password to set up store keeper
							access.
						</p>
					)}
					<Button
						type="submit"
						variant="primary"
						size="lg"
						className="w-full"
						isLoading={loading}
						disabled={!password.trim()}
					>
						<Lock size={18} className="mr-2 inline" />
						{needSetup ? 'Set password & unlock' : 'Unlock'}
					</Button>
				</form>
				{allowWorkers && (
					<>
						<div className="mt-4 text-center">
							<p className="text-sm text-gray-600 mb-2">
								Or verify as a worker
							</p>
							<Button
								variant="secondary"
								onClick={() => setShowPinDialog(true)}
							>
								Verify worker PIN
							</Button>
						</div>
						{showPinDialog && (
							<PinDialog
								onCancel={() => setShowPinDialog(false)}
								onPinVerified={handleWorkerVerified}
								storeId={auth?.store?.id}
								workers={[]}
							/>
						)}
					</>
				)}
			</div>
		</div>
	);
}

export function useKeeperUnlock(): { isUnlocked: boolean; logout: () => void } {
	const [isUnlocked, setIsUnlocked] = useState(false);
	useEffect(() => {
		setIsUnlocked(!!getStoredKeeperToken());
	}, []);
	const logout = () => {
		clearKeeperSession();
		setIsUnlocked(false);
		window.dispatchEvent(new Event('keeper-logout'));
	};
	return { isUnlocked, logout };
}
