'use client';

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import {
	Plus,
	Edit2,
	Trash2,
	AlertTriangle,
	Search,
	Filter,
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ProductForm, ProductFormData } from '@/components/ProductForm';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { KeeperGate } from '@/components/KeeperGate';
import { useStoreAuth } from '@/hooks/use-store-auth';

interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	quantity: number;
	image?: string;
	unitName?: string;
	unitsPerBulk?: number | null;
	bulkSellingPrice?: number | null;
	bulkUnitName?: string | null;
}

type SortOption = 'name' | 'category' | 'quantity' | 'brand' | 'price';
type SortOrder = 'asc' | 'desc';

export default function InventoryPage() {
	const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<Layout headerHeight="11vh">
			<KeeperGate
				title="Inventory"
				description="Enter the store keeper password to manage products and stock."
			>
				<InventoryContent />
			</KeeperGate>
		</Layout>
	);
}

function InventoryContent() {
	const { auth } = useStoreAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [filterLowStock, setFilterLowStock] = useState(false);
	const [sortOption, setSortOption] = useState<SortOption>('name');
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
	const [showSortMenu, setShowSortMenu] = useState(false);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const searchRef = useRef<HTMLDivElement>(null);
	const sortButtonRef = useRef<HTMLDivElement>(null);
	const filterButtonRef = useRef<HTMLDivElement>(null);

	// Handle click outside to collapse search
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchRef.current &&
				!searchRef.current.contains(event.target as Node)
			) {
				setIsSearchFocused(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Fetch products once we have an auth token
	useEffect(() => {
		if (!auth?.token) return;
		fetchProducts();
	}, [auth?.token]);

	const fetchProducts = async () => {
		try {
			const headers: HeadersInit = {};
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const response = await fetch('/api/products?includeZeroStock=true', {
				headers,
			});
			if (response.ok) {
				const data = await response.json();
				setProducts(data);
			}
		} catch (error) {
			console.error('Failed to fetch products:', error);
		}
	};

	const handleAddProduct = async (formData: ProductFormData) => {
		setIsLoading(true);
		try {
			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const response = await fetch('/api/products', {
				method: 'POST',
				headers,
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const result = await response.json();

				// Check if this was a duplicate (merge) or a new product
				if (result.isDuplicate) {
					// Update existing product in the list
					setProducts((prev) =>
						prev.map((product) =>
							product.id === result.id ? result : product,
						),
					);

					let message = `Product inventory merged - Added ${formData.quantity} ${formData.unitName}s to existing stock`;
					if (result.priceChanged && result.priceChangeNote) {
						message += `\n\n${result.priceChangeNote}`;
					}
					alert(message);
				} else {
					// Add new product to list
					setProducts((prev) =>
						[...prev, result].sort((a, b) => a.name.localeCompare(b.name)),
					);
					alert('Product added successfully');
				}

				setShowForm(false);
			} else {
				const error = await response.json();
				alert(`Error: ${error.error}`);
			}
		} catch (error) {
			alert('Failed to add product');
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateProduct = async (formData: ProductFormData) => {
		if (!editingProduct) return;

		setIsLoading(true);
		try {
			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}

			const response = await fetch(`/api/products/${editingProduct.id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const updatedProduct = await response.json();
				// Update product in list without refetching all products
				setProducts((prev) =>
					prev.map((product) =>
						product.id === editingProduct.id ? updatedProduct : product,
					),
				);
				setEditingProduct(null);
				setShowForm(false);
				alert('Product updated successfully');
			} else {
				alert('Error updating product');
			}
		} catch (error) {
			alert('Failed to update product');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteProduct = async (id: string) => {
		if (!confirm('Are you sure you want to delete this product?')) return;

		try {
			const headers: HeadersInit = {};
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			const response = await fetch(`/api/products/${id}`, {
				method: 'DELETE',
				headers,
			});

			if (response.ok) {
				await fetchProducts();
				alert('Product deleted successfully');
			} else {
				alert('Error deleting product');
			}
		} catch (error) {
			alert('Failed to delete product');
		}
	};

	const handleRestockProduct = async (product: Product) => {
		const quantity = prompt(`How many units to restock for "${product.name}"?`);
		if (!quantity) return;

		const qty = parseInt(quantity);
		if (isNaN(qty) || qty <= 0) {
			alert('Invalid quantity');
			return;
		}

		try {
			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			const response = await fetch('/api/restocks', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					productId: product.id,
					quantity: qty,
					costPrice: product.costPrice,
					notes: `Manual restock`,
				}),
			});

			if (response.ok) {
				await fetchProducts();
				alert(`Restocked ${qty} units of ${product.name}`);
			} else {
				alert('Error restocking product');
			}
		} catch (error) {
			alert('Failed to restock product');
		}
	};

	const handleSort = (option: SortOption) => {
		if (sortOption === option) {
			// Toggle order if same option
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
		} else {
			// New option, set to asc by default
			setSortOption(option);
			setSortOrder('asc');
		}
		setShowSortMenu(false);
	};

	const getSortedProducts = () => {
		const filtered = products.filter((product) => {
			const matchesSearch =
				product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				product.brand.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesFilter = !filterLowStock || product.quantity <= 5;

			return matchesSearch && matchesFilter;
		});

		return [...filtered].sort((a, b) => {
			let comparison = 0;

			switch (sortOption) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'brand':
					comparison = a.brand.localeCompare(b.brand);
					break;
				case 'category':
					comparison = a.category.localeCompare(b.category);
					break;
				case 'quantity':
					comparison = a.quantity - b.quantity;
					break;
				case 'price':
					comparison = a.sellingPrice - b.sellingPrice;
					break;
			}

			return sortOrder === 'asc' ? comparison : -comparison;
		});
	};

	const getSortLabel = (option: SortOption): string => {
		switch (option) {
			case 'name':
				return 'Name';
			case 'brand':
				return 'Brand';
			case 'category':
				return 'Category';
			case 'quantity':
				return 'Stock';
			case 'price':
				return 'Price';
		}
	};

	const sortedProducts = getSortedProducts();

	const lowStockCount = products.filter(
		(p) => p.quantity <= 5 && p.quantity > 0,
	).length;
	const outOfStockCount = products.filter((p) => p.quantity === 0).length;

	// Calculate total inventory value
	const totalInventoryValue = products.reduce(
		(sum, p) => sum + p.costPrice * p.quantity,
		0,
	);

	// Calculate low stock value
	const lowStockValue = products
		.filter((p) => p.quantity <= 5 && p.quantity > 0)
		.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);

	// Calculate out of stock value (potential loss)
	const outOfStockValue = products
		.filter((p) => p.quantity === 0)
		.reduce((sum, p) => sum + p.costPrice, 0);
	return (
		<div className="">
			<div className="bg-[#ededed] border-b border-gray-200 shadow-md p-4">
				{/* Header */}
				<header className="mb-8">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-xl md:text-3xl font-bold text-gray-900">
								Inventory Management
							</h1>
							<p className="text-gray-600">
								Manage your products and stock levels
							</p>
						</div>
						<button
							onClick={() => {
								setEditingProduct(null);
								setShowForm(true);
							}}
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

				{/* Search and Filters */}
				<div className="md:flex md:flex-row gap-4 md:mb-4">
					<div className="flex items-center justify-center gap-2">
						{/* Search Input */}
						<div className="relative flex-1">
							<Search
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<input
								type="text"
								placeholder="Search products..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
							/>
						</div>
					</div>

					<div className="flex flex-row items-center justify-end gap-2 mt-2 md:mt-0">
						{/* Sort Button */}
						<div className="relative">
							<Button
								variant="secondary"
								size="md"
								onClick={() => setShowSortMenu(!showSortMenu)}
								className="flex items-center gap-2"
							>
								<span className="inline text-sm md:base">
									{getSortLabel(sortOption)}
								</span>
								<span className="inline text-sm md:base">: Sort</span>
								{sortOrder === 'desc' && (
									<ArrowDown size={18} className="ml-1" />
								)}
								{sortOrder === 'asc' && <ArrowUp size={18} className="ml-1" />}
							</Button>

							{/* Sort Menu Dropdown */}
							{showSortMenu && (
								<>
									<div
										className="fixed inset-0 z-10"
										onClick={() => setShowSortMenu(false)}
									/>
									<div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
										<div className="py-1">
											{[
												{ value: 'name', label: 'Name' },
												{ value: 'brand', label: 'Brand' },
												{ value: 'category', label: 'Category' },
												{ value: 'quantity', label: 'Stock' },
												{ value: 'price', label: 'Price' },
											].map((option) => (
												<button
													key={option.value}
													onClick={() => handleSort(option.value as SortOption)}
													className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
														sortOption === option.value
															? 'bg-blue-50 text-blue-700'
															: 'text-gray-700'
													}`}
												>
													<span>{option.label}</span>
													{sortOption === option.value &&
														(sortOrder === 'asc' ? (
															<ArrowUp size={16} />
														) : (
															<ArrowDown size={16} />
														))}
												</button>
											))}
										</div>
									</div>
								</>
							)}
						</div>
						{/* Low Stock Filter Button */}
						<div>
							<Button
								variant={filterLowStock ? 'primary' : 'secondary'}
								size="md"
								onClick={() => setFilterLowStock(!filterLowStock)}
								className="flex items-center gap-2"
							>
								<Filter size={18} />
								<span className="hidden sm:inline text-sm md:base">
									{filterLowStock ? 'Showing Low Stock' : 'Show Low Stock'}
								</span>
								<span className="sm:hidden text-sm md:base">Low Stock</span>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Products Table - Desktop View */}
			<div className="hidden md:block pt-1">
				<Card>
					<CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h2 className="text-xl font-bold">Products</h2>
							<p className="text-sm text-gray-600">
								Sorted by: {getSortLabel(sortOption)} (
								{sortOrder === 'asc' ? 'Ascending' : 'Descending'})
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-4">
							{/* TOTAL PRODUCTS */}
							<div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
								<p className="text-blue-700 text-sm font-medium">
									Total Products :
								</p>
								<p className="font-bold text-blue-900">{products.length}</p>
								<p className="text-sm text-blue-600">
									( ₦{totalInventoryValue.toLocaleString()} )
								</p>
							</div>

							{/* LOW STOCK */}
							<div
								className={`flex items-center gap-2 px-4 py-2 border rounded-full bg-gradient-to-br ${
									lowStockCount > 0
										? 'from-yellow-50 to-yellow-100 border-yellow-200'
										: 'from-green-50 to-green-100 border-green-200'
								}`}
							>
								<p
									className={`text-sm font-medium flex items-center gap-2 ${
										lowStockCount > 0 ? 'text-yellow-700' : 'text-green-700'
									}`}
								>
									{lowStockCount > 0 && <AlertTriangle size={16} />}
									Low Stock
								</p>

								<p
									className={`font-bold ${
										lowStockCount > 0 ? 'text-yellow-900' : 'text-green-900'
									}`}
								>
									{lowStockCount}
								</p>
							</div>

							{/* OUT OF STOCK */}
							<div
								className={`flex items-center gap-2 px-4 py-2 border rounded-full bg-gradient-to-br ${
									outOfStockCount > 0
										? 'from-red-50 to-red-100 border-red-200'
										: 'from-gray-50 to-gray-100 border-gray-200'
								}`}
							>
								<p
									className={`text-sm font-medium ${
										outOfStockCount > 0 ? 'text-red-700' : 'text-gray-700'
									}`}
								>
									Out of Stock
								</p>

								<p
									className={`font-bold ${
										outOfStockCount > 0 ? 'text-red-900' : 'text-gray-900'
									}`}
								>
									{outOfStockCount}
								</p>
							</div>
						</div>
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
									<th className="text-left py-3 px-4 font-semibold text-gray-700">
										Category
									</th>
									<th className="text-left py-3 px-4 font-semibold text-gray-700">
										Unit
									</th>
									<th className="text-right py-3 px-4 font-semibold text-gray-700">
										Cost
									</th>
									<th className="text-right py-3 px-4 font-semibold text-gray-700">
										Price
									</th>
									<th className="text-right py-3 px-4 font-semibold text-gray-700">
										Profit
									</th>
									<th className="text-center py-3 px-4 font-semibold text-gray-700">
										Stock
									</th>
									<th className="text-right py-3 px-4 font-semibold text-gray-700">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedProducts.map((product) => {
									const unitName = product.unitName ?? 'Piece';
									const hasBulk =
										product.unitsPerBulk != null && product.unitsPerBulk > 0;
									const bulkLabel = product.bulkUnitName ?? 'Bulk';
									const bulkQty = hasBulk
										? Math.floor(product.quantity / product.unitsPerBulk!)
										: null;
									return (
										<tr
											key={product.id}
											className="border-b border-gray-200 hover:bg-gray-50"
										>
											<td className="py-3 px-4">
												<div className="flex items-center gap-3">
													{product.image && (
														<img
															src={product.image}
															alt={product.name}
															className="w-10 h-10 rounded object-cover bg-gray-100"
														/>
													)}
													<span>{product.name}</span>
												</div>
											</td>
											<td className="py-3 px-4 text-sm text-gray-600">
												{product.brand}
											</td>
											<td className="py-3 px-4 text-sm text-gray-600">
												{product.category}
											</td>
											<td className="py-3 px-4 text-sm">
												<span>{unitName}</span>
												{hasBulk && (
													<span className="block text-xs text-gray-500">
														Bulk: {bulkLabel}
													</span>
												)}
											</td>
											<td className="py-3 px-4 text-right">
												₦{product.costPrice.toLocaleString()}/{unitName}
											</td>
											<td className="py-3 px-4 text-right">
												₦{product.sellingPrice.toLocaleString()}/{unitName}
												{hasBulk && product.bulkSellingPrice != null && (
													<span className="block text-xs text-gray-600">
														₦{product.bulkSellingPrice.toLocaleString()}/
														{bulkLabel}
													</span>
												)}
											</td>
											<td className="py-3 px-4 text-right font-semibold text-green-600">
												₦
												{(
													product.sellingPrice - product.costPrice
												).toLocaleString()}
											</td>
											<td className="py-3 px-4 text-center">
												<span
													className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
														product.quantity === 0
															? 'bg-red-100 text-red-800'
															: product.quantity <= 5
																? 'bg-yellow-100 text-yellow-800'
																: 'bg-green-100 text-green-800'
													}`}
												>
													{product.quantity} {unitName}s
													{bulkQty != null && (
														<span className="block text-xs opacity-90">
															({bulkQty} {bulkLabel}s)
														</span>
													)}
												</span>
											</td>
											<td className="py-3 px-4 text-right">
												<div className="flex items-center justify-end gap-2">
													<button
														onClick={() => handleRestockProduct(product)}
														className="text-blue-600 hover:text-blue-700 p-1"
														title="Restock"
													>
														<Plus size={18} />
													</button>
													<button
														onClick={() => {
															setEditingProduct(product);
															setShowForm(true);
														}}
														className="text-blue-600 hover:text-blue-700 p-1"
														title="Edit"
													>
														<Edit2 size={18} />
													</button>
													<button
														onClick={() => handleDeleteProduct(product.id)}
														className="text-red-600 hover:text-red-700 p-1"
														title="Delete"
													>
														<Trash2 size={18} />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>

						{sortedProducts.length === 0 && (
							<div className="text-center py-8">
								<p className="text-gray-600 text-lg">No products found</p>
							</div>
						)}
					</CardBody>
				</Card>
			</div>

			{/* Products Cards - Mobile View */}
			<div className="md:hidden space-y-2 p-2">
				<div className="flex flex-row items-center justify-between">
					<div>
						<h2 className="text-xl font-bold">Products</h2>
						<p className="flex flex-row items-center text-sm text-gray-600 gap-1">
							{getSortLabel(sortOption)}
							{sortOrder === 'asc' ? (
								<ArrowUp size={16} />
							) : (
								<ArrowDown size={16} />
							)}
						</p>
					</div>

					<div className="flex flex-row items-center">
						{/* TOTAL PRODUCTS */}
						<div className="flex flex-col items-center px-2 py-1">
							<p className="font-bold text-blue-900">{products.length}</p>
							<p className="text-blue-700 text-xs md:text-sm font-medium">
								Total Products
							</p>
						</div>

						{/* LOW STOCK */}
						<div className="flex flex-col items-center px-2 py-1">
							<p
								className={`font-bold ${
									lowStockCount > 0 ? 'text-yellow-900' : 'text-green-900'
								}`}
							>
								{lowStockCount}
							</p>
							<p
								className={`text-xs md:text-sm font-medium flex items-center gap-2 ${
									lowStockCount > 0 ? 'text-yellow-700' : 'text-green-700'
								}`}
							>
								{lowStockCount > 0 && <AlertTriangle size={16} />}
								Low Stock
							</p>
						</div>

						{/* OUT OF STOCK */}
						<div className="flex flex-col items-center px-2 py-1">
							<p
								className={`font-bold ${
									outOfStockCount > 0 ? 'text-red-900' : 'text-gray-900'
								}`}
							>
								{outOfStockCount}
							</p>
							<p
								className={`text-xs md:text-sm font-medium ${
									outOfStockCount > 0 ? 'text-red-700' : 'text-gray-700'
								}`}
							>
								Out of Stock
							</p>
						</div>
					</div>
				</div>

				{sortedProducts.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 text-lg">No products found</p>
					</div>
				) : (
					sortedProducts.map((product) => {
						const unitName = product.unitName ?? 'Piece';
						const hasBulk =
							product.unitsPerBulk != null && product.unitsPerBulk > 0;
						const bulkLabel = product.bulkUnitName ?? 'Bulk';
						const bulkQty = hasBulk
							? Math.floor(product.quantity / product.unitsPerBulk!)
							: null;
						return (
							<Card key={product.id} className="overflow-hidden">
								<CardBody className="p-2">
									<div className="flex flex-row gap-4">
										{/* Product Image */}
										<div className="flex-shrink-0">
											{product.image ? (
												<img
													src={product.image}
													alt={product.name}
													className="w-36 h-36 rounded object-cover bg-gray-100"
												/>
											) : (
												<div className="w-36 h-36 rounded bg-gray-200 flex items-center justify-center">
													<span className="text-gray-400 text-xs">
														No image
													</span>
												</div>
											)}
										</div>

										{/* Product Details */}
										<div className="flex flex-col justify-between w-full">
											{/* Top content */}
											<div className="flex-1">
												{/* Product Name */}
												<div className="mb-2">
													<p className="font-bold text-lg text-gray-900">
														{product.name}
													</p>
												</div>

												{/* Brand & Stock */}
												<div className="flex flex-col mb-2">
													<p className="text-sm text-gray-600">
														<span className="font-medium">From: </span>
														<span className="font-semibold text-gray-900">
															{product.brand}
														</span>
													</p>

													{/* Stock */}
													<div className="mt-2">
														<p className="text-sm text-gray-600">
															<span className="font-medium">Stock left:</span>{' '}
															<span
																className={`font-semibold ${
																	product.quantity === 0
																		? 'text-red-600'
																		: product.quantity <= 5
																			? 'text-yellow-600'
																			: 'text-green-600'
																}`}
															>
																{product.quantity} {unitName}s
																{bulkQty != null && (
																	<span className="block text-xs opacity-90">
																		({bulkQty} {bulkLabel}s)
																	</span>
																)}
															</span>
														</p>
													</div>
												</div>
											</div>

											{/* Action Buttons at bottom-right */}
											<div className="flex justify-end gap-2 ml-10 mt-2">
												<button
													onClick={() => {
														setEditingProduct(product);
														setShowForm(true);
													}}
													className="px-4 py-2 rounded-full font-semibold text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
												>
													Edit
												</button>

												<button
													onClick={() => handleRestockProduct(product)}
													className="px-4 py-2 rounded-full font-semibold text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
												>
													Add
												</button>
											</div>
										</div>
									</div>
								</CardBody>
							</Card>
						);
					})
				)}
			</div>

			{/* Product Form Modal */}
			<ProductForm
				isOpen={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingProduct(null);
				}}
				onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
				initialData={
					editingProduct
						? {
								name: editingProduct.name,
								brand: editingProduct.brand,
								category: editingProduct.category,
								costPrice: editingProduct.costPrice,
								sellingPrice: editingProduct.sellingPrice,
								quantity: editingProduct.quantity,
								unitName: editingProduct.unitName || 'Piece',
								unitsPerBulk: editingProduct.unitsPerBulk,
								bulkSellingPrice: editingProduct.bulkSellingPrice,
								bulkUnitName: editingProduct.bulkUnitName,
								id: editingProduct.id,
							}
						: undefined
				}
				isLoading={isLoading}
			/>
		</div>
	);
}
