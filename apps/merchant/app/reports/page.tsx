'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import {
	Calendar,
	TrendingUp,
	AlertTriangle,
	DollarSign,
	Users,
	ChevronDown,
	BarChart3,
	Package,
	Bell,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { KeeperGate } from '@/components/KeeperGate';
import { ReceiptModal } from '@/components/ReceiptModal';
import { useStoreAuth } from '@/hooks/use-store-auth';

interface ReportData {
	period: string;
	startDate: string;
	endDate: string;
	summary: {
		totalRevenue: number;
		totalCost: number;
		totalProfit: number;
		totalTransactions: number;
		averageTransaction: number;
	};
	lowStockProducts: any[];
	workerPerformance: any[];
	salesData: any[];
}

export default function ReportsPage() {
	return (
		<Layout headerHeight="15vh">
			<KeeperGate
				title="Reports"
				description="Enter the store keeper password to view sales and analytics reports."
			>
				<ReportsContent />
			</KeeperGate>
		</Layout>
	);
}

function ReportsContent() {
	const { auth } = useStoreAuth();
	const [reportData, setReportData] = useState<ReportData | null>(null);
	const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
	const [selectedDate, setSelectedDate] = useState(
		new Date().toISOString().split('T')[0],
	);
	const [isLoading, setIsLoading] = useState(false);
	const [showReceipt, setShowReceipt] = useState(false);
	const [receiptData, setReceiptData] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<'report' | 'inventory'>('report');
	const [notifications, setNotifications] = useState<any[]>([]);
	const [restockHistory, setRestockHistory] = useState<any[]>([]);
	const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(
		new Set(),
	);
	const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
	const mobileDateInputRef = React.useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchReport();
		fetchRestockHistory();
		fetchNotifications();
	}, [period, selectedDate, auth]);

	const fetchNotifications = async () => {
		try {
			// determine date range based on period + selectedDate (reuse logic from restock)
			const dateObj = new Date(selectedDate);
			let startDate = new Date(dateObj);
			let endDate: Date = new Date(dateObj);

			if (period === 'daily') {
				startDate.setHours(0, 0, 0, 0);
				endDate.setHours(23, 59, 59, 999);
			} else if (period === 'weekly') {
				startDate.setDate(dateObj.getDate() - dateObj.getDay());
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(startDate);
				endDate.setDate(startDate.getDate() + 6);
				endDate.setHours(23, 59, 59, 999);
			} else if (period === 'monthly') {
				startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
				endDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
				endDate.setHours(23, 59, 59, 999);
			}

			const notes: any[] = [];

			// 1) Credits + credit payments
			const credResp = await fetch('/api/credits', {
				headers: {
					Authorization: auth?.token ? `Bearer ${auth.token}` : '',
					'x-store-id': auth?.store?.id || '',
				},
			});
			if (credResp.ok) {
				const credits = await credResp.json();
				credits.forEach((c: any) => {
					// show credit creation if within range
					const createdAt = new Date(c.createdAt);
					if (createdAt >= startDate && createdAt <= endDate) {
						notes.push({
							id: `credit-${c.id}`,
							type: 'credit_created',
							customerName: c.customerName,
							amount: c.totalOwed,
							date: createdAt,
							creditId: c.id,
							workerName: c.sale?.worker?.name,
							isPaid: false,
						});
					}

					// credit payments
					(c.payments || []).forEach((p: any) => {
						const pDate = new Date(p.createdAt);
						if (pDate >= startDate && pDate <= endDate) {
							notes.push({
								id: `payment-${p.id}`,
								type: 'credit_payment',
								customerName: c.customerName,
								amount: p.amount,
								date: pDate,
								creditId: c.id,
								paymentStatus: c.paymentStatus,
								workerName: c.sale?.worker?.name,
								isPaid: true,
							});
						}
					});
				});
			}

			// 2) Sales (partial payments & overpayments)
			const salesResp = await fetch(
				`/api/sales?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
				{
					headers: {
						Authorization: auth?.token ? `Bearer ${auth.token}` : '',
						'x-store-id': auth?.store?.id || '',
					},
				},
			);
			if (salesResp.ok) {
				const sales = await salesResp.json();
				sales.forEach((s: any) => {
					const sDate = new Date(s.createdAt);
					// partial payment: amountPaid > 0 and remainingBalance > 0
					if (s.amountPaid > 0 && s.remainingBalance > 0) {
						notes.push({
							id: `sale-partial-${s.id}`,
							type: 'sale_partial',
							customerName: s.customerName || null,
							amountPaid: s.amountPaid,
							remaining: s.remainingBalance,
							date: sDate,
							saleId: s.id,
							workerName: s.worker?.name,
							isPaid: true,
						});
					}

					// overpayment -> store credit converted
					if (s.amountPaid > s.totalPrice) {
						const over = s.amountPaid - s.totalPrice;
						notes.push({
							id: `sale-over-${s.id}`,
							type: 'sale_overpaid',
							customerName: s.customerName || null,
							amount: over,
							date: sDate,
							saleId: s.id,
							workerName: s.worker?.name,
							isPaid: true,
						});
					}
				});
			}

			// sort by date desc and set
			notes.sort((a, b) => b.date.getTime() - a.date.getTime());
			setNotifications(notes);
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
		}
	};

	const fetchReport = async () => {
		setIsLoading(true);
		try {
			const headers: HeadersInit = {};
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch(
				`/api/reports?period=${period}&date=${selectedDate}`,
				{ headers },
			);

			if (response.ok) {
				const data = await response.json();
				setReportData(data);
			}
		} catch (error) {
			console.error('Failed to fetch report:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchRestockHistory = async () => {
		try {
			// Calculate date range based on period
			const dateObj = new Date(selectedDate);
			let startDate = new Date(dateObj);
			let endDate: Date = new Date(dateObj);

			if (period === 'daily') {
				startDate.setHours(0, 0, 0, 0);
				endDate.setHours(23, 59, 59, 999);
			} else if (period === 'weekly') {
				startDate.setDate(dateObj.getDate() - dateObj.getDay());
				startDate.setHours(0, 0, 0, 0);
				endDate = new Date(startDate);
				endDate.setDate(startDate.getDate() + 6);
				endDate.setHours(23, 59, 59, 999);
			} else if (period === 'monthly') {
				startDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
				endDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
				endDate.setHours(23, 59, 59, 999);
			}

			const headers: HeadersInit = {};
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch(
				`/api/restocks?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
				{ headers },
			);

			if (response.ok) {
				const data = await response.json();
				setRestockHistory(data);
			}
		} catch (error) {
			console.error('Failed to fetch restock history:', error);
		}
	};

	const handleShowReceipt = (sale: any) => {
		console.log('[v0] Sale data:', sale);
		console.log('[v0] Sale items:', sale.items);
		setReceiptData({
			saleId: sale.id,
			transactionId: sale.transactionId,
			items: sale.items.map((item: any) => {
				console.log('[v0] Item:', item);
				console.log('[v0] Product:', item.product);
				return {
					name: item.product?.name || 'Product',
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					totalPrice: item.totalPrice,
					unit: item.sellByBulk
						? item.product?.bulkUnitName || item.product?.unitName || item.unit
						: item.product?.unitName || item.unit,
				};
			}),
			totalPrice: sale.totalPrice,
			amountPaid: sale.amountPaid,
			remainingBalance: sale.remainingBalance,
			paymentMethod: sale.paymentMethod || 'cash',
			paymentType:
				sale.paymentStatus === 'partial'
					? 'partial'
					: sale.paymentStatus === 'completed'
						? 'cash'
						: 'credit',
			workerName: sale.worker.name,
		});
		setShowReceipt(true);
	};

	if (!reportData) {
		return (
			<div className="p-8 flex items-center justify-center min-h-[85vh]">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
					<p className="text-gray-600">Loading report...</p>
				</div>
			</div>
		);
	}

	const profitMargin =
		reportData.summary.totalRevenue > 0
			? (
					(reportData.summary.totalProfit / reportData.summary.totalRevenue) *
					100
				).toFixed(1)
			: '0';

	const toggleWorker = (workerName: string) => {
		setExpandedWorkers((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(workerName)) {
				newSet.delete(workerName);
			} else {
				newSet.add(workerName);
			}
			return newSet;
		});
	};

	return (
		<div className="p-2">
			{/* Header */}
			<header className="mb-2">
				<div className="flex flex-row justify-between md:items-center mb-4">
					<div>
						<h1 className="text-xl md:text-3xl font-bold text-gray-900">
							Sales
						</h1>
						<p className="text-gray-600">
							View analytics, and monitor inventory <br className="md:hidden" />{' '}
							all in one place.
						</p>
					</div>
					<button
						onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
						className={`self-start md:self-center mt-4 md:mt-0 px-3 md:px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
							showNotificationsPanel
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<Bell size={24} />
						<span className="hidden md:inline">Notifications</span>
					</button>
				</div>
			</header>

			{/* Tab Navigation with Period Selector */}
			<div className="flex justify-between items-center gap-4 mb-4 border-b border-gray-200">
				<div className="flex gap-0">
					<button
						onClick={() => setActiveTab('report')}
						className={`px-3 md:px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
							activeTab === 'report'
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<BarChart3 size={18} />
						Sales
						<span className="hidden md:inline">Report</span>
					</button>
					<button
						onClick={() => setActiveTab('inventory')}
						className={`px-3 md:px-6 py-3 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
							activeTab === 'inventory'
								? 'border-blue-600 text-blue-600'
								: 'border-transparent text-gray-600 hover:text-gray-900'
						}`}
					>
						<Package size={18} />
						Inventory
						<span className="hidden md:inline">& Restocks</span>
					</button>
				</div>

				{/* Period Selector */}
				<div className="flex gap-2 md:gap-4 items-end flex-wrap mb-2">
					<div>
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
							Period
						</label>
						<select
							value={period}
							onChange={(e) =>
								setPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')
							}
							className="px-2 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
						>
							<option value="daily">Daily</option>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
						</select>
					</div>

					<div className="md:flex md:flex-col hidden">
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
							Date
						</label>
						<input
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="px-2 md:px-4 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="md:hidden">
						<input
							id="mobile-date-input"
							type="date"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="hidden"
						/>
						<button
							onClick={() =>
								document.getElementById('mobile-date-input')?.click()
							}
							className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
							title="Select date"
						>
							<Calendar size={20} className="text-gray-600" />
						</button>
					</div>
				</div>
			</div>

			{/* Report Tab */}
			{activeTab === 'report' && (
				<>
					{/* Summary Dashboard Card */}
					<Card className="bg-none borde-b border-slate-200 mb-4">
						<CardBody>
							<h3 className="text-lg font-semibold text-slate-800 mb-4">
								Financial Summary
							</h3>

							{/* Metrics Grid - 2x2 on mobile, 4x1 on desktop */}
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{/* Revenue */}
								<div>
									<p className="text-blue-700 text-xs font-medium flex items-center gap-1 mb-1">
										<DollarSign size={14} />
										Total Revenue
									</p>
									<p className="text-lg font-bold text-blue-900">
										₦{reportData.summary.totalRevenue.toLocaleString()}
									</p>
								</div>

								{/* Profit */}
								<div>
									<p className="text-green-700 text-xs font-medium flex items-center gap-1 mb-1">
										<TrendingUp size={14} />
										Total Profit
									</p>
									<p className="text-lg font-bold text-green-900">
										₦{reportData.summary.totalProfit.toLocaleString()}
									</p>
									<p className="text-xs text-green-700">
										{profitMargin}% margin
									</p>
								</div>

								{/* Cost */}
								<div>
									<p className="text-purple-700 text-xs font-medium mb-1">
										Total COGS
									</p>
									<p className="text-lg font-bold text-purple-900">
										₦{reportData.summary.totalCost.toLocaleString()}
									</p>
									<p className="text-xs text-purple-700 mt-1">
										Cost of Goods Sold
									</p>
								</div>

								{/* Transactions */}
								<div>
									<p className="text-orange-700 text-xs font-medium flex items-center gap-1 mb-1">
										<Users size={14} />
										No of Transactions
									</p>
									<p className="text-lg font-bold text-orange-900">
										{reportData.summary.totalTransactions}
									</p>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Worker Performance */}
					<Card className="mb-4">
						<CardHeader>
							<h2 className="text-xl font-bold flex items-center gap-2">
								<Users size={24} />
								Workers Performance
							</h2>
						</CardHeader>
						<CardBody className="p-0">
							<div className="divide-y divide-gray-200">
								{reportData.workerPerformance.map((worker, index) => (
									<div key={index} className="border-b border-gray-200">
										<button
											onClick={() => toggleWorker(worker.worker)}
											className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
										>
											<span className="text-left font-semibold text-gray-900">
												{worker.worker}
											</span>
											<ChevronDown
												size={20}
												className={`text-gray-500 transition-transform ${
													expandedWorkers.has(worker.worker)
														? 'transform rotate-180'
														: ''
												}`}
											/>
										</button>

										{expandedWorkers.has(worker.worker) && (
											<div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
												<div className="grid grid-cols-3 gap-6">
													<div>
														<p className="text-sm text-gray-600 font-medium mb-1">
															Transactions
														</p>
														<p className="text-2xl font-bold ">
															{worker.sales}
														</p>
													</div>
													<div>
														<p className="text-sm text-gray-600 font-medium mb-1">
															Total Sales
														</p>
														<p className="text-2xl font-bold ">
															₦{worker.revenue.toLocaleString()}
														</p>
													</div>
													<div>
														<p className="text-sm text-gray-600 font-medium mb-1">
															Average Sale
														</p>
														<p className="text-2xl font-bold ">
															₦
															{(worker.revenue / worker.sales).toLocaleString()}
														</p>
													</div>
												</div>
											</div>
										)}
									</div>
								))}
							</div>

							{reportData.workerPerformance.length === 0 && (
								<div className="text-center py-8">
									<p className="text-gray-600">No sales data for this period</p>
								</div>
							)}
						</CardBody>
					</Card>

					{/* Sales Details */}
					<Card>
						<CardHeader>
							<h2 className="text-xl font-bold">Transactions</h2>
						</CardHeader>
						<CardBody className="overflow-x-auto hidden md:block">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-2 px-4 font-semibold text-gray-700">
											Time
										</th>
										<th className="text-left py-2 px-4 font-semibold text-gray-700">
											Transaction ID
										</th>
										<th className="text-left py-2 px-4 font-semibold text-gray-700">
											Worker
										</th>
										<th className="text-left py-2 px-4 font-semibold text-gray-700">
											Payment Method
										</th>
										<th className="text-right py-2 px-4 font-semibold text-gray-700">
											Amount
										</th>
										<th className="text-right py-2 px-4 font-semibold text-gray-700">
											Paid
										</th>
										<th className="text-right py-2 px-4 font-semibold text-gray-700">
											Balance
										</th>
										<th className="text-right py-2 px-4 font-semibold text-gray-700">
											Cost
										</th>
										<th className="text-right py-2 px-4 font-semibold text-gray-700">
											Profit
										</th>
									</tr>
								</thead>
								<tbody>
									{reportData.salesData.map((sale) => {
										const balance = sale.totalPrice - sale.amountPaid;
										const balanceColor =
											balance < 0
												? 'text-green-600'
												: balance > 0
													? 'text-red-600'
													: 'text-gray-600';
										return (
											<tr
												key={sale.id}
												className="border-b border-gray-200 hover:bg-gray-50"
											>
												<td className="py-2 px-4">
													{new Date(sale.createdAt).toLocaleTimeString()}
												</td>
												<td className="py-2 px-4 font-mono text-xs text-gray-600">
													<button
														onClick={() => handleShowReceipt(sale)}
														className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
													>
														{sale.transactionId}
													</button>
												</td>
												<td className="py-2 px-4">{sale.worker.name}</td>
												<td className="py-2 px-4 text-sm">
													<span
														className={`px-2 py-1 rounded-full text-xs font-medium ${
															sale.paymentMethod === 'cash'
																? 'bg-green-100 text-green-800'
																: sale.paymentMethod === 'transfer'
																	? 'bg-blue-100 text-blue-800'
																	: 'bg-amber-100 text-amber-800'
														}`}
													>
														{sale.paymentMethod === 'cash'
															? '💵 Cash'
															: sale.paymentMethod === 'transfer'
																? '🔄 Transfer'
																: '⏳ Partial'}
													</span>
												</td>
												<td className="py-2 px-4 text-right font-semibold">
													₦{sale.totalPrice.toLocaleString()}
												</td>
												<td className="py-2 px-4 text-right font-semibold">
													₦{sale.amountPaid.toLocaleString()}
												</td>
												<td
													className={`py-2 px-4 text-right font-semibold ${balanceColor}`}
												>
													{balance < 0 ? '✓ ' : balance > 0 ? '✗ ' : ''}₦
													{Math.abs(balance).toLocaleString()}
												</td>
												<td className="py-2 px-4 text-right text-gray-600">
													₦{sale.totalCost.toLocaleString()}
												</td>
												<td className="py-2 px-4 text-right font-semibold text-green-600">
													₦{(sale.totalPrice - sale.totalCost).toLocaleString()}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>

							{reportData.salesData.length === 0 && (
								<div className="text-center py-8">
									<p className="text-gray-600">No sales for this period</p>
								</div>
							)}
						</CardBody>

						{/* Mobile Card View */}
						<CardBody className="md:hidden p-0">
							<div className="space-y-3">
								{reportData.salesData.map((sale) => {
									const balance = sale.totalPrice - sale.amountPaid;
									const paymentMethodLabel =
										sale.paymentMethod === 'cash'
											? `💵 Cash: ₦${sale.amountPaid.toLocaleString()}`
											: sale.paymentMethod === 'transfer'
												? `🔄 Transfer: ₦${sale.amountPaid.toLocaleString()}`
												: `⏳ Partial: ₦${sale.amountPaid.toLocaleString()}`;
									return (
										<div
											key={sale.id}
											onClick={() => handleShowReceipt(sale)}
											className="bg-white border-b-2 border-gray-200 p-1 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow"
										>
											<div className="flex justify-between items-start mb-3">
												<div>
													<h3 className="font-bold text-lg text-gray-900">
														{sale.worker.name}
													</h3>
												</div>
												<div>
													<p className="text-sm text-gray-500 mb-1">
														<span
															className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
																sale.paymentMethod === 'cash'
																	? 'bg-green-100 text-green-800'
																	: sale.paymentMethod === 'transfer'
																		? 'bg-blue-100 text-blue-800'
																		: 'bg-amber-100 text-amber-800'
															}`}
														>
															Total Amount ₦{sale.totalPrice.toLocaleString()}
														</span>
													</p>
												</div>
											</div>
											<p className="block text-xs text-gray-600 items-center gap-1 my-2">
												<span className="text-gray-400">ID:</span>
												<span className="font-mono text-xs">
													{sale.transactionId}
												</span>
											</p>

											<div className="flex justify-between items-end">
												<div>
													<p className="text-xs text-gray-500 mb-1">
														{sale.paymentMethod === 'cash'
															? 'Cash'
															: sale.paymentMethod === 'transfer'
																? 'Transfer'
																: 'Partial'}
													</p>
													<p className="text-2xl font-bold text-blue-600">
														₦{sale.amountPaid.toLocaleString()}
													</p>
												</div>
												<div className="text-right">
													<p className="text-xs text-gray-500 mb-1">
														{new Date(sale.createdAt).toLocaleDateString()}
													</p>
													{balance !== 0 && (
														<p
															className={`text-sm font-semibold ${
																balance < 0 ? 'text-green-600' : 'text-red-600'
															}`}
														>
															Balance: {balance < 0 ? '+' : ''}₦
															{Math.abs(balance).toLocaleString()}
														</p>
													)}
													{balance === 0 && (
														<p className="text-sm font-semibold text-gray-600">
															Paid in full
														</p>
													)}
												</div>
											</div>
										</div>
									);
								})}

								{reportData.salesData.length === 0 && (
									<div className="text-center py-8">
										<p className="text-gray-600 text-lg">
											No sales for this period
										</p>
									</div>
								)}
							</div>
						</CardBody>
					</Card>
				</>
			)}
			{activeTab === 'inventory' && (
				<>
					{/* Low Stock Alert */}
					{reportData.lowStockProducts.length > 0 && (
						<Card className="border-amber-200 mb-8">
							<CardHeader className="bg-amber-50">
								<h2 className="text-xl font-bold flex items-center gap-2 text-amber-900">
									<AlertTriangle size={24} />
									Low Stock Alert
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-3 px-4 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-left py-3 px-4 font-semibold text-gray-700">
												Brand
											</th>
											<th className="text-center py-3 px-4 font-semibold text-gray-700">
												Current Stock
											</th>
											<th className="text-right py-3 px-4 font-semibold text-gray-700">
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{reportData.lowStockProducts.map((product) => (
											<tr
												key={product.id}
												className="border-b border-gray-200 hover:bg-gray-50"
											>
												<td className="py-3 px-4 font-medium">
													{product.name}
												</td>
												<td className="py-3 px-4 text-gray-600">
													{product.brand}
												</td>
												<td className="py-3 px-4 text-center">
													<span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
														{product.quantity}
													</span>
												</td>
												<td className="py-3 px-4 text-right">
													<Button variant="primary" size="sm">
														Restock
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</CardBody>
						</Card>
					)}

					{/* Restock History */}
					{restockHistory.length > 0 && (
						<Card>
							<CardHeader className="bg-blue-50">
								<h2 className="text-xl font-bold flex items-center gap-2 text-blue-900">
									📦 Restock History
								</h2>
							</CardHeader>
							<CardBody className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-200">
											<th className="text-left py-2 px-4 font-semibold text-gray-700">
												Product
											</th>
											<th className="text-left py-2 px-4 font-semibold text-gray-700">
												Brand
											</th>
											<th className="text-right py-2 px-4 font-semibold text-gray-700">
												Quantity Added
											</th>
											<th className="text-right py-2 px-4 font-semibold text-gray-700">
												Cost Price
											</th>
											<th className="text-right py-2 px-4 font-semibold text-gray-700">
												Total Cost
											</th>
											<th className="text-left py-2 px-4 font-semibold text-gray-700">
												Date/Time
											</th>
										</tr>
									</thead>
									<tbody>
										{restockHistory.map((restock: any) => (
											<tr
												key={restock.id}
												className="border-b border-gray-200 hover:bg-gray-50"
											>
												<td className="py-2 px-4 font-medium">
													{restock.product.name}
												</td>
												<td className="py-2 px-4 text-gray-600">
													{restock.product.brand}
												</td>
												<td className="py-2 px-4 text-right font-semibold">
													{restock.quantity} units
												</td>
												<td className="py-2 px-4 text-right text-gray-600">
													₦{restock.costPrice.toLocaleString()}
												</td>
												<td className="py-2 px-4 text-right font-semibold text-blue-600">
													₦
													{(
														restock.quantity * restock.costPrice
													).toLocaleString()}
												</td>
												<td className="py-2 px-4 text-sm text-gray-600">
													{new Date(restock.createdAt).toLocaleString()}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</CardBody>
						</Card>
					)}

					{restockHistory.length === 0 &&
						reportData.lowStockProducts.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600">
									No inventory or restock data for this period
								</p>
							</div>
						)}
				</>
			)}

			{/* Notifications Slide-In Panel */}
			<div
				className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
					showNotificationsPanel ? 'translate-x-0' : 'translate-x-full'
				}`}
			>
				<div className="h-full flex flex-col">
					<div className="flex items-center justify-between p-4 border-b border-gray-200">
						<h2 className="text-xl font-bold flex items-center gap-2">
							<Bell size={24} />
							Notifications
						</h2>
						<button
							onClick={() => setShowNotificationsPanel(false)}
							className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
						>
							×
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-4">
						{notifications.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600">No notifications</p>
							</div>
						)}
						<ul className="space-y-3">
							{notifications.map((n) => (
								<li key={n.id} className="p-3 border rounded-lg bg-white">
									<div className="flex justify-between items-start">
										<div>
											{n.type === 'credit_created' && (
												<p className="text-sm">
													<strong>{n.customerName}</strong> was given a credit
													of <strong>₦{n.amount.toLocaleString()}</strong>
													{n.workerName && (
														<>
															{' '}
															by{' '}
															<strong className="text-red-600">
																{n.workerName}
															</strong>
														</>
													)}
												</p>
											)}
											{n.type === 'credit_payment' && (
												<p className="text-sm">
													<strong>{n.customerName}</strong> paid{' '}
													<strong>₦{n.amount.toLocaleString()}</strong> (
													{n.paymentStatus === 'paid' ||
													n.paymentStatus === 'completed'
														? 'completed'
														: 'partial'}
													)
													{n.workerName && (
														<>
															{' '}
															by{' '}
															<strong className="text-green-600">
																{n.workerName}
															</strong>
														</>
													)}
												</p>
											)}
											{n.type === 'sale_partial' && (
												<p className="text-sm">
													<strong>{n.customerName || 'Customer'}</strong> made
													partial payment of{' '}
													<strong>₦{n.amountPaid.toLocaleString()}</strong>{' '}
													(balance:{' '}
													<strong>₦{n.remaining.toLocaleString()}</strong>)
													{n.workerName && (
														<>
															{' '}
															by{' '}
															<strong className="text-green-600">
																{n.workerName}
															</strong>
														</>
													)}
												</p>
											)}
											{n.type === 'sale_overpaid' && (
												<p className="text-sm">
													<strong>{n.customerName || 'Customer'}</strong>{' '}
													overpaid by{' '}
													<strong>₦{n.amount.toLocaleString()}</strong>{' '}
													(converted to credit)
													{n.workerName && (
														<>
															{' '}
															by{' '}
															<strong className="text-green-600">
																{n.workerName}
															</strong>
														</>
													)}
												</p>
											)}
											<p className="text-xs text-gray-500 mt-1">
												{n.date.toLocaleString()}
											</p>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{/* Backdrop for panel */}
			{showNotificationsPanel && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40"
					onClick={() => setShowNotificationsPanel(false)}
				/>
			)}

			{/* Receipt Modal */}
			{receiptData && (
				<ReceiptModal
					isOpen={showReceipt}
					onClose={() => setShowReceipt(false)}
					transactionId={receiptData.transactionId}
					storeName="PORES"
					workerName={receiptData.workerName}
					items={receiptData.items}
					totalPrice={receiptData.totalPrice}
					amountPaid={receiptData.amountPaid}
					remainingBalance={receiptData.remainingBalance}
					paymentType={receiptData.paymentType}
					customerName={receiptData.customerName}
					customerPhone={receiptData.customerPhone}
				/>
			)}
		</div>
	);
}
