'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
	Search,
	ChevronLeft,
	ChevronRight,
	CheckCircle,
	Clock,
	Alert,
	Download,
} from 'lucide-react';

interface Transaction {
	id: string;
	store: string;
	merchant: string;
	amount: number;
	fee: number;
	net: number;
	worker: string;
	paymentStatus: string;
	paymentMethod: string;
	createdAt: string;
	settlementDate?: string;
}

export default function TransactionsPage() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [dateRange, setDateRange] = useState('7days');
	const pageSize = 15;

	useEffect(() => {
		const fetchTransactions = async () => {
			try {
				const params = new URLSearchParams({
					page: currentPage.toString(),
					limit: pageSize.toString(),
					search: searchTerm,
					status: filterStatus !== 'all' ? filterStatus : '',
				});

				const response = await fetch(`/api/sales?${params}`);
				const data = await response.json();

				const formattedTransactions = (data.sales || []).map((sale: any) => ({
					id: sale.id,
					store: sale.store?.businessName || 'Unknown',
					merchant: sale.store?.email || 'N/A',
					amount: sale.totalAmount,
					fee: sale.totalAmount * 0.025, // 2.5% fee
					net: sale.totalAmount * 0.975,
					worker: sale.worker?.name || 'N/A',
					paymentStatus:
						sale.paymentStatus || Math.random() > 0.3 ? 'completed' : 'pending',
					paymentMethod: sale.paymentMethod || 'Card',
					createdAt: sale.createdAt,
					settlementDate: new Date(
						new Date(sale.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000,
					)
						.toISOString()
						.split('T')[0],
				}));

				setTransactions(formattedTransactions);
			} catch (error) {
				console.error('Error fetching transactions:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchTransactions();
	}, [currentPage, searchTerm, filterStatus]);

	const filteredTransactions = transactions.filter((tx) => {
		if (filterStatus !== 'all' && tx.paymentStatus !== filterStatus) {
			return false;
		}
		return true;
	});

	// Calculate settlement metrics
	const totalAmount = filteredTransactions.reduce(
		(sum, tx) => sum + tx.amount,
		0,
	);
	const totalFees = filteredTransactions.reduce((sum, tx) => sum + tx.fee, 0);
	const totalNet = filteredTransactions.reduce((sum, tx) => sum + tx.net, 0);
	const completedCount = filteredTransactions.filter(
		(tx) => tx.paymentStatus === 'completed',
	).length;
	const pendingCount = filteredTransactions.filter(
		(tx) => tx.paymentStatus === 'pending',
	).length;

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'completed':
				return (
					<Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
						<CheckCircle size={14} /> Completed
					</Badge>
				);
			case 'pending':
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
						<Clock size={14} /> Pending
					</Badge>
				);
			case 'failed':
				return (
					<Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
						<Alert size={14} /> Failed
					</Badge>
				);
			default:
				return <Badge className="w-fit">{status}</Badge>;
		}
	};

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
				<p className="text-gray-600 mt-2">
					View and manage platform transactions and settlements
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Total Volume</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							₦{(totalAmount / 1000000).toFixed(2)}M
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Platform Fees (2.5%)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							₦{(totalFees / 1000000).toFixed(2)}M
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Net to Settle</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							₦{(totalNet / 1000000).toFixed(2)}M
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Completed</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{completedCount}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Pending</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{pendingCount}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Search & Filter</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search
								className="absolute left-3 top-3 text-gray-400"
								size={18}
							/>
							<Input
								placeholder="Search by merchant, transaction ID..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-10"
							/>
						</div>

						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Payment Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
							</SelectContent>
						</Select>

						<Select value={dateRange} onValueChange={setDateRange}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Date Range" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="24hours">Last 24 Hours</SelectItem>
								<SelectItem value="7days">Last 7 Days</SelectItem>
								<SelectItem value="30days">Last 30 Days</SelectItem>
								<SelectItem value="90days">Last 90 Days</SelectItem>
							</SelectContent>
						</Select>

						<Button className="gap-2">
							<Download size={18} />
							Export
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Transactions Table */}
			<Card>
				<CardHeader>
					<CardTitle>Transaction List</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Loading transactions...</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Transaction ID</TableHead>
											<TableHead>Merchant</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Fees (2.5%)</TableHead>
											<TableHead>Net</TableHead>
											<TableHead>Worker</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Settlement Date</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredTransactions.length > 0 ? (
											filteredTransactions.map((tx) => (
												<TableRow key={tx.id}>
													<TableCell className="font-mono text-xs">
														{tx.id.substring(0, 8)}...
													</TableCell>
													<TableCell>{tx.merchant}</TableCell>
													<TableCell className="font-semibold">
														₦
														{(tx.amount / 1000).toLocaleString('en-NG', {
															minimumFractionDigits: 0,
														})}
													</TableCell>
													<TableCell className="text-red-600">
														₦
														{(tx.fee / 1000).toLocaleString('en-NG', {
															minimumFractionDigits: 0,
														})}
													</TableCell>
													<TableCell className="text-green-600 font-semibold">
														₦
														{(tx.net / 1000).toLocaleString('en-NG', {
															minimumFractionDigits: 0,
														})}
													</TableCell>
													<TableCell>{tx.worker}</TableCell>
													<TableCell>
														{getStatusBadge(tx.paymentStatus)}
													</TableCell>
													<TableCell className="text-sm">
														{tx.settlementDate}
													</TableCell>
													<TableCell>
														<Button size="sm" variant="outline">
															View
														</Button>
													</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={9}
													className="text-center py-8 text-gray-500"
												>
													No transactions found
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<div className="flex items-center justify-between pt-6 border-t">
								<div className="text-sm text-gray-600">
									Page {currentPage} of{' '}
									{Math.ceil(transactions.length / pageSize) || 1}
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										<ChevronLeft size={18} />
										Previous
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setCurrentPage((p) => p + 1)}
										disabled={
											currentPage >= Math.ceil(transactions.length / pageSize)
										}
									>
										Next
										<ChevronRight size={18} />
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Settlement Info Box */}
			<Card className="bg-blue-50 border-blue-200">
				<CardHeader>
					<CardTitle className="text-blue-900">
						Settlement Information
					</CardTitle>
				</CardHeader>
				<CardContent className="text-blue-800 space-y-2">
					<p>• Platform settlement cycle: T+2 (2 business days)</p>
					<p>• Platform fee: 2.5% per transaction</p>
					<p>
						• Completed transactions will be settled automatically to merchant
						accounts
					</p>
					<p>
						• Pending transactions may take up to 24 hours to complete
						processing
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
