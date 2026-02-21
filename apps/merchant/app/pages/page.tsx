'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import {
	Calendar,
	TrendingUp,
	TrendingDown,
	DollarSign,
	ArrowUp,
	ArrowDown,
	RotateCw,
	Package,
	Users,
	X,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { KeeperGate } from '@/components/KeeperGate';
import { useStoreAuth } from '@/hooks/use-store-auth';

interface AccountingData {
	period: string;
	startDate: string;
	endDate: string;
	summary: {
		totalRevenue: number;
		totalCost: number;
		totalProfit: number;
		profitMargin: number;
		totalTransactions: number;
	};
	productAnalysis: {
		mostSold: any[];
		highestProfit: any[];
		lowestSold: any[];
		lowestProfit: any[];
	};
	inventory: {
		products: Array<{
			id: string;
			name: string;
			brand: string;
			category: string;
			quantity: number;
			costPrice: number;
			totalCapital: number;
		}>;
		totalCapital: number;
		totalProducts: number;
	};
}

// Display period options
type DisplayPeriod = 'today' | 'thisWeek' | 'lastWeek' | 'lastMonth' | 'custom';
// API period options
type ApiPeriod = 'daily' | 'weekly' | 'monthly';

export default function PagesPage() {
	return (
		<Layout headerHeight="11vh">
			<KeeperGate
				title="Insight"
				description="Enter the store keeper password to view accounting and business insights."
			>
				<PagesContent />
			</KeeperGate>
		</Layout>
	);
}

function PagesContent() {
	const { auth } = useStoreAuth();
	const [accountingData, setAccountingData] = useState<AccountingData | null>(
		null,
	);
	const [displayPeriod, setDisplayPeriod] = useState<DisplayPeriod>('today');
	const [customStartDate, setCustomStartDate] = useState('');
	const [customEndDate, setCustomEndDate] = useState('');
	const [showCustomDateModal, setShowCustomDateModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<'period' | 'inventory' | 'profit'>(
		'period',
	);

	// Map display period to API period and calculate dates
	const getApiParams = () => {
		const today = new Date();
		let apiPeriod: ApiPeriod = 'daily';
		let dateParam = today.toISOString().split('T')[0];
		let startDateParam = '';
		let endDateParam = '';

		switch (displayPeriod) {
			case 'today':
				apiPeriod = 'daily';
				dateParam = today.toISOString().split('T')[0];
				break;
			case 'thisWeek':
				apiPeriod = 'weekly';
				// Get current week's date (e.g., using Monday as start)
				const monday = new Date(today);
				monday.setDate(today.getDate() - today.getDay() + 1);
				dateParam = monday.toISOString().split('T')[0];
				break;
			case 'lastWeek':
				apiPeriod = 'weekly';
				// Get last week's Monday
				const lastMonday = new Date(today);
				lastMonday.setDate(today.getDate() - today.getDay() - 6);
				dateParam = lastMonday.toISOString().split('T')[0];
				break;
			case 'lastMonth':
				apiPeriod = 'monthly';
				// Get first day of last month
				const lastMonth = new Date(
					today.getFullYear(),
					today.getMonth() - 1,
					1,
				);
				dateParam = lastMonth.toISOString().split('T')[0];
				break;
			case 'custom':
				apiPeriod = 'daily'; // Default, but we'll use custom date range
				startDateParam = customStartDate;
				endDateParam = customEndDate;
				break;
		}

		return { apiPeriod, dateParam, startDateParam, endDateParam };
	};

	useEffect(() => {
		fetchAccountingData();
	}, [
		displayPeriod,
		customStartDate,
		customEndDate,
		auth?.token,
		auth?.store?.id,
	]);

	const fetchAccountingData = async () => {
		if (!auth?.token || !auth?.store?.id) {
			console.log('Waiting for auth...');
			return;
		}

		setIsLoading(true);
		try {
			const headers: HeadersInit = {
				Authorization: `Bearer ${auth.token}`,
				'x-store-id': auth.store.id,
				'Content-Type': 'application/json',
			};

			const { apiPeriod, dateParam, startDateParam, endDateParam } =
				getApiParams();

			let url = `/api/accounting?period=${apiPeriod}`;

			if (displayPeriod === 'custom' && startDateParam && endDateParam) {
				url += `&startDate=${startDateParam}&endDate=${endDateParam}`;
			} else {
				url += `&date=${dateParam}`;
			}

			console.log('Fetching:', url); // For debugging

			const response = await fetch(url, {
				headers,
				cache: 'no-cache',
			});

			if (response.status === 401) {
				console.error('Unauthorized - please check authentication');
				// You might want to redirect to login or show a message
				return;
			}

			if (response.status === 400) {
				const errorData = await response.json();
				console.error('Bad request:', errorData);
				return;
			}

			if (response.ok) {
				const data = await response.json();
				setAccountingData(data);
			}
		} catch (error) {
			console.error('Failed to fetch accounting data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newPeriod = e.target.value as DisplayPeriod;
		setDisplayPeriod(newPeriod);

		if (newPeriod === 'custom') {
			setShowCustomDateModal(true);
		} else {
			// Reset custom dates when switching away from custom
			setCustomStartDate('');
			setCustomEndDate('');
		}
	};

	const handleCustomDateSubmit = () => {
		if (customStartDate && customEndDate) {
			setShowCustomDateModal(false);
			fetchAccountingData();
		}
	};

	const getPeriodDisplayText = () => {
		switch (displayPeriod) {
			case 'today':
				return 'Today';
			case 'thisWeek':
				return 'This Week';
			case 'lastWeek':
				return 'Last Week';
			case 'lastMonth':
				return 'Last Month';
			case 'custom':
				return customStartDate && customEndDate
					? `${customStartDate} to ${customEndDate}`
					: 'Custom Period';
			default:
				return 'Select Period';
		}
	};

	// Show loading state while auth is being established
	if (!auth?.token || !auth?.store?.id) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[85vh]">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
					<p className="text-gray-600">Authenticating...</p>
				</div>
			</div>
		);
	}

	if (!accountingData) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[85vh]">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
					<p className="text-gray-600">Loading accounting data...</p>
				</div>
			</div>
		);
	}

	const profitMargin =
		accountingData.summary.totalProfit > 0
			? (
					(accountingData.summary.totalProfit /
						accountingData.summary.totalRevenue) *
					100
				).toFixed(1)
			: '0';

	return (
		<div className="p-8">
			{/* Header */}
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-6">
					Accounting & Pages
				</h1>
			</header>

			{/* Tab Navigation */}
			<div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
				<button
					onClick={() => setActiveTab('period')}
					className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
						activeTab === 'period'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-600 hover:text-gray-900'
					}`}
				>
					📊 Period Accounting
				</button>
				<button
					onClick={() => setActiveTab('inventory')}
					className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
						activeTab === 'inventory'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-600 hover:text-gray-900'
					}`}
				>
					📦 All Products Capital
				</button>
				<button
					onClick={() => setActiveTab('profit')}
					className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
						activeTab === 'profit'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-gray-600 hover:text-gray-900'
					}`}
				>
					💰 Profit Analysis
				</button>
			</div>

			{/* Period Selector - Under Tabs */}
			<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
					<div className="flex items-center gap-2">
						<Calendar size={20} className="text-gray-500" />
						<select
							value={displayPeriod}
							onChange={handlePeriodChange}
							className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white min-w-[200px]"
						>
							<option value="today">Today</option>
							<option value="thisWeek">This Week</option>
							<option value="lastWeek">Last Week</option>
							<option value="lastMonth">Last Month</option>
							<option value="custom">Custom Period</option>
						</select>
					</div>

					{displayPeriod !== 'custom' && (
						<span className="text-sm text-gray-600">
							Showing data for:{' '}
							<span className="font-semibold">{getPeriodDisplayText()}</span>
						</span>
					)}

					{displayPeriod === 'custom' && customStartDate && customEndDate && (
						<span className="text-sm text-gray-600">
							Showing data from:{' '}
							<span className="font-semibold">
								{customStartDate} to {customEndDate}
							</span>
						</span>
					)}

					<Button
						variant="primary"
						onClick={fetchAccountingData}
						isLoading={isLoading}
						className="flex items-center gap-2 ml-auto"
					>
						<RotateCw size={18} />
						Refresh
					</Button>
				</div>
			</div>

			{/* Custom Date Modal */}
			{showCustomDateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold">Select Custom Period</h3>
							<button
								onClick={() => setShowCustomDateModal(false)}
								className="text-gray-500 hover:text-gray-700"
							>
								<X size={20} />
							</button>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Start Date
								</label>
								<input
									type="date"
									value={customStartDate}
									onChange={(e) => setCustomStartDate(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									End Date
								</label>
								<input
									type="date"
									value={customEndDate}
									onChange={(e) => setCustomEndDate(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
								/>
							</div>

							<div className="flex gap-2 justify-end mt-6">
								<Button
									variant="secondary"
									onClick={() => setShowCustomDateModal(false)}
								>
									Cancel
								</Button>
								<Button
									variant="primary"
									onClick={handleCustomDateSubmit}
									disabled={!customStartDate || !customEndDate}
								>
									Apply
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Rest of your component remains the same... */}
			{/* Period Accounting Tab */}
			{activeTab === 'period' && (
				<>
					{/* Financial Summary Cards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
						<div>
							<p className="text-blue-700 text-xs font-medium flex items-center gap-1 mb-1">
								<DollarSign size={14} />
								Total Revenue
							</p>
							<p className="text-lg font-bold text-blue-900">
								₦{accountingData.summary.totalRevenue.toLocaleString()}
							</p>
						</div>
						<div>
							<p className="text-orange-700 text-xs font-medium flex items-center gap-1 mb-1">
								<Users size={14} />
								No of Transactions
							</p>
							<p className="text-lg font-bold text-orange-900">
								{accountingData.summary.totalTransactions}
							</p>
						</div>
						<div>
							<p className="text-green-700 text-xs font-medium flex items-center gap-1 mb-1">
								<TrendingUp size={14} />
								Total Profit
							</p>
							<p className="text-lg font-bold text-green-900">
								₦{accountingData.summary.totalProfit.toLocaleString()}
							</p>
							<p className="text-xs text-green-700">{profitMargin}% margin</p>
						</div>
						<div>
							<p className="text-purple-700 text-xs font-medium mb-1">
								Total COGS
							</p>
							<p className="text-lg font-bold text-purple-900">
								₦{accountingData.summary.totalCost.toLocaleString()}
							</p>
							<p className="text-xs text-purple-700 mt-1">Cost of Goods Sold</p>
						</div>
					</div>

					{/* Product Analysis Section */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Most Sold Products */}
						<Card>
							<CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
								<h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900">
									<ArrowUp size={20} />
									Most Sold Products
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Qty Sold
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Revenue
											</th>
										</tr>
									</thead>
									<tbody>
										{accountingData.productAnalysis.mostSold.map(
											(product, idx) => (
												<tr
													key={idx}
													className="border-b border-gray-200 hover:bg-gray-50"
												>
													<td className="py-2 px-3 font-medium">
														{product.name}
													</td>
													<td className="py-2 px-3 text-right">
														<span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold">
															{product.quantitySold}
														</span>
													</td>
													<td className="py-2 px-3 text-right font-semibold text-indigo-600">
														₦{product.revenue.toLocaleString()}
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
								{accountingData.productAnalysis.mostSold.length === 0 && (
									<div className="text-center py-6 text-gray-600">
										No sales data available
									</div>
								)}
							</CardBody>
						</Card>

						{/* Highest Profiting Products */}
						<Card>
							<CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
								<h2 className="text-lg font-bold flex items-center gap-2 text-green-900">
									<TrendingUp size={20} />
									Highest Profiting Products
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Profit
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Margin
											</th>
										</tr>
									</thead>
									<tbody>
										{accountingData.productAnalysis.highestProfit.map(
											(product, idx) => (
												<tr
													key={idx}
													className="border-b border-gray-200 hover:bg-gray-50"
												>
													<td className="py-2 px-3 font-medium">
														{product.name}
													</td>
													<td className="py-2 px-3 text-right font-semibold text-green-600">
														₦{product.profit.toLocaleString()}
													</td>
													<td className="py-2 px-3 text-right text-green-700">
														{product.marginPercent.toFixed(1)}%
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
								{accountingData.productAnalysis.highestProfit.length === 0 && (
									<div className="text-center py-6 text-gray-600">
										No sales data available
									</div>
								)}
							</CardBody>
						</Card>

						{/* Lowest Sold Products */}
						<Card>
							<CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100">
								<h2 className="text-lg font-bold flex items-center gap-2 text-yellow-900">
									<ArrowDown size={20} />
									Lowest Sold Products
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Qty Sold
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Revenue
											</th>
										</tr>
									</thead>
									<tbody>
										{accountingData.productAnalysis.lowestSold.map(
											(product, idx) => (
												<tr
													key={idx}
													className="border-b border-gray-200 hover:bg-gray-50"
												>
													<td className="py-2 px-3 font-medium">
														{product.name}
													</td>
													<td className="py-2 px-3 text-right">
														<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">
															{product.quantitySold}
														</span>
													</td>
													<td className="py-2 px-3 text-right font-semibold text-yellow-600">
														₦{product.revenue.toLocaleString()}
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
								{accountingData.productAnalysis.lowestSold.length === 0 && (
									<div className="text-center py-6 text-gray-600">
										No sales data available
									</div>
								)}
							</CardBody>
						</Card>

						{/* Lowest Profiting Products */}
						<Card>
							<CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
								<h2 className="text-lg font-bold flex items-center gap-2 text-red-900">
									<TrendingDown size={20} />
									Lowest Profiting Products
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Profit
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Margin
											</th>
										</tr>
									</thead>
									<tbody>
										{accountingData.productAnalysis.lowestProfit.map(
											(product, idx) => (
												<tr
													key={idx}
													className="border-b border-gray-200 hover:bg-gray-50"
												>
													<td className="py-2 px-3 font-medium">
														{product.name}
													</td>
													<td className="py-2 px-3 text-right font-semibold text-red-600">
														₦{product.profit.toLocaleString()}
													</td>
													<td className="py-2 px-3 text-right text-red-700">
														{product.marginPercent.toFixed(1)}%
													</td>
												</tr>
											),
										)}
									</tbody>
								</table>
								{accountingData.productAnalysis.lowestProfit.length === 0 && (
									<div className="text-center py-6 text-gray-600">
										No sales data available
									</div>
								)}
							</CardBody>
						</Card>
					</div>
				</>
			)}

			{/* Inventory Capital Tab */}
			{activeTab === 'inventory' && (
				<>
					<div className="mb-8">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
							<Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
								<CardBody>
									<p className="text-cyan-700 text-sm font-medium flex items-center gap-2">
										<Package size={16} />
										Total Products
									</p>
									<p className="text-2xl font-bold text-cyan-900 mt-2">
										{accountingData.inventory.totalProducts}
									</p>
								</CardBody>
							</Card>

							<Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
								<CardBody>
									<p className="text-indigo-700 text-sm font-medium">
										Total Units in Stock
									</p>
									<p className="text-2xl font-bold text-indigo-900 mt-2">
										{accountingData.inventory.products
											.reduce((sum, p) => sum + p.quantity, 0)
											.toLocaleString()}
									</p>
								</CardBody>
							</Card>

							<Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
								<CardBody>
									<p className="text-purple-700 text-sm font-medium flex items-center gap-2">
										<DollarSign size={16} />
										Total Inventory Capital
									</p>
									<p className="text-2xl font-bold text-purple-900 mt-2">
										₦{accountingData.inventory.totalCapital.toLocaleString()}
									</p>
									<p className="text-xs text-purple-700 mt-1">
										Capital Tied Up in Stock
									</p>
								</CardBody>
							</Card>
						</div>

						<Card>
							<CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100">
								<h2 className="text-lg font-bold flex items-center gap-2 text-cyan-900">
									<Package size={20} />
									All Products Stock Value
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Brand
											</th>
											<th className="text-left py-2 px-3 font-semibold text-gray-700">
												Category
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Qty in Stock
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Cost Price/Unit
											</th>
											<th className="text-right py-2 px-3 font-semibold text-gray-700">
												Total Capital
											</th>
										</tr>
									</thead>
									<tbody>
										{accountingData.inventory.products.map((product) => (
											<tr
												key={product.id}
												className="border-b border-gray-200 hover:bg-gray-50"
											>
												<td className="py-2 px-3 font-medium">
													{product.name}
												</td>
												<td className="py-2 px-3 text-gray-600">
													{product.brand}
												</td>
												<td className="py-2 px-3 text-gray-600">
													{product.category}
												</td>
												<td className="py-2 px-3 text-right">
													<span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded font-bold">
														{product.quantity.toLocaleString()}
													</span>
												</td>
												<td className="py-2 px-3 text-right text-gray-600">
													₦{product.costPrice.toLocaleString()}
												</td>
												<td className="py-2 px-3 text-right font-semibold text-purple-600">
													₦{product.totalCapital.toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
											<td colSpan={5} className="py-3 px-3 text-right">
												TOTAL INVENTORY CAPITAL:
											</td>
											<td className="py-3 px-3 text-right text-purple-700 text-lg">
												₦
												{accountingData.inventory.totalCapital.toLocaleString()}
											</td>
										</tr>
									</tfoot>
								</table>
							</CardBody>
						</Card>
					</div>
				</>
			)}

			{/* Profit Analysis Tab */}
			{activeTab === 'profit' && (
				<>
					<div className="mb-8">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
							<Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
								<CardBody>
									<p className="text-blue-700 text-sm font-medium flex items-center gap-2">
										<DollarSign size={16} />
										Total Revenue
									</p>
									<p className="text-2xl font-bold text-blue-900 mt-2">
										₦{accountingData.summary.totalRevenue.toLocaleString()}
									</p>
								</CardBody>
							</Card>

							<Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
								<CardBody>
									<p className="text-green-700 text-sm font-medium flex items-center gap-2">
										<TrendingUp size={16} />
										Total Profit
									</p>
									<p className="text-2xl font-bold text-green-900 mt-2">
										₦{accountingData.summary.totalProfit.toLocaleString()}
									</p>
									<p className="text-xs text-green-700 mt-1">
										{profitMargin}% margin
									</p>
								</CardBody>
							</Card>

							<Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
								<CardBody>
									<p className="text-purple-700 text-sm font-medium">COGS</p>
									<p className="text-2xl font-bold text-purple-900 mt-2">
										₦{accountingData.summary.totalCost.toLocaleString()}
									</p>
									<p className="text-xs text-purple-700 mt-1">
										Cost of Goods Sold
									</p>
								</CardBody>
							</Card>

							<Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
								<CardBody>
									<p className="text-orange-700 text-sm font-medium">
										Transactions
									</p>
									<p className="text-2xl font-bold text-orange-900 mt-2">
										{accountingData.summary.totalTransactions}
									</p>
								</CardBody>
							</Card>
						</div>

						{/* Product Analysis Section */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Most Sold Products */}
							<Card>
								<CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
									<h2 className="text-lg font-bold flex items-center gap-2 text-indigo-900">
										<ArrowUp size={20} />
										Most Sold Products
									</h2>
								</CardHeader>
								<CardBody className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-2 px-3 font-semibold text-gray-700">
													Product
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Qty Sold
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Revenue
												</th>
											</tr>
										</thead>
										<tbody>
											{accountingData.productAnalysis.mostSold.map(
												(product, idx) => (
													<tr
														key={idx}
														className="border-b border-gray-200 hover:bg-gray-50"
													>
														<td className="py-2 px-3 font-medium">
															{product.name}
														</td>
														<td className="py-2 px-3 text-right">
															<span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-bold">
																{product.quantitySold}
															</span>
														</td>
														<td className="py-2 px-3 text-right font-semibold text-indigo-600">
															₦{product.revenue.toLocaleString()}
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
									{accountingData.productAnalysis.mostSold.length === 0 && (
										<div className="text-center py-6 text-gray-600">
											No sales data available
										</div>
									)}
								</CardBody>
							</Card>

							{/* Highest Profiting Products */}
							<Card>
								<CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
									<h2 className="text-lg font-bold flex items-center gap-2 text-green-900">
										<TrendingUp size={20} />
										Highest Profiting Products
									</h2>
								</CardHeader>
								<CardBody className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-2 px-3 font-semibold text-gray-700">
													Product
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Profit
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Margin
												</th>
											</tr>
										</thead>
										<tbody>
											{accountingData.productAnalysis.highestProfit.map(
												(product, idx) => (
													<tr
														key={idx}
														className="border-b border-gray-200 hover:bg-gray-50"
													>
														<td className="py-2 px-3 font-medium">
															{product.name}
														</td>
														<td className="py-2 px-3 text-right font-semibold text-green-600">
															₦{product.profit.toLocaleString()}
														</td>
														<td className="py-2 px-3 text-right text-green-700">
															{product.marginPercent.toFixed(1)}%
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
									{accountingData.productAnalysis.highestProfit.length ===
										0 && (
										<div className="text-center py-6 text-gray-600">
											No sales data available
										</div>
									)}
								</CardBody>
							</Card>

							{/* Lowest Sold Products */}
							<Card>
								<CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100">
									<h2 className="text-lg font-bold flex items-center gap-2 text-yellow-900">
										<ArrowDown size={20} />
										Lowest Sold Products
									</h2>
								</CardHeader>
								<CardBody className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-2 px-3 font-semibold text-gray-700">
													Product
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Qty Sold
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Revenue
												</th>
											</tr>
										</thead>
										<tbody>
											{accountingData.productAnalysis.lowestSold.map(
												(product, idx) => (
													<tr
														key={idx}
														className="border-b border-gray-200 hover:bg-gray-50"
													>
														<td className="py-2 px-3 font-medium">
															{product.name}
														</td>
														<td className="py-2 px-3 text-right">
															<span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">
																{product.quantitySold}
															</span>
														</td>
														<td className="py-2 px-3 text-right font-semibold text-yellow-600">
															₦{product.revenue.toLocaleString()}
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
									{accountingData.productAnalysis.lowestSold.length === 0 && (
										<div className="text-center py-6 text-gray-600">
											No sales data available
										</div>
									)}
								</CardBody>
							</Card>

							{/* Lowest Profiting Products */}
							<Card>
								<CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
									<h2 className="text-lg font-bold flex items-center gap-2 text-red-900">
										<TrendingDown size={20} />
										Lowest Profiting Products
									</h2>
								</CardHeader>
								<CardBody className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-2 px-3 font-semibold text-gray-700">
													Product
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Profit
												</th>
												<th className="text-right py-2 px-3 font-semibold text-gray-700">
													Margin
												</th>
											</tr>
										</thead>
										<tbody>
											{accountingData.productAnalysis.lowestProfit.map(
												(product, idx) => (
													<tr
														key={idx}
														className="border-b border-gray-200 hover:bg-gray-50"
													>
														<td className="py-2 px-3 font-medium">
															{product.name}
														</td>
														<td className="py-2 px-3 text-right font-semibold text-red-600">
															₦{product.profit.toLocaleString()}
														</td>
														<td className="py-2 px-3 text-right text-red-700">
															{product.marginPercent.toFixed(1)}%
														</td>
													</tr>
												),
											)}
										</tbody>
									</table>
									{accountingData.productAnalysis.lowestProfit.length === 0 && (
										<div className="text-center py-6 text-gray-600">
											No sales data available
										</div>
									)}
								</CardBody>
							</Card>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
