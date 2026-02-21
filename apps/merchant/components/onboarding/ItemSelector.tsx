'use client';

import React from 'react';
import { Card } from '@/components/Card';
import { Check } from 'lucide-react';

interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	unitName: string;
	image?: string;
}

interface ItemSelectorProps {
	items: Product[];
	selectedItems: Set<string>;
	onToggleItem: (id: string) => void;
	isLoading?: boolean;
}

export function ItemSelector({
	items,
	selectedItems,
	onToggleItem,
	isLoading = false,
}: ItemSelectorProps) {
	if (isLoading) {
		return (
			<div className="text-center py-8 text-gray-600">Loading items...</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="text-center py-8 text-gray-600">
				No items available for this store type
			</div>
		);
	}

	// Group items by category
	const groupedItems: Record<string, Product[]> = {};
	items.forEach((item) => {
		if (!groupedItems[item.category]) {
			groupedItems[item.category] = [];
		}
		groupedItems[item.category].push(item);
	});

	return (
		<div className="space-y-8 max-h-[70vh] overflow-y-auto pr-4">
			{Object.entries(groupedItems).map(([category, categoryItems]) => (
				<div key={category}>
					<h3 className="font-bold text-lg text-gray-900 mb-4 uppercase tracking-wide">
						{category}
					</h3>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{categoryItems.map((item) => {
							const isSelected = selectedItems.has(item.id);

							return (
								<button
									key={item.id}
									onClick={() => onToggleItem(item.id)}
									className="group relative flex flex-col items-center text-center transition-transform duration-200 hover:scale-105 focus:outline-none"
								>
									{/* Image Container */}
									<div
										className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 border-2 transition-all duration-200"
										style={{
											borderColor: isSelected ? '#2563eb' : '#e5e7eb',
										}}
									>
										{item.image ? (
											<img
												src={item.image}
												alt={item.name}
												className="w-full h-full object-cover group-hover:brightness-90 transition-all"
											/>
										) : (
											<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
												<span className="text-gray-500 text-xs text-center px-2">
													{item.name}
												</span>
											</div>
										)}

										{/* Selection Badge */}
										{isSelected && (
											<div className="absolute inset-0 bg-blue-600 bg-opacity-40 flex items-center justify-center">
												<div className="bg-white rounded-full p-2 shadow-lg">
													<Check className="w-6 h-6 text-blue-600" />
												</div>
											</div>
										)}
									</div>

									{/* Product Info */}
									<div className="w-full">
										<h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
											{item.name}
										</h4>
										<p className="text-xs text-gray-600 mb-2">{item.brand}</p>
										{/* Prices are hidden during onboarding; show only name and brand */}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
}
