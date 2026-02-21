'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface Sale {
	id: string;
	transactionId: string;
	store: {
		businessName: string;
	};
	worker: {
		name: string;
	};
	totalPrice: number;
	totalCost: number;
	paymentStatus: string;
	createdAt: string;
	items: Array<{
		product: {
			name: string;
			brand: string;
		};
		quantity: number;
		unitPrice: number;
	}>;
}

interface PaginatedResponse {
	sales: Sale[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function SalesPage() {
	const [sales, setSales] = useState<Sale[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);
	const [paymentStatus, setPaymentStatus] = useState<string>('');

	useEffect(() => {
		fetchSales();
	}, [page, paymentStatus]);

	const fetchSales = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '20',
				...(paymentStatus && { paymentStatus }),
			});
			const response = await fetch(`/api/sales?${params}`);
			const data: PaginatedResponse = await response.json();
			setSales(data.sales);
			setPagination(data.pagination);
		} catch (error) {
			console.error('Failed to fetch sales:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-800';
			case 'partial':
				return 'bg-yellow-100 text-yellow-800';
			case 'pending':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className="p-8">
			<Link href="/">
				<Button variant="outline" className="mb-6">
					← Back
				</Button>
			</Link>

			<h2 className="text-3xl font-bold text-gray-800 mb-8">
				Sales Transactions
			</h2>

			<Card>
				<CardHeader>
					<CardTitle>All Sales</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 mb-6">
						<select
							value={paymentStatus}
							onChange={(e) => {
								setPaymentStatus(e.target.value);
								setPage(1);
							}}
							className="px-4 py-2 border rounded-md"
						>
							<option value="">All Status</option>
							<option value="completed">Completed</option>
							<option value="partial">Partial</option>
							<option value="pending">Pending</option>
						</select>
					</div>

					{loading ? (
						<div className="text-gray-500">Loading sales...</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Transaction ID</TableHead>
											<TableHead>Store</TableHead>
											<TableHead>Worker</TableHead>
											<TableHead>Items</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Profit</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{sales.length > 0 ? (
											sales.map((sale) => {
												const profit = sale.totalPrice - sale.totalCost;
												return (
													<TableRow key={sale.id}>
														<TableCell className="font-mono text-sm">
															{sale.transactionId}
														</TableCell>
														<TableCell>{sale.store.businessName}</TableCell>
														<TableCell>{sale.worker.name}</TableCell>
														<TableCell>{sale.items.length} item(s)</TableCell>
														<TableCell className="font-semibold">
															₦{sale.totalPrice.toLocaleString()}
														</TableCell>
														<TableCell className="text-green-600 font-semibold">
															₦{profit.toLocaleString()}
														</TableCell>
														<TableCell>
															<span
																className={`px-2 py-1 rounded text-sm ${getStatusColor(
																	sale.paymentStatus,
																)}`}
															>
																{sale.paymentStatus.charAt(0).toUpperCase() +
																	sale.paymentStatus.slice(1)}
															</span>
														</TableCell>
														<TableCell className="text-sm text-gray-600">
															{new Date(sale.createdAt).toLocaleDateString()}
														</TableCell>
													</TableRow>
												);
											})
										) : (
											<TableRow>
												<TableCell
													colSpan={8}
													className="text-center text-gray-500"
												>
													No sales found
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{pagination && pagination.pages > 1 && (
								<div className="flex justify-between items-center mt-6">
									<div className="text-sm text-gray-600">
										Showing {sales.length} of {pagination.total} sales
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											disabled={page === 1}
											onClick={() => setPage(page - 1)}
										>
											Previous
										</Button>
										<div className="flex items-center gap-2">
											<span className="text-sm">
												Page {page} of {pagination.pages}
											</span>
										</div>
										<Button
											variant="outline"
											disabled={page === pagination.pages}
											onClick={() => setPage(page + 1)}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
