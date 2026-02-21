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

interface Store {
	id: string;
	email: string;
	businessName: string;
	storeType: string;
	setupCompleted: boolean;
	createdAt: string;
	_count: {
		products: number;
		workers: number;
		sales: number;
	};
}

interface PaginatedResponse {
	stores: Store[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function UsersPage() {
	const [stores, setStores] = useState<Store[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);

	useEffect(() => {
		fetchStores();
	}, [page, searchTerm]);

	const fetchStores = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '10',
				...(searchTerm && { search: searchTerm }),
			});
			const response = await fetch(`/api/stores?${params}`);
			const data: PaginatedResponse = await response.json();
			setStores(data.stores);
			setPagination(data.pagination);
		} catch (error) {
			console.error('Failed to fetch stores:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		setPage(1);
	};

	return (
		<div className="p-8">
			<Link href="/">
				<Button variant="outline" className="mb-6">
					← Back
				</Button>
			</Link>

			<h2 className="text-3xl font-bold text-gray-800 mb-8">
				Stores Management
			</h2>

			<Card>
				<CardHeader>
					<CardTitle>All Stores</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 mb-6">
						<Input
							placeholder="Search stores..."
							value={searchTerm}
							onChange={(e) => handleSearch(e.target.value)}
							className="flex-1"
						/>
						<Button>Add Store</Button>
						<Button variant="outline">Export</Button>
					</div>

					{loading ? (
						<div className="text-gray-500">Loading stores...</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Business Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Store Type</TableHead>
										<TableHead>Products</TableHead>
										<TableHead>Workers</TableHead>
										<TableHead>Sales</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{stores.length > 0 ? (
										stores.map((store) => (
											<TableRow key={store.id}>
												<TableCell className="font-semibold">
													{store.businessName || 'N/A'}
												</TableCell>
												<TableCell>{store.email}</TableCell>
												<TableCell>{store.storeType || 'N/A'}</TableCell>
												<TableCell>{store._count.products}</TableCell>
												<TableCell>{store._count.workers}</TableCell>
												<TableCell>{store._count.sales}</TableCell>
												<TableCell>
													<span
														className={`px-2 py-1 rounded text-sm ${
															store.setupCompleted
																? 'bg-green-100 text-green-800'
																: 'bg-yellow-100 text-yellow-800'
														}`}
													>
														{store.setupCompleted ? 'Active' : 'Pending'}
													</span>
												</TableCell>
												<TableCell>
													<Link href={`/stores/${store.id}`}>
														<Button variant="ghost" size="sm">
															View
														</Button>
													</Link>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={8}
												className="text-center text-gray-500"
											>
												No stores found
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>

							{/* Pagination */}
							{pagination && pagination.pages > 1 && (
								<div className="flex justify-between items-center mt-6">
									<div className="text-sm text-gray-600">
										Showing {stores.length} of {pagination.total} stores
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											disabled={page === 1}
											onClick={() => setPage(page - 1)}
										>
											Previous
										</Button>
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
