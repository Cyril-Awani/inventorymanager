'use client';

import React, { useState } from 'react';
import { Plus, Minus, Package, X } from 'lucide-react';
import { Button } from './Button';

export interface ProductTileProduct {
	id: string;
	name: string;
	brand: string;
	costPrice: number;
	price: number; // selling price per unit
	quantity: number;
	image?: string;
	unitName: string;
	unitsPerBulk?: number | null;
	bulkSellingPrice?: number | null;
	bulkUnitName?: string | null;
}

interface ProductTileProps {
	product: ProductTileProduct;
	onAddToCart: (
		productId: string,
		quantity: number,
		unitPrice: number,
		costPrice: number,
		sellByBulk: boolean,
	) => void;
	viewMode?: 'grid' | 'list';
}

export function ProductTile({
	product,
	onAddToCart,
	viewMode = 'grid',
}: ProductTileProps) {
	const [cartQty, setCartQty] = useState(0);
	const [sellByBulk, setSellByBulk] = useState(false);

	const hasBulk =
		product.unitsPerBulk != null &&
		product.unitsPerBulk > 0 &&
		product.bulkSellingPrice != null &&
		product.bulkSellingPrice > 0;
	const bulkUnitName = product.bulkUnitName || 'Bulk';

	const unitPrice =
		sellByBulk && hasBulk ? product.bulkSellingPrice! : product.price;
	const costPerLine =
		sellByBulk && hasBulk
			? product.costPrice * product.unitsPerBulk!
			: product.costPrice;
	const maxQty =
		sellByBulk && hasBulk
			? Math.floor(product.quantity / product.unitsPerBulk!)
			: product.quantity;
	const unitLabel = sellByBulk && hasBulk ? bulkUnitName : product.unitName;

	const handleAdd = () => {
		if (cartQty < maxQty) setCartQty(cartQty + 1);
	};

	const handleRemove = () => {
		if (cartQty > 0) setCartQty(cartQty - 1);
	};

	const handleAddToCart = () => {
		if (cartQty > 0) {
			onAddToCart(
				product.id,
				cartQty,
				unitPrice,
				costPerLine,
				sellByBulk && hasBulk,
			);
			setCartQty(0);
		}
	};

	// New Grid view for mobile and desktop
	const GridView = () => (
		<div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
			{/* Card Wrapper */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
				{/* Image Container */}
				<div className="relative w-full h-[200px] bg-gray-50">
					{product.image ? (
						<img
							src={product.image || '/placeholder.svg'}
							alt={product.name}
							className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
						/>
					) : (
						<div className="flex items-center justify-center w-full h-full text-gray-300">
							<Package className="w-12 h-12" />
						</div>
					)}

					{/* Stock Badge */}
					<div className="absolute top-2 left-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full">
						{sellByBulk && hasBulk
							? (() => {
									const bulkQty = Math.floor(
										product.quantity / product.unitsPerBulk!,
									);
									const remainder = product.quantity % product.unitsPerBulk!;
									return remainder > 0
										? `${bulkQty} ${bulkUnitName} ${remainder} ${product.unitName}`
										: `${bulkQty} ${bulkUnitName}`;
								})()
							: `${product.quantity} ${product.unitName}`}
					</div>

					{/* Unit Toggle Buttons */}
					{hasBulk && (
						<div className="absolute bottom-2 right-2 bg-blue-600 rounded-full p-1 flex gap-0 shadow-sm">
							<button
								type="button"
								onClick={() => setSellByBulk(false)}
								className={`text-xs font-bold py-1.5 px-3 rounded-full transition-all duration-200 ${
									!sellByBulk
										? 'bg-white text-blue-600'
										: 'text-white hover:bg-blue-700/50'
								}`}
							>
								{product.unitName}
							</button>
							<button
								type="button"
								onClick={() => setSellByBulk(true)}
								className={`text-xs font-bold py-1.5 px-3 rounded-full transition-all duration-200 ${
									sellByBulk
										? 'bg-white text-blue-600'
										: 'text-white hover:bg-blue-700/50'
								}`}
							>
								{bulkUnitName}
							</button>
						</div>
					)}
				</div>

				{/* Content Section */}
				<div className="p-3 flex flex-col flex-grow">
					{/* Brand + Name + Price */}
					<div className="flex justify-between items-start gap-2">
						<div className="flex-1 min-w-0">
							<p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1 truncate">
								{product.brand}
							</p>
							<h3 className="font-bold text-sm text-gray-900 line-clamp-2">
								{product.name}
							</h3>
						</div>

						<div className="text-right shrink-0">
							<p className="text-lg font-black text-blue-600">
								₦{unitPrice.toLocaleString()}
							</p>
							<p className="text-xs text-gray-500">{unitLabel}</p>
						</div>
					</div>

					{/* Spacer */}
					<div className="mt-auto pt-3 flex gap-2">
						{/* Quantity Controller */}
						<div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200 shrink-0">
							<button
								type="button"
								onClick={handleRemove}
								disabled={cartQty === 0}
								className="flex items-center justify-center hover:bg-gray-300 disabled:opacity-40 w-6 h-6 rounded transition"
							>
								<Minus size={12} />
							</button>

							<span className="text-xs font-bold w-5 text-center">
								{cartQty}
							</span>

							<button
								type="button"
								onClick={handleAdd}
								disabled={cartQty >= maxQty}
								className="flex items-center justify-center hover:bg-gray-300 disabled:opacity-40 w-6 h-6 rounded transition"
							>
								<Plus size={12} />
							</button>
						</div>

						{/* Add Button */}
						<button
							type="button"
							onClick={handleAddToCart}
							disabled={cartQty === 0 || maxQty === 0}
							className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs py-2 rounded-lg transition-all duration-200"
						>
							Add
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	// List view for mobile (horizontal layout like the image)
	const MobileListView = () => (
		<div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 p-3 relative">
			<div className="flex items-start gap-3 pr-14">
				<div className="w-20 h-20 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
					{product.image ? (
						<img
							src={product.image || '/placeholder.svg'}
							alt={product.name}
							className="w-full h-full object-contain"
						/>
					) : (
						<Package className="w-8 h-8 text-gray-300" />
					)}
				</div>

				<div className="flex-grow min-w-0">
					<p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">
						{product.brand}
					</p>
					<h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
						{product.name}
					</h3>
					<p className="text-xs text-gray-500 mb-2">
						<span className="font-medium text-gray-700">
							{product.quantity}
						</span>{' '}
						{product.unitName}s in stock
					</p>

					<p className="text-lg font-bold text-blue-600">
						₦{unitPrice.toLocaleString()}
					</p>
				</div>
			</div>

			<div className="absolute top-3 right-3 flex flex-col gap-2">
				<Button
					variant="primary"
					size="sm"
					type="button"
					onClick={handleAddToCart}
					disabled={cartQty === 0 || maxQty === 0}
					className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-xs font-semibold"
				>
					Add
				</Button>
			</div>

			<div className="absolute bottom-3 right-3 flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
				<button
					type="button"
					onClick={handleRemove}
					disabled={cartQty === 0}
					className="flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-40 w-6 h-6 rounded transition-colors duration-200"
				>
					<Minus size={12} />
				</button>
				<span className="text-xs font-semibold w-5 text-center">{cartQty}</span>
				<button
					type="button"
					onClick={handleAdd}
					disabled={cartQty >= maxQty}
					className="flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-40 w-6 h-6 rounded transition-colors duration-200"
				>
					<Plus size={12} />
				</button>
			</div>
		</div>
	);

	// Enhanced list view for desktop
	const DesktopListView = () => (
		<div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
			<div className="flex items-center gap-6 p-5">
				<div className="w-32 h-32 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
					{product.image ? (
						<img
							src={product.image || '/placeholder.svg'}
							alt={product.name}
							className="w-full h-full object-contain"
						/>
					) : (
						<Package className="w-12 h-12 text-gray-300" />
					)}
				</div>

				<div className="flex-grow">
					<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
						{product.brand}
					</p>
					<h3 className="font-semibold text-lg text-gray-900 mb-4">
						{product.name}
					</h3>
					<div className="flex items-center gap-8">
						<div>
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Price
							</p>
							<p className="text-2xl font-bold text-blue-600">
								₦{unitPrice.toLocaleString()}
								<span className="text-sm font-normal text-gray-600 ml-1">
									/ {unitLabel}
								</span>
							</p>
						</div>
						<div>
							<p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
								Stock
							</p>
							<p className="text-lg font-semibold text-gray-900">
								{product.quantity} {product.unitName}s
								{hasBulk && (
									<span className="text-sm font-normal text-gray-600 block">
										({Math.floor(product.quantity / product.unitsPerBulk!)}{' '}
										{bulkUnitName}s)
									</span>
								)}
							</p>
						</div>
					</div>
				</div>

				{hasBulk && (
					<div className="flex flex-col gap-2 flex-shrink-0">
						<span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
							Sell by:
						</span>
						<button
							type="button"
							onClick={() => setSellByBulk(false)}
							className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
								!sellByBulk
									? 'bg-blue-600 text-white shadow-sm'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
							}`}
						>
							{product.unitName}
						</button>
						<button
							type="button"
							onClick={() => setSellByBulk(true)}
							className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
								sellByBulk
									? 'bg-blue-600 text-white shadow-sm'
									: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
							}`}
						>
							{bulkUnitName}
						</button>
					</div>
				)}

				<div className="flex flex-col gap-3 items-center flex-shrink-0">
					<div className="flex items-center gap-1 border border-gray-200 bg-gray-50 rounded-lg p-1.5">
						<button
							type="button"
							onClick={handleRemove}
							disabled={cartQty === 0}
							className="flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 w-8 h-8 rounded-md transition-colors duration-200"
						>
							<Minus size={16} />
						</button>
						<span className="text-sm font-semibold w-8 text-center">
							{cartQty}
						</span>
						<button
							type="button"
							onClick={handleAdd}
							disabled={cartQty >= maxQty}
							className="flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 w-8 h-8 rounded-md transition-colors duration-200"
						>
							<Plus size={16} />
						</button>
					</div>
					<Button
						variant="primary"
						size="sm"
						onClick={handleAddToCart}
						disabled={cartQty === 0 || maxQty === 0}
						className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 font-semibold"
					>
						Add to Cart
					</Button>
				</div>
			</div>
		</div>
	);

	// On mobile, show horizontal list view, on desktop show grid view
	if (viewMode === 'list') {
		return (
			<>
				<div className="lg:hidden">
					<MobileListView />
				</div>
				<div className="hidden lg:block">
					<DesktopListView />
				</div>
			</>
		);
	}

	return <GridView />;
}
