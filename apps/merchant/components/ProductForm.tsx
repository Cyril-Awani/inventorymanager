'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export interface ProductFormData {
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	quantity: number;
	image?: string;
	unitName: string;
	unitsPerBulk?: number | null;
	bulkSellingPrice?: number | null;
	bulkUnitName?: string | null;
}

interface ProductFormProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: ProductFormData) => void;
	initialData?: ProductFormData & { id?: string };
	isLoading?: boolean;
}

const COMMON_UNITS = [
	'Piece',
	'Pack',
	'Box',
	'Carton',
	'Bottle',
	'Can',
	'Sachet',
	'Kg',
	'Liter',
	'Bag',
	'Tin',
	'Jar',
	'Tub',
	'Bar',
	'Tube',
	'Set',
	'Paint',
	'Crate',
	'Gallon',
];

export function ProductForm({
	isOpen,
	onClose,
	onSubmit,
	initialData,
	isLoading = false,
}: ProductFormProps) {
	const [formData, setFormData] = useState<ProductFormData>({
		name: '',
		brand: '',
		category: '',
		costPrice: 0,
		sellingPrice: 0,
		quantity: 0,
		unitName: 'Piece',
		unitsPerBulk: null,
		bulkSellingPrice: null,
		bulkUnitName: null,
	});

	const [customCategory, setCustomCategory] = useState('');
	const [useCustomCategory, setUseCustomCategory] = useState(false);
	const [customUnit, setCustomUnit] = useState('');
	const [useCustomUnit, setUseCustomUnit] = useState(false);
	const [useBulkPricing, setUseBulkPricing] = useState(false);
	const [imagePreview, setImagePreview] = useState<string>('');

	// State for suggestions
	const [categories, setCategories] = useState<string[]>([]);
	const [brands, setBrands] = useState<string[]>([]);
	const [productNames, setProductNames] = useState<string[]>([]);
	const [existingProducts, setExistingProducts] = useState<any[]>([]);

	// State for custom dropdowns
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const [productNameInput, setProductNameInput] = useState('');
	const [brandInput, setBrandInput] = useState('');
	const [categoryInput, setCategoryInput] = useState('');
	const [filteredProductNames, setFilteredProductNames] = useState<any[]>([]);
	const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
	const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
	const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
	const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

	// Duplicate detection
	const [duplicateWarning, setDuplicateWarning] = useState<{
		exists: boolean;
		product?: any;
		priceChanged?: boolean;
	}>({ exists: false });

	// Catalog search for recommendations
	const [catalogMatches, setCatalogMatches] = useState<any[]>([]);

	// Fetch existing data for suggestions - optimized to only fetch once per session
	useEffect(() => {
		const fetchExistingData = async () => {
			try {
				// Only fetch categories and brands, not all products to reduce payload
				const response = await fetch(
					'/api/products?includeZeroStock=true&limit=1000',
				);
				if (response.ok) {
					const data = await response.json();
					setExistingProducts(data);

					// Use Map for O(1) lookups instead of Set/Array operations
					const categorySet = new Map<string, boolean>();
					const brandSet = new Map<string, boolean>();
					const nameSet = new Map<string, boolean>();

					data.forEach((p: any) => {
						if (p.category) categorySet.set(p.category, true);
						if (p.brand) brandSet.set(p.brand, true);
						if (p.name) nameSet.set(p.name, true);
					});

					setCategories(Array.from(categorySet.keys()).sort());
					setBrands(Array.from(brandSet.keys()).sort());
					setProductNames(Array.from(nameSet.keys()).sort());
				}
			} catch (error) {
				console.error('Failed to fetch existing products:', error);
			}
		};

		// Only fetch when form first opens, not repeatedly
		if (isOpen && existingProducts.length === 0) {
			fetchExistingData();
		}
	}, [isOpen, existingProducts.length]);

	// Initialize form with initial data
	useEffect(() => {
		if (initialData) {
			setFormData({
				name: initialData.name || '',
				brand: initialData.brand || '',
				category: initialData.category || '',
				costPrice: initialData.costPrice || 0,
				sellingPrice: initialData.sellingPrice || 0,
				quantity: initialData.quantity || 0,
				unitName: initialData.unitName || 'Piece',
				unitsPerBulk: initialData.unitsPerBulk || null,
				bulkSellingPrice: initialData.bulkSellingPrice || null,
				bulkUnitName: initialData.bulkUnitName || null,
				image: initialData.image || undefined,
			});
			setImagePreview(initialData.image || '');
			setProductNameInput(initialData.name || '');
			setBrandInput(initialData.brand || '');
			setCategoryInput(initialData.category || '');
			setUseCustomUnit(!COMMON_UNITS.includes(initialData.unitName || 'Piece'));
			setCustomUnit(initialData.unitName || '');
			setUseBulkPricing(
				initialData.unitsPerBulk != null &&
					initialData.unitsPerBulk > 0 &&
					initialData.bulkSellingPrice != null,
			);
		} else {
			resetForm();
		}
	}, [initialData, isOpen]);

	// Check for duplicate product and auto-fill - memoized
	useEffect(() => {
		if (
			!formData.name ||
			!formData.brand ||
			!formData.category ||
			initialData?.id
		) {
			setDuplicateWarning({ exists: false });
			return;
		}

		// Use a debounce to avoid checking on every keystroke
		const debounceTimer = setTimeout(() => {
			const nameLower = formData.name.toLowerCase();
			const brandLower = formData.brand.toLowerCase();
			const categoryLower = formData.category.toLowerCase();
			const unitNameLower = (formData.unitName || 'Piece').toLowerCase();

			// Check for exact match: name, brand, category, AND unitName
			const existingProduct = existingProducts.find(
				(p) =>
					p.name.toLowerCase() === nameLower &&
					p.brand.toLowerCase() === brandLower &&
					p.category.toLowerCase() === categoryLower &&
					(p.unitName || 'Piece').toLowerCase() === unitNameLower,
			);

			if (existingProduct) {
				const costPriceChanged =
					existingProduct.costPrice !== formData.costPrice;
				const sellingPriceChanged =
					existingProduct.sellingPrice !== formData.sellingPrice;
				const priceChanged = costPriceChanged || sellingPriceChanged;

				setDuplicateWarning({
					exists: true,
					product: existingProduct,
					priceChanged,
				});
			} else {
				setDuplicateWarning({ exists: false });
			}
		}, 500); // Debounce by 500ms

		return () => clearTimeout(debounceTimer);
	}, [
		formData.name,
		formData.brand,
		formData.category,
		formData.unitName,
		formData.costPrice,
		formData.sellingPrice,
		existingProducts,
		initialData,
	]);

	// Search catalog for recommendations - with better caching
	const [searchCache, setSearchCache] = useState<Record<string, any[]>>({});

	useEffect(() => {
		const searchProducts = async () => {
			if (!productNameInput) {
				setFilteredProductNames(productNames);
				return;
			}

			// Check cache first
			if (searchCache[productNameInput]) {
				setFilteredProductNames(searchCache[productNameInput]);
				return;
			}

			setIsSearchingCatalog(true);

			// Search local products
			const inputLower = productNameInput.toLowerCase();
			const localMatches = existingProducts
				.filter((p) => p.name.toLowerCase().includes(inputLower))
				.map((p) => ({
					...p,
					source: 'local' as const,
				}));

			// Search database catalog
			try {
				const params = new URLSearchParams();
				params.append('name', productNameInput);

				const response = await fetch(
					`/api/catalog/search?${params.toString()}`,
				);
				if (response.ok) {
					const data = await response.json();
					const catalogMatches = (data.matches || []).map((m: any) => ({
						...m,
						source: 'catalog' as const,
					}));

					// Combine and deduplicate by name + brand
					const combined = [...localMatches, ...catalogMatches];
					const seen = new Set<string>();
					const deduped = combined.filter((item) => {
						const key = `${item.name}||${item.brand}`;
						if (seen.has(key)) return false;
						seen.add(key);
						return true;
					});

					setFilteredProductNames(deduped);
					setSearchCache((prev) => ({ ...prev, [productNameInput]: deduped }));
				} else {
					setFilteredProductNames(localMatches);
					setSearchCache((prev) => ({
						...prev,
						[productNameInput]: localMatches,
					}));
				}
			} catch (error) {
				setFilteredProductNames(localMatches);
				setSearchCache((prev) => ({
					...prev,
					[productNameInput]: localMatches,
				}));
			} finally {
				setIsSearchingCatalog(false);
			}
		};

		const debounce = setTimeout(() => {
			searchProducts();
		}, 300);

		return () => clearTimeout(debounce);
	}, [productNameInput, existingProducts, productNames, searchCache]);

	// Search brands filtered
	useEffect(() => {
		if (!brandInput) {
			setFilteredBrands(brands);
			return;
		}

		const filtered = brands.filter((b) =>
			b.toLowerCase().includes(brandInput.toLowerCase()),
		);
		setFilteredBrands(filtered);
	}, [brandInput, brands]);

	// Search categories filtered
	useEffect(() => {
		if (!categoryInput) {
			setFilteredCategories(categories);
			return;
		}

		const filtered = categories.filter((c) =>
			c.toLowerCase().includes(categoryInput.toLowerCase()),
		);
		setFilteredCategories(filtered);
	}, [categoryInput, categories]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (
				dropdownRefs.current &&
				!Object.values(dropdownRefs.current).some((ref) =>
					ref?.contains(target),
				)
			) {
				setOpenDropdown(null);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const resetForm = () => {
		setFormData({
			name: '',
			brand: '',
			category: '',
			costPrice: 0,
			sellingPrice: 0,
			quantity: 0,
			unitName: 'Piece',
			unitsPerBulk: null,
			bulkSellingPrice: null,
			bulkUnitName: null,
		});
		setImagePreview('');
		setProductNameInput('');
		setBrandInput('');
		setCategoryInput('');
		setUseCustomUnit(false);
		setCustomUnit('');
		setUseBulkPricing(false);
		setDuplicateWarning({ exists: false });
	};

	const handleSelectProductName = (product: any) => {
		setFormData({
			...formData,
			name: product.name,
			brand: product.brand,
			category: product.category || formData.category,
			unitName: product.unitName || formData.unitName,
			unitsPerBulk: product.unitsPerBulk || formData.unitsPerBulk,
			bulkSellingPrice: product.bulkSellingPrice || formData.bulkSellingPrice,
			bulkUnitName: product.bulkUnitName || formData.bulkUnitName,
		});
		setProductNameInput(product.name);
		setBrandInput(product.brand);
		setCategoryInput(product.category || '');
		setOpenDropdown(null);
	};

	const handleImageFile = (file: File) => {
		if (file && file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setFormData({ ...formData, image: result });
				setImagePreview(result);
			};
			reader.readAsDataURL(file);
		} else {
			alert('Please select a valid image file');
		}
	};

	const handleImageUrl = (url: string) => {
		if (url) {
			setFormData({ ...formData, image: url });
			setImagePreview(url);
		}
	};

	const removeImage = () => {
		setFormData({ ...formData, image: undefined });
		setImagePreview('');
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Prepare final form data with custom values
		const finalFormData = { ...formData };

		// Handle custom unit
		if (useCustomUnit && customUnit) {
			finalFormData.unitName = customUnit;
		}

		// Handle bulk pricing
		if (!useBulkPricing) {
			finalFormData.unitsPerBulk = null;
			finalFormData.bulkSellingPrice = null;
			finalFormData.bulkUnitName = null;
		}

		// Validate required fields (check for empty string, null, undefined - 0 is valid for prices)
		if (
			!finalFormData.name?.trim() ||
			!finalFormData.brand?.trim() ||
			!finalFormData.category?.trim() ||
			finalFormData.costPrice === null ||
			finalFormData.costPrice === undefined ||
			finalFormData.sellingPrice === null ||
			finalFormData.sellingPrice === undefined
		) {
			alert(
				'Please fill in all required fields (Name, Brand, Category, Cost Price, Selling Price)',
			);
			return;
		}

		// Use the prepared final form data for submission
		onSubmit(finalFormData);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
					<div>
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
							{initialData ? 'Edit Product' : 'Add New Product'}
						</h2>
						<p className="text-xs sm:text-sm text-gray-500 mt-0.5">
							{initialData
								? 'Update product information'
								: 'Create a new product entry'}
						</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
						aria-label="Close form"
					>
						<X size={20} className="sm:w-6 sm:h-6" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
					<div className="p-4 sm:p-6 space-y-6">
						{duplicateWarning.exists && !initialData && (
							<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 animate-in fade-in slide-in-from-top-2">
								<div className="flex gap-3">
									<div className="flex-shrink-0 text-blue-600 mt-0.5">
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fillRule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="flex-1">
										<p className="text-sm font-semibold text-blue-900">
											Identical product found - Inventory will be merged
										</p>
										<p className="text-xs sm:text-sm text-blue-800 mt-1 leading-relaxed">
											<span className="font-medium">
												"{formData.name}" ({formData.brand})
											</span>{' '}
											already exists in {formData.category} category in{' '}
											{formData.unitName} units.
										</p>
										<p className="text-xs sm:text-sm text-blue-800 mt-1 leading-relaxed">
											Adding {formData.quantity} {formData.unitName}
											{formData.quantity > 1 ? 's' : ''} to the current stock of{' '}
											{duplicateWarning.product?.quantity}{' '}
											{duplicateWarning.product?.unitName || 'Piece'}s.
										</p>
										{duplicateWarning.priceChanged && (
											<div className="mt-2 bg-white rounded p-2 border border-blue-100">
												<p className="text-xs font-medium text-blue-900 mb-1">
													Price changes:
												</p>
												{duplicateWarning.product?.costPrice !==
													formData.costPrice && (
													<p className="text-xs text-blue-800">
														💰 Cost: ₦
														{duplicateWarning.product?.costPrice?.toLocaleString()}{' '}
														→ ₦{formData.costPrice?.toLocaleString()}
													</p>
												)}
												{duplicateWarning.product?.sellingPrice !==
													formData.sellingPrice && (
													<p className="text-xs text-blue-800">
														💵 Selling: ₦
														{duplicateWarning.product?.sellingPrice?.toLocaleString()}{' '}
														→ ₦{formData.sellingPrice?.toLocaleString()}
													</p>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Basic Information Section */}
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-gray-900 px-1">
								Basic Information
							</h3>

							{/* Product Name */}
							<div className="space-y-2 relative">
								<label
									htmlFor="product-name"
									className="block text-sm font-medium text-gray-700"
								>
									Product Name <span className="text-red-500">*</span>
								</label>
								<div
									ref={(el) => {
										if (el) dropdownRefs.current['product-name'] = el;
									}}
									className="relative"
								>
									<button
										type="button"
										onClick={() =>
											setOpenDropdown(
												openDropdown === 'product-name' ? null : 'product-name',
											)
										}
										className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base text-left flex items-center justify-between bg-white hover:bg-gray-50"
									>
										<input
											id="product-name"
											type="text"
											value={productNameInput || formData.name}
											onChange={(e) => {
												setProductNameInput(e.target.value);
												setFormData({ ...formData, name: e.target.value });
												setOpenDropdown('product-name');
											}}
											onFocus={() => setOpenDropdown('product-name')}
											className="w-full bg-transparent outline-none text-sm sm:text-base"
											placeholder="e.g., Indomie Noodles"
											required
										/>
										<ChevronDown
											size={18}
											className={`flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'product-name' ? 'rotate-180' : ''}`}
										/>
									</button>

									{openDropdown === 'product-name' && (
										<div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
											{filteredProductNames.map((product, idx) => (
												<button
													key={`${product.source}-${product.name}-${idx}`}
													type="button"
													onClick={() => handleSelectProductName(product)}
													className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-blue-50 text-gray-900 text-sm sm:text-base transition-colors border-b border-gray-100 last:border-b-0"
												>
													<div className="flex items-center justify-between">
														<span>{product.name}</span>
														<span
															className={`text-xs px-2 py-1 rounded font-medium ${
																product.source === 'catalog'
																	? 'bg-green-100 text-green-700'
																	: 'bg-blue-100 text-blue-700'
															}`}
														>
															{product.source === 'catalog'
																? '📦 Catalog'
																: '📋 Local'}
														</span>
													</div>
												</button>
											))}
											{filteredProductNames.length === 0 && (
												<div className="px-3 sm:px-4 py-2.5 text-gray-500 text-sm">
													{isSearchingCatalog
														? 'Searching...'
														: 'No products found'}
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Brand */}
							<div className="space-y-2 relative">
								<label
									htmlFor="brand-input"
									className="block text-sm font-medium text-gray-700"
								>
									Brand <span className="text-red-500">*</span>
								</label>
								<div
									ref={(el) => {
										if (el) dropdownRefs.current['brand'] = el;
									}}
									className="relative"
								>
									<button
										type="button"
										onClick={() =>
											setOpenDropdown(openDropdown === 'brand' ? null : 'brand')
										}
										className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base text-left flex items-center justify-between bg-white hover:bg-gray-50"
									>
										<input
											id="brand-input"
											type="text"
											value={brandInput || formData.brand}
											onChange={(e) => {
												setBrandInput(e.target.value);
												setFormData({ ...formData, brand: e.target.value });
												setOpenDropdown('brand');
											}}
											onFocus={() => setOpenDropdown('brand')}
											className="w-full bg-transparent outline-none text-sm sm:text-base"
											placeholder="e.g., Indomie"
											required
										/>
										<ChevronDown
											size={18}
											className={`flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'brand' ? 'rotate-180' : ''}`}
										/>
									</button>

									{openDropdown === 'brand' && (
										<div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
											{filteredBrands.map((brand, idx) => (
												<button
													key={`${brand.source}-${brand.name}-${idx}`}
													type="button"
													onClick={() => {
														setFormData({ ...formData, brand: brand.name });
														setBrandInput(brand.name);
														setOpenDropdown(null);
													}}
													className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-blue-50 text-gray-900 text-sm sm:text-base transition-colors border-b border-gray-100 last:border-b-0"
												>
													<div className="flex items-center justify-between">
														<span>{brand.name}</span>
														<span
															className={`text-xs px-2 py-1 rounded font-medium ${
																brand.source === 'catalog'
																	? 'bg-green-100 text-green-700'
																	: 'bg-blue-100 text-blue-700'
															}`}
														>
															{brand.source === 'catalog'
																? '📦 Catalog'
																: '📋 Local'}
														</span>
													</div>
												</button>
											))}
											{filteredBrands.length === 0 && (
												<div className="px-3 sm:px-4 py-2.5 text-gray-500 text-sm">
													No brands found
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Category & Unit - Two Column */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{/* Category */}
								<div className="space-y-2 relative">
									<label
										htmlFor="category-input"
										className="block text-sm font-medium text-gray-700"
									>
										Category <span className="text-red-500">*</span>
									</label>
									<div
										ref={(el) => {
											if (el) dropdownRefs.current['category'] = el;
										}}
										className="relative"
									>
										<button
											type="button"
											onClick={() =>
												setOpenDropdown(
													openDropdown === 'category' ? null : 'category',
												)
											}
											className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base text-left flex items-center justify-between bg-white hover:bg-gray-50"
										>
											<input
												id="category-input"
												type="text"
												value={categoryInput || formData.category}
												onChange={(e) => {
													setCategoryInput(e.target.value);
													setFormData({
														...formData,
														category: e.target.value,
													});
													setOpenDropdown('category');
												}}
												onFocus={() => setOpenDropdown('category')}
												className="w-full bg-transparent outline-none text-sm sm:text-base"
												placeholder="e.g., Groceries"
												required
											/>
											<ChevronDown
												size={18}
												className={`flex-shrink-0 text-gray-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`}
											/>
										</button>

										{openDropdown === 'category' && (
											<div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
												{filteredCategories.map((cat, idx) => (
													<button
														key={`${cat}-${idx}`}
														type="button"
														onClick={() => {
															setFormData({ ...formData, category: cat });
															setCategoryInput(cat);
															setOpenDropdown(null);
														}}
														className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-blue-50 text-gray-900 text-sm sm:text-base transition-colors border-b border-gray-100 last:border-b-0"
													>
														{cat}
													</button>
												))}
												{filteredCategories.length === 0 && (
													<div className="px-3 sm:px-4 py-2.5 text-gray-500 text-sm">
														Type a custom category or select from suggestions
													</div>
												)}
											</div>
										)}
									</div>
								</div>

								{/* Unit Name */}
								<div className="space-y-2">
									<label
										htmlFor="unit-name"
										className="block text-sm font-medium text-gray-700"
									>
										Unit Name <span className="text-red-500">*</span>
									</label>
									<select
										id="unit-name"
										value={formData.unitName || 'Piece'}
										onChange={(e) =>
											setFormData({ ...formData, unitName: e.target.value })
										}
										className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base bg-white hover:bg-gray-50"
										required
									>
										<option value="Piece">Piece</option>
										<option value="Box">Box</option>
										<option value="Carton">Carton</option>
										<option value="Pack">Pack</option>
										<option value="Gram">Gram</option>
										<option value="Kg">Kg</option>
										<option value="Liter">Liter</option>
										<option value="Bottle">Bottle</option>
										<option value="Can">Can</option>
										<option value="Dozen">Dozen</option>
									</select>
								</div>
							</div>

							{/* Image Section */}
							<div className="space-y-4 pt-2 border-t border-gray-100">
								<h3 className="text-sm font-semibold text-gray-900 px-1">
									Product Image
								</h3>

								<div className="space-y-3">
									{/* Image Preview */}
									{imagePreview && (
										<div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
											<img
												src={imagePreview}
												alt="Preview"
												className="w-full h-full object-cover"
											/>
											<button
												type="button"
												onClick={removeImage}
												className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
												title="Remove image"
											>
												<X size={16} />
											</button>
										</div>
									)}

									{/* Upload Options */}
									<div className="space-y-2">
										{/* File Upload */}
										<label className="block">
											<div className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
												<svg
													className="w-5 h-5 text-gray-500"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 4v16m8-8H4"
													/>
												</svg>
												<span className="text-sm font-medium text-gray-700">
													Upload Image
												</span>
											</div>
											<input
												type="file"
												accept="image/*"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) handleImageFile(file);
												}}
												className="hidden"
											/>
										</label>

										{/* URL Input */}
										<div className="flex gap-2">
											<input
												type="url"
												placeholder="Or paste image URL..."
												onBlur={(e) => {
													if (e.target.value) handleImageUrl(e.target.value);
												}}
												className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Pricing Section */}
							<div className="space-y-4 pt-2">
								<h3 className="text-sm font-semibold text-gray-900 px-1">
									Pricing & Stock
								</h3>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
									<Input
										label="Cost Price (₦)"
										type="number"
										min="0"
										step="0.01"
										value={formData.costPrice || ''}
										onChange={(e) =>
											setFormData({
												...formData,
												costPrice: parseFloat(e.target.value) || 0,
											})
										}
										placeholder="Enter cost price"
										required
									/>
									<Input
										label="Selling Price (₦)"
										type="number"
										min="0"
										step="0.01"
										value={formData.sellingPrice || ''}
										onChange={(e) =>
											setFormData({
												...formData,
												sellingPrice: parseFloat(e.target.value) || 0,
											})
										}
										placeholder="Enter selling price"
										required
									/>
									<Input
										label="Initial Stock"
										type="number"
										min="0"
										step="1"
										value={formData.quantity || ''}
										onChange={(e) =>
											setFormData({
												...formData,
												quantity: parseInt(e.target.value) || 0,
											})
										}
										placeholder="0"
									/>
								</div>

								{/* Profit Indicator */}
								{formData.costPrice && formData.sellingPrice && (
									<div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
										<p className="text-xs sm:text-sm text-gray-600">
											<span className="font-medium">Profit Margin:</span>
											<span
												className={`ml-2 font-semibold ${((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100 > 0 ? 'text-green-600' : 'text-red-600'}`}
											>
												{(
													((formData.sellingPrice - formData.costPrice) /
														formData.costPrice) *
													100
												).toFixed(1)}
												%
											</span>
										</p>
									</div>
								)}
							</div>

							{/* Bulk Pricing Section */}
							<div className="space-y-4 pt-2 border-t border-gray-100">
								<div className="flex items-center gap-3">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											checked={useBulkPricing}
											onChange={(e) => setUseBulkPricing(e.target.checked)}
											className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-colors"
										/>
										<span className="text-sm font-medium text-gray-700">
											Bulk/Wholesale Pricing
										</span>
									</label>
									<span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
										Optional
									</span>
								</div>

								{useBulkPricing && (
									<div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
										<p className="text-xs text-gray-600">
											Configure wholesale pricing for bulk orders
										</p>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
											<Input
												label="Units per Bulk"
												type="number"
												min="2"
												step="1"
												value={formData.unitsPerBulk || ''}
												onChange={(e) =>
													setFormData({
														...formData,
														unitsPerBulk: parseInt(e.target.value) || null,
													})
												}
												placeholder="e.g., 12"
											/>
											<Input
												label="Bulk Unit Name"
												type="text"
												value={formData.bulkUnitName || ''}
												onChange={(e) =>
													setFormData({
														...formData,
														bulkUnitName: e.target.value,
													})
												}
												placeholder="e.g., Crate"
											/>
											<Input
												label="Bulk Price (₦)"
												type="number"
												min="0"
												step="0.01"
												value={formData.bulkSellingPrice || ''}
												onChange={(e) =>
													setFormData({
														...formData,
														bulkSellingPrice:
															parseFloat(e.target.value) || null,
													})
												}
												placeholder="e.g., 4000"
											/>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</form>

				{/* Footer - Actions */}
				<div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 justify-end">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={onClose}
						className="text-sm"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="sm"
						isLoading={isLoading}
						onClick={handleSubmit}
						className="text-sm"
					>
						{initialData
							? 'Update Product'
							: duplicateWarning.exists
								? 'Merge to Inventory'
								: 'Add Product'}
					</Button>
				</div>
			</div>
		</div>
	);
}
