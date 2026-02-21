'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface StoreType {
	id: string;
	label: string;
	key: string;
}

interface CatalogItem {
	id: string;
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	unitName: string;
	unitsPerBulk?: number;
	bulkSellingPrice?: number;
	bulkUnitName?: string;
	image?: string;
	description?: string;
	storeType: StoreType;
}

interface GroupedCatalogItems {
	[storeTypeId: string]: {
		storeType: StoreType;
		items: CatalogItem[];
	};
}

export default function RecommendationsPage() {
	const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
	const [groupedItems, setGroupedItems] = useState<GroupedCatalogItems>({});
	const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);
	const [editData, setEditData] = useState<Partial<CatalogItem> | null>(null);
	const [showNewStoreTypeInput, setShowNewStoreTypeInput] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		storeTypeId: '',
		newStoreType: '',
		category: '',
		name: '',
		brand: '',
		unitName: '',
		bulkUnitName: '',
		image: '',
		description: '',
		keywords: '',
	});

	const [formError, setFormError] = useState('');
	const [formSuccess, setFormSuccess] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [filterByStoreType, setFilterByStoreType] = useState<string>('all');
	const editCardRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		fetchCatalogItems();
		fetchStoreTypes();
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				editCardRef.current &&
				!editCardRef.current.contains(event.target as Node)
			) {
				if (editingItemId) {
					cancelEditingItem();
				}
			}
		};

		if (editingItemId) {
			document.addEventListener('mousedown', handleClickOutside);
			return () =>
				document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [editingItemId]);

	const handleImageUpload = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					resolve(reader.result);
				} else {
					reject(new Error('Failed to read file'));
				}
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	};

	const capitalizeWords = (value: string) => {
		return value
			.trim()
			.replace(/\s+/g, ' ')
			.toLowerCase()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const handleFormImageDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			try {
				const base64 = await handleImageUpload(file);
				setFormData((prev) => ({ ...prev, image: base64 }));
			} catch (error) {
				console.error('Failed to upload image:', error);
			}
		} else {
			alert('Please drop an image file');
		}
	};

	const handleFormImageInput = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			try {
				const base64 = await handleImageUpload(file);
				setFormData((prev) => ({ ...prev, image: base64 }));
			} catch (error) {
				console.error('Failed to upload image:', error);
			}
		} else {
			alert('Please select an image file');
		}
	};

	const handleEditImageDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			try {
				const base64 = await handleImageUpload(file);
				handleEditChange('image', base64);
			} catch (error) {
				console.error('Failed to upload image:', error);
			}
		} else {
			alert('Please drop an image file');
		}
	};

	const handleEditImageInput = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith('image/')) {
			try {
				const base64 = await handleImageUpload(file);
				handleEditChange('image', base64);
			} catch (error) {
				console.error('Failed to upload image:', error);
			}
		} else {
			alert('Please select an image file');
		}
	};

	const fetchCatalogItems = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/catalog');
			const data = await response.json();
			setCatalogItems(data.catalogItems);
			groupCatalogItems(data.catalogItems);
		} catch (error) {
			console.error('Failed to fetch catalog items:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchStoreTypes = async () => {
		try {
			const response = await fetch('/api/store-types');
			const data = await response.json();
			setStoreTypes(data.storeTypes || []);
		} catch (error) {
			console.error('Failed to fetch store types:', error);
		}
	};

	const groupCatalogItems = (items: CatalogItem[]) => {
		const filtered = items.filter((item) => {
			const matchesSearch = !searchQuery
				? true
				: item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.brand.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesFilter =
				filterByStoreType === 'all'
					? true
					: item.storeType.id === filterByStoreType;

			return matchesSearch && matchesFilter;
		});

		const grouped: GroupedCatalogItems = {};
		filtered.forEach((item) => {
			if (!grouped[item.storeType.id]) {
				grouped[item.storeType.id] = {
					storeType: item.storeType,
					items: [],
				};
			}
			grouped[item.storeType.id].items.push(item);
		});
		setGroupedItems(grouped);
	};

	useEffect(() => {
		groupCatalogItems(catalogItems);
	}, [searchQuery, filterByStoreType, catalogItems]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSelectChange = (value: string) => {
		if (value === 'create-new') {
			setShowNewStoreTypeInput(true);
			setFormData((prev) => ({
				...prev,
				storeTypeId: '',
				newStoreType: '',
			}));
		} else {
			setShowNewStoreTypeInput(false);
			setFormData((prev) => ({
				...prev,
				storeTypeId: value,
				newStoreType: '',
			}));
		}
	};

	const startEditingItem = (item: CatalogItem) => {
		setEditingItemId(item.id);
		setEditData({ ...item });
	};

	const cancelEditingItem = () => {
		setEditingItemId(null);
		setEditData(null);
	};

	const deleteItem = async (itemId: string) => {
		if (!confirm('Are you sure you want to delete this item?')) return;

		try {
			const response = await fetch('/api/catalog', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: itemId }),
			});

			if (!response.ok) {
				throw new Error('Failed to delete item');
			}

			fetchCatalogItems();
		} catch (error) {
			console.error('Failed to delete item:', error);
			alert('Failed to delete item');
		}
	};

	const getUniqueSuggestions = (
		field: 'category' | 'unitName' | 'bulkUnitName',
	) => {
		const values = catalogItems
			.map((item) => item[field])
			.filter(Boolean) as string[];
		return Array.from(new Set(values)).sort();
	};

	const handleEditChange = (field: keyof CatalogItem, value: any) => {
		if (editData) {
			setEditData((prev) => ({
				...prev,
				[field]: value,
			}));
		}
	};

	const saveEditedItem = async () => {
		if (!editData || !editingItemId) return;

		try {
			const response = await fetch('/api/catalog', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: editingItemId,
					name: editData.name,
					brand: editData.brand,
					category: editData.category,
					costPrice: editData.costPrice,
					sellingPrice: editData.sellingPrice,
					unitName: editData.unitName,
					unitsPerBulk: editData.unitsPerBulk || null,
					bulkSellingPrice: editData.bulkSellingPrice || null,
					bulkUnitName: editData.bulkUnitName || null,
					description: editData.description || null,
					image: editData.image || null,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to update item');
			}

			setEditingItemId(null);
			setEditData(null);
			fetchCatalogItems();
		} catch (error) {
			console.error('Failed to save item:', error);
			alert('Failed to save changes');
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError('');
		setFormSuccess('');
		setSubmitting(true);

		const formattedData = {
			...formData,
			category: capitalizeWords(formData.category),
			name: capitalizeWords(formData.name),
			brand: capitalizeWords(formData.brand),
			unitName: capitalizeWords(formData.unitName),
			bulkUnitName: capitalizeWords(formData.bulkUnitName),
			description: capitalizeWords(formData.description),
			keywords: capitalizeWords(formData.keywords),
			newStoreType: capitalizeWords(formData.newStoreType),
		};

		let storeTypeId = formattedData.storeTypeId;

		// If custom store type is provided, create it first
		if (formattedData.newStoreType && !storeTypeId) {
			try {
				const response = await fetch('/api/store-types', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						label: formattedData.newStoreType,
						key: formattedData.newStoreType.toLowerCase().replace(/\s+/g, '-'),
					}),
				});

				if (!response.ok) {
					throw new Error('Failed to create store type');
				}

				const data = await response.json();
				storeTypeId = data.id;
			} catch (error) {
				console.error('Failed to create store type:', error);
				setFormError('Failed to create store type');
				setSubmitting(false);
				return;
			}
		}

		// Validate required fields
		if (
			!storeTypeId ||
			!formattedData.category ||
			!formattedData.name ||
			!formattedData.brand ||
			!formattedData.unitName
		) {
			setFormError('Please fill in all required fields');
			setSubmitting(false);
			return;
		}

		try {
			const response = await fetch('/api/catalog', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					storeTypeId,
					name: formattedData.name,
					brand: formattedData.brand,
					category: formattedData.category,
					costPrice: 0,
					sellingPrice: 0,
					unitName: formattedData.unitName,
					bulkUnitName: formattedData.bulkUnitName || null,
					image: formattedData.image || null,
					description: formattedData.description || null,
					keywords: formattedData.keywords
						? formattedData.keywords.split(',').map((k) => k.trim())
						: [],
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create catalog item');
			}

			setFormSuccess('Catalog item added successfully!');

			// Reset form
			setFormData({
				storeTypeId: '',
				newStoreType: '',
				category: '',
				name: '',
				brand: '',
				unitName: '',
				bulkUnitName: '',
				image: '',
				description: '',
				keywords: '',
			});
			setShowNewStoreTypeInput(false);

			// Refresh catalog items and store types
			fetchCatalogItems();
			fetchStoreTypes();
		} catch (error) {
			console.error('Failed to create catalog item:', error);
			setFormError(
				error instanceof Error
					? error.message
					: 'Failed to create catalog item',
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="p-8">
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
				{/* Left side - Catalog Items List */}
				<div className="lg:col-span-3 overflow-y-auto">
					<Card>
						<CardHeader className="flex flex-row items-center gap-4 w-full">
							<CardTitle className="whitespace-nowrap">
								All Catalog Items
							</CardTitle>
							<Input
								type="text"
								placeholder="Search by name, category, or brand..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="flex-1 h-8 text-xs min-w-0 max-20px"
							/>

							<Select
								value={filterByStoreType}
								onValueChange={setFilterByStoreType}
							>
								<SelectTrigger className="h-8 text-xs w-[140px] shrink-0">
									<SelectValue placeholder="Filter by store type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Store Types</SelectItem>
									{storeTypes.map((type) => (
										<SelectItem key={type.id} value={type.id}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</CardHeader>

						<CardContent>
							{loading ? (
								<div className="text-gray-500 text-center py-8">
									Loading catalog items...
								</div>
							) : Object.keys(groupedItems).length === 0 ? (
								<div className="text-gray-500 text-center py-8">
									No catalog items found
								</div>
							) : (
								<div className="space-y-8">
									{Object.values(groupedItems)
										.sort((a, b) =>
											a.storeType.label.localeCompare(b.storeType.label),
										)
										.map((group) => (
											<div key={group.storeType.id}>
												<h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
													{group.storeType.label}
												</h3>
												<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
													{group.items.map((item) => {
														const isEditing = editingItemId === item.id;
														const currentItem =
															isEditing && editData ? editData : item;

														return (
															<div
																key={item.id}
																ref={isEditing ? editCardRef : null}
																className="relative bg-white rounded-2xl shadow-md hover:shadow-lg transition border border-gray-200 p-6 flex flex-col"
															>
																{!isEditing && (
																	<button
																		onClick={() => deleteItem(item.id)}
																		className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
																		title="Delete item"
																	>
																		<svg
																			className="w-5 h-5"
																			fill="currentColor"
																			viewBox="0 0 24 24"
																		>
																			<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
																		</svg>
																	</button>
																)}
																{/* Circular Image Section */}
																<div className="flex justify-center mb-6">
																	<div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
																		{currentItem?.image ? (
																			<img
																				src={currentItem.image}
																				alt={currentItem.name}
																				className="w-full h-full object-cover"
																			/>
																		) : (
																			<div className="text-gray-400 text-center">
																				<svg
																					className="w-12 h-12 mx-auto"
																					fill="none"
																					stroke="currentColor"
																					viewBox="0 0 24 24"
																				>
																					<path
																						strokeLinecap="round"
																						strokeLinejoin="round"
																						strokeWidth={2}
																						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
																					/>
																				</svg>
																				<p className="text-xs mt-2">No image</p>
																			</div>
																		)}
																	</div>
																</div>

																{isEditing && editData ? (
																	<div
																		className="space-y-2 flex-1 flex flex-col"
																		onClick={(e) => e.stopPropagation()}
																	>
																		<div>
																			<label className="block text-xs font-medium text-gray-700 mb-0.5">
																				Name
																			</label>
																			<Input
																				type="text"
																				value={editData.name}
																				onChange={(e) =>
																					handleEditChange(
																						'name',
																						e.target.value,
																					)
																				}
																				className="h-8 text-sm"
																			/>
																		</div>
																		<div>
																			<label className="block text-xs font-medium text-gray-700 mb-0.5">
																				Brand
																			</label>
																			<Input
																				type="text"
																				value={editData.brand}
																				onChange={(e) =>
																					handleEditChange(
																						'brand',
																						e.target.value,
																					)
																				}
																				className="h-8 text-sm"
																			/>
																		</div>
																		<div>
																			<label
																				htmlFor="edit-category"
																				className="block text-xs font-medium text-gray-700 mb-0.5"
																			>
																				Category
																			</label>
																			<Input
																				id="edit-category"
																				type="text"
																				list="categoryOptions"
																				value={editData.category}
																				onChange={(e) =>
																					handleEditChange(
																						'category',
																						e.target.value,
																					)
																				}
																				className="h-8 text-sm"
																				placeholder="Enter category"
																			/>
																			<datalist id="categoryOptions">
																				{getUniqueSuggestions('category').map(
																					(cat) => (
																						<option key={cat} value={cat} />
																					),
																				)}
																			</datalist>
																		</div>
																		<div className="Flex flex-row items center justify-between">
																			<div>
																				<label className="block text-xs font-medium text-gray-700 mb-0.5">
																					Unit
																				</label>
																				<Input
																					type="text"
																					value={editData.unitName}
																					onChange={(e) =>
																						handleEditChange(
																							'unitName',
																							e.target.value,
																						)
																					}
																					className="h-8 text-sm"
																				/>
																			</div>
																			<div>
																				<label className="block text-xs font-medium text-gray-700 mb-0.5">
																					Bulk Unit Name
																				</label>
																				<Input
																					type="text"
																					value={editData.bulkUnitName || ''}
																					onChange={(e) =>
																						handleEditChange(
																							'bulkUnitName',
																							e.target.value,
																						)
																					}
																					className="h-8 text-sm"
																					placeholder="Optional"
																				/>
																			</div>
																		</div>

																		<div>
																			<label className="block text-xs font-medium text-gray-700 mb-0.5">
																				Image
																			</label>
																			<div
																				onDragOver={(e) => {
																					e.preventDefault();
																					e.currentTarget.classList.add(
																						'bg-blue-50',
																						'border-blue-300',
																					);
																				}}
																				onDragLeave={(e) => {
																					e.currentTarget.classList.remove(
																						'bg-blue-50',
																						'border-blue-300',
																					);
																				}}
																				onDrop={(e) => {
																					e.currentTarget.classList.remove(
																						'bg-blue-50',
																						'border-blue-300',
																					);
																					handleEditImageDrop(e);
																				}}
																				className="border-2 border-dashed border-gray-200 rounded p-1.5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
																			>
																				<input
																					type="file"
																					id={`edit-image-input-${item.id}`}
																					accept="image/*"
																					onChange={handleEditImageInput}
																					className="hidden"
																				/>
																				<label
																					htmlFor={`edit-image-input-${item.id}`}
																					className="cursor-pointer block text-xs text-gray-600"
																				>
																					Drop image or click
																				</label>
																			</div>
																		</div>
																		<div className="flex gap-2 mt-auto pt-2">
																			<Button
																				size="sm"
																				onClick={saveEditedItem}
																				className="flex-1 h-8 text-xs"
																			>
																				Save
																			</Button>
																			<Button
																				size="sm"
																				variant="outline"
																				onClick={cancelEditingItem}
																				className="flex-1 h-8 text-xs"
																			>
																				Cancel
																			</Button>
																		</div>
																	</div>
																) : (
																	<div className="flex flex-col h-full">
																		<p className="absolute top-4 left-6 text-xs text-gray-500 italic">
																			{currentItem.category}
																		</p>
																		<div>
																			<div className="flex justify-between items-center">
																				<h4 className="font-bold text-lg text-gray-900 line-clamp-2">
																					{currentItem.brand}
																				</h4>
																				<p className="text-xs text-gray-600">
																					{currentItem.unitName}
																					{currentItem.bulkUnitName &&
																						` / ${currentItem.bulkUnitName}`}
																				</p>
																			</div>

																			<div>
																				<p className="font-semibold text-sm text-gray-800 mb-1">
																					{currentItem.name}
																				</p>
																			</div>
																		</div>

																		<Button
																			size="sm"
																			onClick={() => startEditingItem(item)}
																			className="w-full py-2 h-auto rounded-full bg-black text-white hover:bg-gray-800 text-xs font-medium text-center"
																		>
																			Edit
																		</Button>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											</div>
										))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right side - Add New Item Form */}
				<div className="lg:col-span-1">
					<Card className="sticky top-8">
						<CardHeader>
							<CardTitle className="text-lg">Add New Item</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-2.5">
								{formError && (
									<div className="p-2 bg-red-100 text-red-700 rounded-lg text-xs">
										{formError}
									</div>
								)}

								{formSuccess && (
									<div className="p-2 bg-green-100 text-green-700 rounded-lg text-xs">
										{formSuccess}
									</div>
								)}

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Store Type <span className="text-red-500">*</span>
									</label>
									<Select
										value={
											showNewStoreTypeInput
												? 'create-new'
												: formData.storeTypeId
										}
										onValueChange={handleSelectChange}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue placeholder="Select store type" />
										</SelectTrigger>
										<SelectContent>
											{storeTypes.map((type) => (
												<SelectItem key={type.id} value={type.id}>
													{type.label}
												</SelectItem>
											))}
											<SelectItem value="create-new">
												+ Create New Store Type
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{showNewStoreTypeInput && (
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											New Store Type Name
										</label>
										<Input
											type="text"
											name="newStoreType"
											value={formData.newStoreType}
											onChange={handleInputChange}
											placeholder="e.g., Pharmacy"
											className="h-8 text-xs"
										/>
									</div>
								)}

								<div>
									<label className="block text-xs font-medium text-gray-700 mb-1">
										Category <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										name="category"
										value={formData.category}
										onChange={handleInputChange}
										placeholder="e.g., Grains"
										className="h-8 text-xs w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
										list="category-suggestions"
										required
									/>
									<datalist id="category-suggestions">
										{getUniqueSuggestions('category').map((category) => (
											<option key={category} value={category} />
										))}
									</datalist>
								</div>

								<div className="flex flex-row items-center gap-2 w-full">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Item Name <span className="text-red-500">*</span>
										</label>
										<Input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											placeholder="e.g., Rice"
											className="h-8 text-xs"
											required
										/>
									</div>

									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Brand <span className="text-red-500">*</span>
										</label>
										<Input
											type="text"
											name="brand"
											value={formData.brand}
											onChange={handleInputChange}
											placeholder="e.g., Dangote"
											className="h-8 text-xs"
											required
										/>
									</div>
								</div>

								<div className="flex flex-row items-center gap-2 w-full">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Unit Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="unitName"
											value={formData.unitName}
											onChange={handleInputChange}
											placeholder="e.g., kg, piece"
											className="h-8 text-xs w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											list="unit-suggestions"
											required
										/>
										<datalist id="unit-suggestions">
											{getUniqueSuggestions('unitName').map((unit) => (
												<option key={unit} value={unit} />
											))}
										</datalist>
									</div>

									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Bulk Unit Name
										</label>
										<input
											type="text"
											name="bulkUnitName"
											value={formData.bulkUnitName}
											onChange={handleInputChange}
											placeholder="e.g., carton"
											className="h-8 text-xs w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
											list="bulk-unit-suggestions"
										/>
										<datalist id="bulk-unit-suggestions">
											{getUniqueSuggestions('bulkUnitName').map((unit) => (
												<option key={unit} value={unit} />
											))}
										</datalist>
									</div>
								</div>

								<div className="border-t border-gray-200 pt-2.5">
									<h4 className="text-xs font-semibold text-gray-700 mb-2">
										Additional Info
									</h4>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Description
										</label>
										<textarea
											name="description"
											value={formData.description}
											onChange={handleInputChange}
											placeholder="Item description"
											rows={2}
											className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div className="mt-2">
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Keywords
										</label>
										<Input
											type="text"
											name="keywords"
											value={formData.keywords}
											onChange={handleInputChange}
											placeholder="Comma-separated"
											className="h-8 text-xs"
										/>
									</div>

									<div className="mt-2">
										<label className="block text-xs font-medium text-gray-700 mb-1">
											Image
										</label>
										<div
											onDragOver={(e) => {
												e.preventDefault();
												e.currentTarget.classList.add(
													'bg-blue-50',
													'border-blue-300',
												);
											}}
											onDragLeave={(e) => {
												e.currentTarget.classList.remove(
													'bg-blue-50',
													'border-blue-300',
												);
											}}
											onDrop={(e) => {
												e.currentTarget.classList.remove(
													'bg-blue-50',
													'border-blue-300',
												);
												handleFormImageDrop(e);
											}}
											className="border-2 border-dashed border-gray-300 rounded p-2 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
										>
											<input
												type="file"
												id="form-image-input"
												accept="image/*"
												onChange={handleFormImageInput}
												className="hidden"
											/>
											<label
												htmlFor="form-image-input"
												className="cursor-pointer block"
											>
												{formData.image ? (
													<div>
														<p className="text-xs font-medium text-green-600 mb-0.5">
															✓ Image selected
														</p>
														<p className="text-xs text-gray-500">
															Click to change
														</p>
													</div>
												) : (
													<div>
														<p className="text-xs font-medium text-gray-700 mb-0.5">
															Drag and drop image
														</p>
														<p className="text-xs text-gray-500">or click</p>
													</div>
												)}
											</label>
										</div>
									</div>
								</div>

								<Button
									type="submit"
									disabled={submitting}
									className="w-full mt-3 h-8 text-xs"
								>
									{submitting ? 'Adding...' : 'Add Item'}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
