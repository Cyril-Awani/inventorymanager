'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Plus, KeyRound, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { KeeperGate } from '@/components/KeeperGate';
import { Card, CardBody, CardHeader } from '@/components/Card';
import {
	getStoredKeeperToken,
	getStoredKeeperStoreId,
} from '@/lib/keeper-auth';

interface Worker {
	id: string;
	name: string;
	createdAt: string;
}

export default function WorkersPage() {
	return (
		<Layout headerHeight="11vh">
			<KeeperGate
				title="Manage workers"
				description="Only the store keeper can add or manage workers. Enter the store keeper password to continue."
			>
				<WorkersContent />
			</KeeperGate>
		</Layout>
	);
}

function WorkersContent() {
	const [workers, setWorkers] = useState<Worker[]>([]);
	const [name, setName] = useState('');
	const [pin, setPin] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		fetchWorkers();
	}, []);

	const fetchWorkers = async () => {
		try {
			const token = getStoredKeeperToken();
			const storeId = getStoredKeeperStoreId();
			if (!token || !storeId) {
				setError('Session expired. Please unlock again.');
				return;
			}

			const res = await fetch('/api/workers', {
				headers: {
					Authorization: `Bearer ${token}`,
					'x-store-id': storeId,
				},
			});
			if (res.ok) {
				const data = await res.json();
				setWorkers(data);
			} else if (res.status === 401) {
				setError('Session expired. Please unlock again.');
			}
		} catch {
			setError('Failed to load workers');
		}
	};

	const handleAddWorker = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!name.trim() || !pin.trim()) {
			setError('Name and PIN are required');
			return;
		}
		if (pin.length < 4) {
			setError('Worker PIN must be at least 4 characters');
			return;
		}

		// Get keeper token and store ID (set by KeeperGate after password verification)
		const token = getStoredKeeperToken();
		const storeId = getStoredKeeperStoreId();

		if (!token || !storeId) {
			console.error('Missing keeper session:', {
				token: !!token,
				storeId: !!storeId,
			});
			setError('Session expired. Please unlock again.');
			return;
		}

		setLoading(true);
		try {
			const res = await fetch('/api/workers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'x-store-id': storeId,
				},
				body: JSON.stringify({ name: name.trim(), pin }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				console.error('Worker creation failed:', res.status, data);
				setError(data.error || 'Failed to create worker');
				return;
			}
			setName('');
			setPin('');
			await fetchWorkers();
		} catch (err) {
			console.error('Worker creation error:', err);
			setError('Network error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8">
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Workers</h1>
				<p className="text-gray-600 mt-1">
					Add workers and set their PINs. Workers use their PIN at checkout to
					record sales.
				</p>
			</header>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<h2 className="text-xl font-bold flex items-center gap-2">
							<Plus size={22} />
							Add worker
						</h2>
					</CardHeader>
					<CardBody>
						<form onSubmit={handleAddWorker} className="space-y-4">
							<Input
								label="Worker name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Chukwu"
								error={error}
							/>
							<Input
								label="PIN (min 4 digits – worker uses this at checkout)"
								type="password"
								value={pin}
								onChange={(e) => setPin(e.target.value)}
								placeholder="e.g. 1234"
								maxLength={8}
							/>
							<Button
								type="submit"
								variant="primary"
								isLoading={loading}
								disabled={!name.trim() || pin.length < 4}
							>
								Add worker
							</Button>
						</form>
					</CardBody>
				</Card>

				<Card>
					<CardHeader>
						<h2 className="text-xl font-bold flex items-center gap-2">
							<Users size={22} />
							Current workers ({workers.length})
						</h2>
					</CardHeader>
					<CardBody>
						{workers.length === 0 ? (
							<p className="text-gray-500">
								No workers yet. Add one with the form.
							</p>
						) : (
							<ul className="space-y-2">
								{workers.map((w) => (
									<li
										key={w.id}
										className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
									>
										<span className="font-medium">{w.name}</span>
										<span className="text-gray-500 text-sm flex items-center gap-1">
											<KeyRound size={14} /> PIN set
										</span>
									</li>
								))}
							</ul>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
