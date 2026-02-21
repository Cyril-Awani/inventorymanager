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

interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	quantity: number;
	costPrice: number;
	sellingPrice: number;
	store: {
		businessName: string;
	};
}

interface PaginatedResponse {
	products: Product[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [pagination, setPagination] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [lowStockOnly, setLowStockOnly] = useState(false);

	useEffect(() => {
		fetchProducts();
	}, [page, searchTerm, lowStockOnly]);

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: '20',
				...(searchTerm && { search: searchTerm }),
				...(lowStockOnly && { lowStockOnly: 'true' }),
			});
			const response = await fetch(`/api/products?${params}`);
			const data: PaginatedResponse = await response.json();
			setProducts(data.products);
			setPagination(data.pagination);
		} catch (error) {
			console.error('Failed to fetch products:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStockColor = (quantity: number) => {
		if (quantity === 0) return 'text-red-600 font-bold';
		if (quantity <= 10) return 'text-orange-600 font-semibold';
		return 'text-green-600';
	};

	return (
		<div className="p-8">
			<Link href="/">
				<Button variant="outline" className="mb-6">
					← Back
				</Button>
			</Link>

			<h2 className="text-3xl font-bold text-gray-800 mb-8">
				Products Inventory
			</h2>

			<Card>
				<CardHeader>
					<CardTitle>All Products</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 mb-6">
						<Input
							placeholder="Search products..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setPage(1);
							}}
							className="flex-1"
						/>
						<Button
							variant={lowStockOnly ? 'default' : 'outline'}
							onClick={() => {
								setLowStockOnly(!lowStockOnly);
								setPage(1);
							}}
						>
							{lowStockOnly ? '✓ Low Stock' : 'Low Stock'}
						</Button>
						<Button>Add Product</Button>
					</div>

					{loading ? (
						<div className="text-gray-500">Loading products...</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Product Name</TableHead>
											<TableHead>Brand</TableHead>
											<TableHead>Category</TableHead>
											<TableHead>Store</TableHead>
											<TableHead>Stock</TableHead>
											<TableHead>Cost Price</TableHead>
											<TableHead>Selling Price</TableHead>
											<TableHead>Margin</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{products.length > 0 ? (
											products.map((product) => {
												const margin = (
													((product.sellingPrice - product.costPrice) /
														product.costPrice) *
													100
												).toFixed(1);
												return (
													<TableRow key={product.id}>
														<TableCell className="font-semibold">
															{product.name}
														</TableCell>
														<TableCell>{product.brand}</TableCell>
														<TableCell>{product.category}</TableCell>
														<TableCell className="text-sm">
															{product.store.businessName}
														</TableCell>
														<TableCell
															className={getStockColor(product.quantity)}
														>
															{product.quantity} units
														</TableCell>
														<TableCell>
															₦{product.costPrice.toLocaleString()}
														</TableCell>
														<TableCell className="font-semibold">
															₦{product.sellingPrice.toLocaleString()}
														</TableCell>
														<TableCell className="text-green-600 font-semibold">
															{margin}%
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
													No products found
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
										Showing {products.length} of {pagination.total} products
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
