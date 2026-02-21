'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import {
	Plus,
	DollarSign,
	Check,
	AlertCircle,
	Search,
	Phone,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { KeeperGate } from '@/components/KeeperGate';
import { PinDialog } from '@/components/PinDialog';
import { useStoreAuth } from '@/hooks/use-store-auth';

interface Credit {
	id: string;
	customerName: string;
	phoneNumber?: string;
	totalOwed: number;
	totalPaid: number;
	remainingBalance: number;
	paymentStatus: 'pending' | 'partial' | 'paid';
	createdAt: string;
	payments: Payment[];
}

interface Payment {
	id: string;
	amount: number;
	createdAt: string;
}

export default function CreditsPage() {
	return (
		<Layout headerHeight="11vh">
			<KeeperGate
				title="Credits & payments"
				description="Enter the store keeper password to view and manage customer credits."
				allowWorkers={true}
			>
				<CreditsContent />
			</KeeperGate>
		</Layout>
	);
}

function CreditsContent() {
	const { auth } = useStoreAuth();
	const router = useRouter();
	const [credits, setCredits] = useState<Credit[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterStatus, setFilterStatus] = useState<
		'all' | 'pending' | 'partial' | 'paid'
	>('all');
	const [showAddForm, setShowAddForm] = useState(false);
	const [showPaymentForm, setShowPaymentForm] = useState(false);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [showPinDialog, setShowPinDialog] = useState(false);
	const [pendingPayment, setPendingPayment] = useState<{
		creditId: string;
		amount: number;
	} | null>(null);
	const [activeTab, setActiveTab] = useState<'credits' | 'storeCredits'>(
		'credits',
	);
	const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [workers, setWorkers] = useState<any[]>([]);
	const [showFilterMenu, setShowFilterMenu] = useState(false);

	// Fetch credits
	useEffect(() => {
		fetchCredits();
	}, [filterStatus, auth]);

	// Fetch workers for PIN dialog
	useEffect(() => {
		const fetchWorkers = async () => {
			try {
				const headers: HeadersInit = {};
				if (auth?.token) {
					headers['Authorization'] = `Bearer ${auth.token}`;
				}
				if (auth?.store?.id) {
					headers['x-store-id'] = auth.store.id;
				}

				const response = await fetch('/api/workers', { headers });
				if (response.ok) {
					const data = await response.json();
					setWorkers(data);
				}
			} catch (error) {
				console.error('Failed to fetch workers:', error);
			}
		};

		fetchWorkers();
	}, [auth]);

	const fetchCredits = async () => {
		try {
			const url =
				filterStatus === 'all'
					? '/api/credits'
					: `/api/credits?status=${filterStatus}`;

			const headers: HeadersInit = {};
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch(url, { headers });
			if (response.ok) {
				const data = await response.json();
				setCredits(data);
			}
		} catch (error) {
			console.error('Failed to fetch credits:', error);
		}
	};

	const handleAddCredit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		const customerName = formData.get('customerName') as string;
		const phoneNumber = formData.get('phoneNumber') as string;
		const totalOwed = parseFloat(formData.get('totalOwed') as string);

		if (!customerName || totalOwed <= 0) {
			alert('Please fill all required fields');
			return;
		}

		setIsLoading(true);
		try {
			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch('/api/credits', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					customerName,
					phoneNumber: phoneNumber || undefined,
					totalOwed,
				}),
			});

			if (response.ok) {
				await fetchCredits();
				setShowAddForm(false);
				alert('Credit created successfully');
			} else {
				alert('Error creating credit');
			}
		} catch (error) {
			alert('Failed to create credit');
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selectedCredit) return;

		const formData = new FormData(e.currentTarget);
		const amount = parseFloat(formData.get('amount') as string);

		if (amount <= 0) {
			alert('Invalid payment amount');
			return;
		}

		try {
			// Require worker verification before recording payment
			setPendingPayment({ creditId: selectedCredit.id, amount });
			setShowPinDialog(true);
		} catch (error) {
			alert('Failed to process payment');
		}
	};

	const finalizePayment = async (workerId: string, workerName: string) => {
		if (!pendingPayment) return;
		setIsLoading(true);
		try {
			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch(
				`/api/credits/${pendingPayment.creditId}/payment`,
				{
					method: 'POST',
					headers,
					body: JSON.stringify({ amount: pendingPayment.amount, workerId }),
				},
			);

			if (response.ok) {
				const data = await response.json();
				await fetchCredits();
				setShowPaymentForm(false);
				setShowDetailModal(false);
				setSelectedCredit(null);
				setPendingPayment(null);
				setShowPinDialog(false);
				if (data.storeCredit) {
					alert('Payment recorded. Overpayment converted to store credit.');
				} else {
					alert('Payment recorded successfully');
				}
			} else {
				const d = await response.json().catch(() => ({}));
				alert(d.error || 'Error processing payment');
			}
		} catch (error) {
			alert('Failed to process payment');
		} finally {
			setIsLoading(false);
		}
	};

	const filteredCredits = credits.filter(
		(credit) =>
			credit.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(credit.phoneNumber && credit.phoneNumber.includes(searchQuery)),
	);

	const storeCredits = credits.filter((c: any) => {
		// Show explicit store credits, and fall back to old-style where totalOwed === 0 and totalPaid > 0
		return (
			c.isStoreCredit === true ||
			(typeof c.totalOwed === 'number' && c.totalOwed === 0 && c.totalPaid > 0)
		);
	});

	const stats = {
		totalDebts: credits.reduce((sum, c) => sum + c.remainingBalance, 0),
		paidAmount: credits.reduce((sum, c) => sum + c.totalPaid, 0),
		pendingCount: credits.filter((c) => c.paymentStatus === 'pending').length,
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'partial':
				return 'bg-blue-100 text-blue-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'all':
				return 'All';
			case 'paid':
				return 'Paid';
			case 'partial':
				return 'Partial';
			case 'pending':
				return 'Pending';
			default:
				return status;
		}
	};

	return (
		<div className="p-4 md:p-8">
			{/* Header */}
			<header className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<div>
						<h1 className="text-xl md:text-3xl font-bold text-gray-900">
							Credits & Payments
						</h1>
						<p className="text-gray-600">
							Track customer credits and partial payments
						</p>
					</div>
					<button
						onClick={() => setShowAddForm(true)}
						className="
				flex items-center justify-center
				gap-2
				whitespace-nowrap
				py-2 px-2 md:px-6
				text-xs sm:text-sm md:text-base
				rounded-full sm:rounded-lg
				bg-gradient-to-r from-[#bda7d7] to-[#a37ddc]
				text-[#ffffff]
				shadow-sm
				hover:shadow-md
				transition-all duration-200
			  "
					>
						<Plus className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />

						<span className="hidden sm:inline truncate">Add Product</span>
					</button>
				</div>
			</header>

			{/* Search and Filter */}
			<div className="flex flex-row gap-4 md:mb-4">
				<div className="flex-1 relative">
					<Search
						className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
						size={20}
					/>
					<input
						type="text"
						placeholder="Search by customer name or phone..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div className="relative">
					<Button
						variant="secondary"
						size="md"
						onClick={() => setShowFilterMenu(!showFilterMenu)}
						className="flex items-center gap-2"
					>
						<span className="hidden md:inline text-sm md:base">
							Status: {getStatusLabel(filterStatus)}
						</span>
						<span className="sm:hidden text-sm md:base">Filter</span>
					</Button>

					{/* Filter Menu Dropdown */}
					{showFilterMenu && (
						<>
							<div
								className="fixed inset-0 z-10"
								onClick={() => setShowFilterMenu(false)}
							/>
							<div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
								<div className="py-1">
									{[
										{ value: 'all', label: 'All Status' },
										{ value: 'pending', label: 'Pending' },
										{ value: 'partial', label: 'Partial' },
										{ value: 'paid', label: 'Paid' },
									].map((option) => (
										<button
											key={option.value}
											onClick={() => {
												setFilterStatus(option.value as any);
												setShowFilterMenu(false);
											}}
											className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
												filterStatus === option.value
													? 'bg-blue-50 text-blue-700'
													: 'text-gray-700'
											}`}
										>
											<span>{option.label}</span>
											{filterStatus === option.value && <span>✓</span>}
										</button>
									))}
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Tabs */}
			<div className="my-4">
				<div className="inline-flex rounded-lg bg-white p-1 border border-gray-200">
					<button
						onClick={() => setActiveTab('credits')}
						className={`px-4 py-2 rounded-lg text-sm md:text-base ${activeTab === 'credits' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
					>
						Customer Credits
					</button>
					<button
						onClick={() => setActiveTab('storeCredits')}
						className={`px-4 py-2 rounded-lg text-sm md:text-base ${activeTab === 'storeCredits' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
					>
						Store Credits
					</button>
				</div>
			</div>

			{/* Credits List */}
			{activeTab === 'credits' ? (
				<>
					{/* Mobile Card View */}
					<div className="md:hidden space-y-3">
						{filteredCredits.map((credit) => (
							<div
								key={credit.id}
								onClick={() => {
									setSelectedCredit(credit);
									setShowDetailModal(true);
								}}
								className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow"
							>
								<div className="flex justify-between items-start mb-3">
									<div>
										<h3 className="font-bold text-lg text-gray-900">
											{credit.customerName}
										</h3>
										<p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
											{credit.phoneNumber ? (
												<>
													<Phone size={14} />
													{credit.phoneNumber}
												</>
											) : (
												<span className="text-gray-400">No phone</span>
											)}
										</p>
									</div>
									<span
										className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(credit.paymentStatus)}`}
									>
										{credit.paymentStatus === 'paid' && (
											<Check size={12} className="inline mr-1" />
										)}
										{credit.paymentStatus.charAt(0).toUpperCase() +
											credit.paymentStatus.slice(1)}
									</span>
								</div>

								<div className="flex justify-between items-end">
									<div>
										<p className="text-xs text-gray-500 mb-1">Total Owed</p>
										<p className="text-2xl font-bold text-red-600">
											₦{credit.totalOwed.toLocaleString()}
										</p>
									</div>
									<div className="text-right">
										<p className="text-xs text-gray-500 mb-1">
											{new Date(credit.createdAt).toLocaleDateString()}
										</p>
										<p className="text-xs text-gray-600">
											Paid: ₦{credit.totalPaid.toLocaleString()}
										</p>
									</div>
								</div>
							</div>
						))}

						{filteredCredits.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600 text-lg">No credits found</p>
							</div>
						)}
					</div>

					{/* Desktop Table View */}
					<div className="hidden md:block">
						<Card>
							<CardHeader>
								<h2 className="text-xl font-bold">Customer Credits</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-3 px-4 font-semibold text-gray-700">
												Customer
											</th>
											<th className="text-left py-3 px-4 font-semibold text-gray-700">
												Phone
											</th>
											<th className="text-right py-3 px-4 font-semibold text-gray-700">
												Total Owed
											</th>
											<th className="text-right py-3 px-4 font-semibold text-gray-700">
												Paid
											</th>
											<th className="text-right py-3 px-4 font-semibold text-gray-700">
												Balance
											</th>
											<th className="text-center py-3 px-4 font-semibold text-gray-700">
												Status
											</th>
											<th className="text-left py-3 px-4 font-semibold text-gray-700">
												Date
											</th>
											<th className="text-right py-3 px-4 font-semibold text-gray-700">
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredCredits.map((credit) => (
											<tr
												key={credit.id}
												className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
												onClick={() => {
													setSelectedCredit(credit);
													setShowDetailModal(true);
												}}
											>
												<td className="py-3 px-4 font-medium">
													{credit.customerName}
												</td>
												<td className="py-3 px-4 text-sm text-gray-600 flex items-center gap-1">
													{credit.phoneNumber ? (
														<>
															<Phone size={16} />
															{credit.phoneNumber}
														</>
													) : (
														<span className="text-gray-400">—</span>
													)}
												</td>
												<td className="py-3 px-4 text-right font-semibold">
													₦{credit.totalOwed.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-right text-green-600">
													₦{credit.totalPaid.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-right font-bold text-red-600">
													₦{credit.remainingBalance.toLocaleString()}
												</td>
												<td className="py-3 px-4 text-center">
													<span
														className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(credit.paymentStatus)}`}
													>
														{credit.paymentStatus === 'paid' && (
															<Check size={14} className="inline mr-1" />
														)}
														{credit.paymentStatus.charAt(0).toUpperCase() +
															credit.paymentStatus.slice(1)}
													</span>
												</td>
												<td className="py-3 px-4 text-sm text-gray-600">
													{new Date(credit.createdAt).toLocaleDateString()}
												</td>
												<td
													className="py-3 px-4 text-right"
													onClick={(e) => e.stopPropagation()}
												>
													{credit.paymentStatus !== 'paid' && (
														<Button
															variant="primary"
															size="sm"
															onClick={() => {
																setSelectedCredit(credit);
																setShowPaymentForm(true);
															}}
															className="gap-1"
														>
															<DollarSign size={14} />
															Pay
														</Button>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>

								{filteredCredits.length === 0 && (
									<div className="text-center py-8">
										<p className="text-gray-600 text-lg">No credits found</p>
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</>
			) : (
				<Card>
					<CardHeader>
						<h2 className="text-xl font-bold">Store Credits</h2>
					</CardHeader>
					<CardBody>
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="text-left py-3 px-4 font-semibold text-gray-700">
										Customer
									</th>
									<th className="text-right py-3 px-4 font-semibold text-gray-700">
										Amount
									</th>
									<th className="text-left py-3 px-4 font-semibold text-gray-700">
										Date
									</th>
								</tr>
							</thead>
							<tbody>
								{storeCredits.map((c) => (
									<tr
										key={c.id}
										className="border-b border-gray-200 hover:bg-gray-50"
									>
										<td className="py-3 px-4 font-medium">{c.customerName}</td>
										<td className="py-3 px-4 text-right font-bold text-green-600">
											₦{c.totalPaid.toLocaleString()}
										</td>
										<td className="py-3 px-4 text-sm text-gray-600">
											{new Date(c.createdAt).toLocaleDateString()}
										</td>
									</tr>
								))}
								{storeCredits.length === 0 && (
									<tr>
										<td colSpan={3} className="text-center py-8 text-gray-500">
											No store credits
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</CardBody>
				</Card>
			)}

			{/* Add Credit Modal */}
			<Modal
				isOpen={showAddForm}
				onClose={() => setShowAddForm(false)}
				title="Create New Credit"
				size="md"
			>
				<form onSubmit={handleAddCredit} className="space-y-4">
					<Input
						label="Customer Name"
						name="customerName"
						placeholder="Enter customer name"
						required
					/>

					<Input
						label="Phone Number (Optional)"
						name="phoneNumber"
						type="tel"
						placeholder="Enter phone number"
					/>

					<Input
						label="Total Amount Owed (₦)"
						name="totalOwed"
						type="number"
						placeholder="0"
						required
					/>

					<div className="flex gap-3 justify-end flex-col-reverse md:flex-row">
						<Button
							variant="secondary"
							type="button"
							onClick={() => setShowAddForm(false)}
						>
							Cancel
						</Button>
						<Button variant="primary" type="submit" isLoading={isLoading}>
							Create Credit
						</Button>
					</div>
				</form>
			</Modal>

			{/* Detail Modal - Shows all info on mobile */}
			<Modal
				isOpen={showDetailModal && selectedCredit !== null}
				onClose={() => {
					setShowDetailModal(false);
					setSelectedCredit(null);
				}}
				title={selectedCredit?.customerName || ''}
				size="md"
			>
				{selectedCredit && (
					<div className="space-y-4">
						{/* Customer Info */}
						<div className="bg-gray-50 p-4 rounded-lg">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-xs text-gray-600 font-semibold">Phone</p>
									<p className="text-sm text-gray-900 mt-1">
										{selectedCredit.phoneNumber || 'No phone'}
									</p>
								</div>
								<div>
									<p className="text-xs text-gray-600 font-semibold">
										Date Created
									</p>
									<p className="text-sm text-gray-900 mt-1">
										{new Date(selectedCredit.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
						</div>

						{/* Financial Info */}
						<div className="space-y-3">
							<div className="flex justify-between items-center pb-3 border-b border-gray-200">
								<p className="text-gray-700 font-medium">Total Owed</p>
								<p className="text-lg font-bold text-red-600">
									₦{selectedCredit.totalOwed.toLocaleString()}
								</p>
							</div>

							<div className="flex justify-between items-center pb-3 border-b border-gray-200">
								<p className="text-gray-700 font-medium">Total Paid</p>
								<p className="text-lg font-bold text-green-600">
									₦{selectedCredit.totalPaid.toLocaleString()}
								</p>
							</div>

							<div className="flex justify-between items-center pb-3 border-b border-gray-200">
								<p className="text-gray-700 font-medium">Remaining Balance</p>
								<p className="text-lg font-bold text-blue-600">
									₦{selectedCredit.remainingBalance.toLocaleString()}
								</p>
							</div>

							<div className="flex justify-between items-center">
								<p className="text-gray-700 font-medium">Status</p>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedCredit.paymentStatus)}`}
								>
									{selectedCredit.paymentStatus === 'paid' && (
										<Check size={14} className="inline mr-1" />
									)}
									{selectedCredit.paymentStatus.charAt(0).toUpperCase() +
										selectedCredit.paymentStatus.slice(1)}
								</span>
							</div>
						</div>

						{/* Payment History */}
						{selectedCredit.payments && selectedCredit.payments.length > 0 && (
							<div className="bg-gray-50 p-4 rounded-lg">
								<p className="font-semibold text-gray-900 mb-3">
									Payment History
								</p>
								<div className="space-y-2">
									{selectedCredit.payments.map((payment) => (
										<div
											key={payment.id}
											className="flex justify-between items-center text-sm"
										>
											<span className="text-gray-600">
												{new Date(payment.createdAt).toLocaleDateString()}
											</span>
											<span className="font-semibold text-green-600">
												₦{payment.amount.toLocaleString()}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-3 justify-end flex-col-reverse md:flex-row pt-4 border-t border-gray-200">
							<Button
								variant="secondary"
								type="button"
								onClick={() => {
									setShowDetailModal(false);
									setSelectedCredit(null);
								}}
							>
								Close
							</Button>
							{selectedCredit.paymentStatus !== 'paid' && (
								<Button
									variant="primary"
									onClick={() => {
										setShowDetailModal(false);
										setShowPaymentForm(true);
									}}
									className="gap-2"
								>
									<DollarSign size={16} />
									Record Payment
								</Button>
							)}
						</div>
					</div>
				)}
			</Modal>

			{/* Payment Modal */}
			<Modal
				isOpen={showPaymentForm}
				onClose={() => {
					setShowPaymentForm(false);
					setSelectedCredit(null);
				}}
				title={`Record Payment - ${selectedCredit?.customerName}`}
				size="md"
			>
				{selectedCredit && (
					<form onSubmit={handleAddPayment} className="space-y-4">
						<div className="bg-blue-50 p-4 rounded border border-blue-200">
							<p className="text-sm text-blue-700">Balance Remaining</p>
							<p className="text-2xl font-bold text-blue-900">
								₦{selectedCredit.remainingBalance.toLocaleString()}
							</p>
						</div>

						<Input
							label="Payment Amount (₦)"
							name="amount"
							type="number"
							placeholder="0"
							required
						/>

						<div className="flex gap-3 justify-end flex-col-reverse md:flex-row">
							<Button
								variant="secondary"
								type="button"
								onClick={() => {
									setShowPaymentForm(false);
									setSelectedCredit(null);
								}}
							>
								Cancel
							</Button>
							<Button variant="primary" type="submit" isLoading={isLoading}>
								Record Payment
							</Button>
						</div>
					</form>
				)}
			</Modal>

			{/* PIN Dialog */}
			{showPinDialog && (
				<PinDialog
					onCancel={() => {
						setShowPinDialog(false);
						setPendingPayment(null);
					}}
					onNavigateToWorkers={() => router.push('/workers')}
					onPinVerified={finalizePayment}
					storeId={auth?.store?.id}
					workers={workers}
				/>
			)}
		</div>
	);
}
