'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface Worker {
	id: string;
	name: string;
	store: {
		businessName: string;
	};
	createdAt: string;
	salesCount: number;
	totalSalesAmount: number;
}

interface PaginatedResponse {
	workers: Worker[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function WorkersPage() {
	const [workers, setWorkers] = useState<Worker[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);

	useEffect(() => {
		fetchWorkers();
	}, [page]);

	const fetchWorkers = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '20',
			});
			const response = await fetch(`/api/workers?${params}`);
			const data: PaginatedResponse = await response.json();
			setWorkers(data.workers);
			setPagination(data.pagination);
		} catch (error) {
			console.error('Failed to fetch workers:', error);
		} finally {
			setLoading(false);
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
				Workers Management
			</h2>

			<Card>
				<CardHeader>
					<CardTitle>All Workers</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-gray-500">Loading workers...</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Worker Name</TableHead>
											<TableHead>Store</TableHead>
											<TableHead>Sales Count</TableHead>
											<TableHead>Total Sales Amount</TableHead>
											<TableHead>Avg Sale Amount</TableHead>
											<TableHead>Joined Date</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{workers.length > 0 ? (
											workers.map((worker) => {
												const avgAmount =
													worker.salesCount > 0
														? (
																worker.totalSalesAmount / worker.salesCount
															).toFixed(2)
														: '0.00';
												return (
													<TableRow key={worker.id}>
														<TableCell className="font-semibold">
															{worker.name}
														</TableCell>
														<TableCell>{worker.store.businessName}</TableCell>
														<TableCell className="text-center">
															{worker.salesCount}
														</TableCell>
														<TableCell className="font-semibold">
															₦{worker.totalSalesAmount.toLocaleString()}
														</TableCell>
														<TableCell>
															₦{parseFloat(avgAmount).toLocaleString()}
														</TableCell>
														<TableCell className="text-sm text-gray-600">
															{new Date(worker.createdAt).toLocaleDateString()}
														</TableCell>
													</TableRow>
												);
											})
										) : (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center text-gray-500"
												>
													No workers found
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
										Showing {workers.length} of {pagination.total} workers
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
