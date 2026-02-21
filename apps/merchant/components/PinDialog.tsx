'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { validateWorker } from '@/lib/offline-worker-auth';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { AlertTriangle } from 'lucide-react';

interface PinDialogProps {
	onCancel: () => void;
	onPinVerified: (workerId: string, workerName: string) => void;
	onNavigateToWorkers?: () => void; // Callback to navigate to workers page
	workers?: { id: string; name: string }[];
	storeId?: string; // Optional: if not provided, will try to get from localStorage
}

export function PinDialog({
	onCancel,
	onPinVerified,
	onNavigateToWorkers,
	workers = [],
	storeId: propStoreId,
}: PinDialogProps) {
	const [pin, setPin] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { isOnline } = useNetworkStatus();
	const { auth } = useStoreAuth();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			// Get store ID from props first, then localStorage
			let storeId = propStoreId;
			if (!storeId) {
				const authData = localStorage.getItem('pores_store_auth');
				storeId = authData ? JSON.parse(authData).store?.id : null;
			}

			if (!storeId) {
				setError('Store information missing');
				return;
			}

			// Try offline validation first (for consistency)
			// If offline, this is the only option
			const offlineResult = await validateWorker(
				pin,
				storeId,
				auth?.token || '',
				isOnline,
			);

			if (offlineResult) {
				onPinVerified(offlineResult.workerId, offlineResult.name);
				setPin('');
				return;
			}

			// If offline and validation failed, show error
			if (!isOnline) {
				setError(
					'Invalid PIN. Working offline - make sure to sync when online.',
				);
				return;
			}

			// Online but validate failed - check server
			// Try server validation as fallback or enhancement
			const headers: HeadersInit = {
				'Content-Type': 'application/json',
				'x-store-id': storeId,
			};

			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const response = await fetch('/api/auth/verify-pin', {
				method: 'POST',
				headers,
				body: JSON.stringify({ pin }),
			});

			if (!response.ok) {
				const data = await response.json();
				if (data.code === 'NO_PIN_SETUP') {
					setError('no-pin-setup');
				} else {
					setError(data.error || 'Invalid worker PIN');
				}
				return;
			}

			const data = await response.json();
			onPinVerified(data.workerId, data.workerName);
			setPin('');
		} catch (error) {
			console.error('PIN validation error:', error);
			setError('Failed to verify PIN');
		} finally {
			setIsLoading(false);
		}
	};

	// Show PIN setup prompt if no PIN is configured
	if (error === 'no-pin-setup') {
		return (
			<Modal
				isOpen={true}
				onClose={onCancel}
				title="Worker PIN Required"
				size="sm"
			>
				<div className="space-y-4">
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h3 className="font-semibold text-blue-900 mb-2">
							⚠️ No Transaction Approval PIN Set Up
						</h3>
						<p className="text-sm text-blue-800 mb-3">
							Worker PINs are required for transaction approval. Please create a
							PIN in the Team settings first.
						</p>
						<p className="text-xs text-blue-700">
							Go to <strong>Team</strong> page to create a worker PIN for
							transaction approval.
						</p>
					</div>

					<div className="flex gap-3">
						<Button
							variant="secondary"
							size="md"
							onClick={onCancel}
							className="flex-1"
						>
							Later
						</Button>
						<Button
							variant="primary"
							size="md"
							onClick={() => {
								onNavigateToWorkers?.();
								onCancel();
							}}
							className="flex-1"
						>
							👥 Go to Team
						</Button>
					</div>
				</div>
			</Modal>
		);
	}

	return (
		<Modal
			isOpen={true}
			onClose={onCancel}
			title="Worker Verification"
			size="sm"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<p className="text-gray-600 mb-4">
					Enter your worker PIN to complete this transaction:
				</p>

				{!isOnline && (
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
						<AlertTriangle
							size={16}
							className="text-amber-700 flex-shrink-0 mt-0.5"
						/>
						<p className="text-xs text-amber-800">
							Working offline - PIN validation uses locally cached data
						</p>
					</div>
				)}

				<Input
					label="Worker PIN"
					type="password"
					value={pin}
					onChange={(e) => setPin(e.target.value)}
					placeholder="Enter PIN"
					error={error}
					autoFocus
				/>

				<div className="flex gap-3">
					<Button
						variant="secondary"
						size="md"
						onClick={onCancel}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="md"
						isLoading={isLoading}
						className="flex-1"
					>
						Verify
					</Button>
				</div>
			</form>
		</Modal>
	);
}
