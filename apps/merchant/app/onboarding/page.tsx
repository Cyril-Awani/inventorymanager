'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { StoreTypeSelector } from '@/components/onboarding/StoreTypeSelector';
import { ItemSelector } from '@/components/onboarding/ItemSelector';

type Step = 'ownerInfo' | 'storeType' | 'items' | 'confirming';

interface StoreType {
	id: string;
	label: string;
	icon: string;
}

interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	unitName: string;
}

export default function OnboardingPage() {
	const router = useRouter();
	const { auth, isLoading: authLoading, updateStore } = useStoreAuth();
	const [step, setStep] = useState<Step>('ownerInfo');
	const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
	const [selectedStoreType, setSelectedStoreType] = useState<string>('');
	const [items, setItems] = useState<Product[]>([]);
	const [query, setQuery] = useState<string>('');
	const [debouncedQuery, setDebouncedQuery] = useState<string>('');
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [ownerFullName, setOwnerFullName] = useState<string>('');
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [operationType, setOperationType] = useState<string>('');

	// Redirect if not authenticated or already setup
	useEffect(() => {
		if (!authLoading && !auth) {
			router.push('/auth');
		} else if (!authLoading && auth && auth.store.setupCompleted) {
			router.push('/inventory');
		}
	}, [auth, authLoading, router]);

	// Load store types on mount
	useEffect(() => {
		const fetchStoreTypes = async () => {
			try {
				const response = await fetch('/api/onboarding/store-types');
				const data = await response.json();
				setStoreTypes(data.storeTypes);
			} catch (err) {
				setError('Failed to load store types');
			}
		};
		fetchStoreTypes();
	}, []);

	// Load items when store type is selected
	useEffect(() => {
		const handler = setTimeout(() => setDebouncedQuery(query), 300);
		return () => clearTimeout(handler);
	}, [query]);

	useEffect(() => {
		if (selectedStoreType) {
			const fetchItems = async () => {
				try {
					setIsLoading(true);
					let url = `/api/onboarding/items?type=${selectedStoreType}`;
					if (debouncedQuery) url += `&q=${encodeURIComponent(debouncedQuery)}`;
					const response = await fetch(url);
					const data = await response.json();
					setItems(data.products);
					setSelectedItems(new Set()); // Reset selection when changing store type
				} catch (err) {
					setError('Failed to load items');
				} finally {
					setIsLoading(false);
				}
			};
			fetchItems();
		}
	}, [selectedStoreType, debouncedQuery]);

	const handleSelectStoreType = (typeId: string) => {
		setSelectedStoreType(typeId);
		setStep('items');
	};

	const handleContinueFromOwnerInfo = () => {
		const composed = `${firstName.trim()} ${lastName.trim()}`.trim();
		if (!composed || !operationType) {
			setError('Please enter your first and last name and select a store type');
			return;
		}
		setOwnerFullName(composed);
		setError('');
		setStep('storeType');
	};

	const handleToggleItem = (id: string) => {
		const newSelected = new Set(selectedItems);
		if (newSelected.has(id)) {
			newSelected.delete(id);
		} else {
			newSelected.add(id);
		}
		setSelectedItems(newSelected);
	};

	const handleConfirmSetup = async () => {
		if (!auth || !selectedStoreType || !ownerFullName.trim() || !operationType)
			return;

		try {
			setIsLoading(true);
			setError('');

			const response = await fetch('/api/onboarding/setup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth.token}`,
				},
				body: JSON.stringify({
					storeType: selectedStoreType,
					selectedItems: Array.from(selectedItems),
					ownerFullName,
					operationType,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Setup failed');
			}

			const data = await response.json();

			// Update auth state with new store data
			updateStore({
				setupCompleted: data.store.setupCompleted,
			});

			// Redirect to inventory
			router.push('/inventory');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Setup failed');
		} finally {
			setIsLoading(false);
		}
	};

	if (authLoading || !auth) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-2xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Welcome, {auth.store.businessName}!
					</h1>
					<p className="text-gray-600 mt-2">Let's set up your store</p>
				</div>

				{/* Progress indicator */}
				<div className="flex gap-2 mb-8 justify-center">
					<div
						className={`h-2 w-12 rounded-full ${step === 'ownerInfo' || step === 'storeType' || step === 'items' || step === 'confirming' ? 'bg-indigo-600' : 'bg-gray-300'}`}
					/>
					<div
						className={`h-2 w-12 rounded-full ${step === 'storeType' || step === 'items' || step === 'confirming' ? 'bg-indigo-600' : 'bg-gray-300'}`}
					/>
					<div
						className={`h-2 w-12 rounded-full ${step === 'items' || step === 'confirming' ? 'bg-indigo-600' : 'bg-gray-300'}`}
					/>
					<div
						className={`h-2 w-12 rounded-full ${step === 'confirming' ? 'bg-indigo-600' : 'bg-gray-300'}`}
					/>
				</div>

				{/* Content */}
				<Card className="shadow-lg">
					<div className="p-8">
						{error && (
							<div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
								{error}
							</div>
						)}

						{step === 'ownerInfo' && (
							<div>
								<h2 className="text-2xl font-bold text-gray-900 mb-6">
									Tell us about yourself
								</h2>
								<div className="space-y-6">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												First Name
											</label>
											<input
												type="text"
												value={firstName}
												onChange={(e) => setFirstName(e.target.value)}
												placeholder="First name"
												className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Last Name
											</label>
											<input
												type="text"
												value={lastName}
												onChange={(e) => setLastName(e.target.value)}
												placeholder="Last name"
												className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-4">
											What type of store do you operate?
										</label>
										<div className="space-y-3">
											{[
												{ value: 'PHYSICAL', label: 'Physical Store' },
												{ value: 'ONLINE', label: 'Online Store' },
												{
													value: 'HYBRID',
													label: 'Hybrid (Both Physical & Online)',
												},
											].map((option) => (
												<label key={option.value} className="flex items-center">
													<input
														type="radio"
														name="operationType"
														value={option.value}
														checked={operationType === option.value}
														onChange={(e) => setOperationType(e.target.value)}
														className="w-4 h-4 text-indigo-600"
													/>
													<span className="ml-3 text-gray-700">
														{option.label}
													</span>
												</label>
											))}
										</div>
									</div>
								</div>

								<div className="mt-8">
									<Button
										onClick={handleContinueFromOwnerInfo}
										className="w-full"
									>
										Continue
									</Button>
								</div>
							</div>
						)}

						{step === 'storeType' && (
							<div>
								<h2 className="text-2xl font-bold text-gray-900 mb-6">
									What type of store do you have?
								</h2>
								<StoreTypeSelector
									storeTypes={storeTypes}
									selectedType={selectedStoreType}
									onSelect={handleSelectStoreType}
								/>
							</div>
						)}

						{step === 'items' && (
							<div>
								<h2 className="text-2xl font-bold text-gray-900 mb-4">
									Select your inventory items
								</h2>
								<p className="text-gray-600 mb-6">
									Choose the items you want to stock. You can add more later.
								</p>
								<div className="mb-4 flex items-center gap-3">
									<input
										type="search"
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="Search items by name, brand or category"
										className="flex-1 px-3 py-2 border rounded-lg"
									/>
									<button
										onClick={() => setQuery('')}
										className="px-3 py-2 bg-gray-100 rounded-lg"
									>
										Clear
									</button>
								</div>
								<ItemSelector
									items={items}
									selectedItems={selectedItems}
									onToggleItem={handleToggleItem}
									isLoading={isLoading}
								/>
								<div className="mt-6 flex gap-4">
									<Button
										variant="secondary"
										onClick={() => setStep('storeType')}
										className="flex-1"
									>
										Back
									</Button>
									<Button
										onClick={() => setStep('confirming')}
										className="flex-1"
										disabled={selectedItems.size === 0}
									>
										Continue
									</Button>
								</div>
							</div>
						)}

						{step === 'confirming' && (
							<div>
								<h2 className="text-2xl font-bold text-gray-900 mb-6">
									Ready to go?
								</h2>
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
									<div className="space-y-3">
										<p>
											<span className="font-medium text-gray-900">
												Owner Name:
											</span>{' '}
											<span className="text-gray-600">{ownerFullName}</span>
										</p>
										<p>
											<span className="font-medium text-gray-900">
												Store Type:
											</span>{' '}
											<span className="text-gray-600">
												{operationType === 'PHYSICAL'
													? 'Physical Store'
													: operationType === 'ONLINE'
														? 'Online Store'
														: 'Hybrid (Both Physical & Online)'}
											</span>
										</p>
										<p>
											<span className="font-medium text-gray-900">
												Business Category:
											</span>{' '}
											<span className="text-gray-600">
												{
													storeTypes.find((t) => t.id === selectedStoreType)
														?.label
												}
											</span>
										</p>
										<p>
											<span className="font-medium text-gray-900">Items:</span>{' '}
											<span className="text-gray-600">
												{selectedItems.size} items selected
											</span>
										</p>
										<p>
											<span className="font-medium text-gray-900">
												Inventory:
											</span>{' '}
											<span className="text-gray-600">
												Starting with 0 stock (you'll add stock later)
											</span>
										</p>
									</div>
								</div>

								{error && (
									<div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
										{error}
									</div>
								)}

								<div className="flex gap-4">
									<Button
										variant="secondary"
										onClick={() => setStep('items')}
										className="flex-1"
										disabled={isLoading}
									>
										Back
									</Button>
									<Button
										onClick={handleConfirmSetup}
										className="flex-1"
										disabled={isLoading}
									>
										{isLoading ? 'Setting up...' : 'Complete Setup'}
									</Button>
								</div>
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
