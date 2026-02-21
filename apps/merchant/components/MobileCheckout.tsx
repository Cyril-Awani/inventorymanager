'use client';

import React, { useState } from 'react';
import { Trash2, ChevronUp, X, ChevronDown } from 'lucide-react';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface CartItem {
	id: string;
	productId: string;
	name: string;
	brand: string;
	quantity: number;
	unitPrice: number;
	costPrice: number;
	sellByBulk?: boolean;
	unitLabel?: string;
}

interface MobileCheckoutProps {
	items: CartItem[];
	onRemoveItem: (itemId: string) => void;
	onUpdateQuantity: (itemId: string, quantity: number) => void;
	onCheckout: (
		amountPaid: number,
		isPartial: boolean,
		paymentMethod: 'cash' | 'transfer' | 'partial',
	) => void;
	onClearCart?: () => void;
	isLoading?: boolean;
}

export function MobileCheckout({
	items,
	onRemoveItem,
	onUpdateQuantity,
	onCheckout,
	onClearCart,
	isLoading = false,
}: MobileCheckoutProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [amountPaid, setAmountPaid] = React.useState('');
	const [editingQuantity, setEditingQuantity] = React.useState<string | null>(
		null,
	);
	const [quantityInput, setQuantityInput] = React.useState('');
	const [isInputFocused, setIsInputFocused] = useState(false);
	const mobileCartRef = React.useRef<HTMLDivElement>(null);
	const drawerContentRef = React.useRef<HTMLDivElement>(null);

	// Handle viewport changes (keyboard open/close) using Visual Viewport API
	React.useEffect(() => {
		const handleVisualViewportChange = () => {
			if (window.visualViewport && drawerContentRef.current) {
				const viewportHeight = window.visualViewport.height;
				const windowHeight = window.innerHeight;

				// If viewport height is close to window height, keyboard is likely closed
				if (Math.abs(viewportHeight - windowHeight) < 100 && !isInputFocused) {
					// Scroll the drawer to a visible position
					drawerContentRef.current.scrollIntoView({
						behavior: 'smooth',
						block: 'end',
						inline: 'nearest',
					});

					// Reset any scroll issues
					if (mobileCartRef.current) {
						mobileCartRef.current.style.height = '';
					}
				}
			}
		};

		// Handle input blur specifically
		const handleInputBlur = () => {
			setIsInputFocused(false);
			// Small delay to ensure keyboard has started closing
			setTimeout(() => {
				if (drawerContentRef.current) {
					drawerContentRef.current.scrollIntoView({
						behavior: 'smooth',
						block: 'end',
					});
				}
			}, 150);
		};

		if (window.visualViewport) {
			window.visualViewport.addEventListener(
				'resize',
				handleVisualViewportChange,
			);
		}

		window.addEventListener('blur', handleInputBlur);

		return () => {
			if (window.visualViewport) {
				window.visualViewport.removeEventListener(
					'resize',
					handleVisualViewportChange,
				);
			}
			window.removeEventListener('blur', handleInputBlur);
		};
	}, [isInputFocused]);

	// Handle back button to close drawer instead of navigating back
	React.useEffect(() => {
		const handlePopState = (event: PopStateEvent) => {
			if (isOpen) {
				// Prevent default back navigation
				event.preventDefault();
				// Close the drawer instead
				setIsOpen(false);
				// Push a new state to maintain history
				window.history.pushState(null, '', window.location.pathname);
			}
		};

		if (isOpen) {
			// Push a new state when drawer opens
			window.history.pushState(
				{ drawer: 'open' },
				'',
				window.location.pathname,
			);
			// Add event listener for back button
			window.addEventListener('popstate', handlePopState);

			// Prevent body scroll when drawer is open
			document.body.style.overflow = 'hidden';
		}

		return () => {
			if (isOpen) {
				// Remove event listener and restore scroll when drawer closes
				window.removeEventListener('popstate', handlePopState);
				document.body.style.overflow = '';
			}
		};
	}, [isOpen]);

	// Auto-scroll to bottom when new items are added
	React.useEffect(() => {
		if (mobileCartRef.current && isOpen) {
			setTimeout(() => {
				if (mobileCartRef.current) {
					mobileCartRef.current.scrollTop = mobileCartRef.current.scrollHeight;
				}
			}, 100);
		}
	}, [items, isOpen]);

	const totalPrice = items.reduce(
		(sum, item) => sum + item.unitPrice * item.quantity,
		0,
	);

	const handleCheckout = (method: 'cash' | 'transfer') => {
		const paid = parseFloat(amountPaid) || 0;
		if (items.length === 0) {
			alert('Cart is empty');
			return;
		}
		if (paid <= 0) {
			alert('Enter valid amount paid');
			return;
		}
		const isPartialSale = paid < totalPrice;
		onCheckout(paid, isPartialSale, method);
		// Close drawer after successful checkout
		setIsOpen(false);
		// Reset form
		setAmountPaid('');
	};

	const startEditingQuantity = (itemId: string, currentQuantity: number) => {
		setEditingQuantity(itemId);
		setQuantityInput(currentQuantity.toString());
	};

	const handleQuantityInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const value = e.target.value;
		if (value === '' || /^\d+$/.test(value)) {
			setQuantityInput(value);
		}
	};

	const handleQuantityInputKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		itemId: string,
	) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			const newQuantity = parseInt(quantityInput, 10);
			if (!isNaN(newQuantity) && newQuantity > 0) {
				onUpdateQuantity(itemId, newQuantity);
			}
			setEditingQuantity(null);
		} else if (e.key === 'Escape') {
			setEditingQuantity(null);
		}
	};

	const handleQuantityInputBlur = (itemId: string) => {
		if (editingQuantity === itemId) {
			const newQuantity = parseInt(quantityInput, 10);
			if (!isNaN(newQuantity) && newQuantity > 0) {
				onUpdateQuantity(itemId, newQuantity);
			}
			setEditingQuantity(null);
		}
	};

	// Handle clear all - empty entire cart at once
	const handleClearAll = () => {
		if (items.length === 0) return;

		if (onClearCart) {
			onClearCart();
		} else {
			// Fallback if onClearCart is not provided
			items.forEach((item) => {
				onRemoveItem(item.id);
			});
		}

		setIsOpen(false);
	};

	// Handle closing drawer
	const handleCloseDrawer = () => {
		setIsOpen(false);
	};

	// Hide if no items
	if (items.length === 0) {
		return null;
	}

	// Check if amount paid is valid
	const isValidAmount = () => {
		const paid = parseFloat(amountPaid);
		return !isNaN(paid) && paid > 0;
	};

	return (
		<Drawer open={isOpen} onOpenChange={setIsOpen}>
			{/* Collapsed Summary Bar - Fixed at Bottom */}
			{!isOpen && (
				<div
					onClick={() => setIsOpen(true)}
					className="fixed bottom-3 left-0 right-0 z-40 mx-4 rounded-3xl bg-white border-2 border-gray-300 shadow-lg px-4 py-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors md:hidden"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-3xl font-bold text-gray-900">
								₦{totalPrice.toLocaleString()}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="font-semibold text-gray-700">View Cart</span>
							<div className="bg-blue-600 px-4 py-2 rounded-full flex items-center gap-2">
								<span className="font-bold text-white text-lg">
									{items.length}
								</span>
								<span className="text-white text-sm font-medium">items</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Drawer Content */}
			<DrawerContent className="md:hidden" ref={drawerContentRef}>
				<DrawerHeader className="pb-2">
					<div className="flex items-center justify-between mb-4">
						<DrawerTitle>Shopping Cart</DrawerTitle>
						<div className="flex items-center gap-2">
							<ChevronDown
								size={24}
								onClick={handleCloseDrawer}
								aria-label="Close checkout"
								className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
							/>
							{items.length > 0 && (
								<button
									type="button"
									onClick={handleClearAll}
									className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
									title="Clear all items"
									aria-label="Clear all items"
								>
									Clear all
								</button>
							)}
						</div>
					</div>
				</DrawerHeader>

				{/* Items List */}
				<div
					ref={mobileCartRef}
					className="overflow-y-auto scrollbar-hide px-4 pb-4 max-h-[40vh]"
				>
					{items.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-gray-500">Cart is empty</p>
						</div>
					) : (
						<div className="space-y-3">
							{items.map((item) => (
								<div
									key={item.id}
									className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 bg-white shadow-sm"
								>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm truncate">{item.name}</p>
										<p className="text-xs text-gray-600">
											{item.brand}
											{item.unitLabel
												? ` · ${item.quantity} ${item.unitLabel}${item.quantity !== 1 ? 's' : ''}`
												: ''}
										</p>
										<p className="text-blue-600 font-semibold text-sm mt-1">
											₦{(item.unitPrice * item.quantity).toLocaleString()}
										</p>
									</div>

									<div className="flex items-center gap-1.5">
										<button
											onClick={() =>
												onUpdateQuantity(
													item.id,
													Math.max(1, item.quantity - 1),
												)
											}
											className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
										>
											-
										</button>

										{editingQuantity === item.id ? (
											<input
												type="text"
												value={quantityInput}
												onChange={handleQuantityInputChange}
												onKeyDown={(e) =>
													handleQuantityInputKeyDown(e, item.id)
												}
												onBlur={() => handleQuantityInputBlur(item.id)}
												autoFocus
												className="w-12 text-center border border-blue-500 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										) : (
											<button
												onClick={() =>
													startEditingQuantity(item.id, item.quantity)
												}
												className="min-w-[2rem] px-2 py-1.5 text-center font-medium text-sm hover:bg-gray-100 rounded-lg cursor-text transition-colors"
												title="Click to edit"
											>
												{item.quantity}
											</button>
										)}

										<button
											onClick={() =>
												onUpdateQuantity(item.id, item.quantity + 1)
											}
											className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
										>
											+
										</button>
									</div>

									<button
										onClick={() => onRemoveItem(item.id)}
										className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
									>
										<Trash2 size={18} />
									</button>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Footer with Summary and Actions */}
				<DrawerFooter className="border-t mt-auto bg-gray-50">
					<div className="w-full space-y-2 mb-4 px-1">
						<div className="flex justify-between text-sm text-gray-600">
							<span>Subtotal:</span>
							<span>₦{totalPrice.toLocaleString()}</span>
						</div>
						<div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
							<span>Total:</span>
							<span className="text-blue-600">
								₦{totalPrice.toLocaleString()}
							</span>
						</div>
					</div>

					<div className="w-full space-y-3 px-1">
						<label className="block text-sm font-medium text-gray-700">
							Amount Paid (₦)
						</label>
						<Input
							type="number"
							value={amountPaid}
							onChange={(e) => {
								setAmountPaid(e.target.value);
							}}
							onFocus={() => setIsInputFocused(true)}
							onBlur={() => {
								// Don't immediately reset - let the keyboard close
								setTimeout(() => setIsInputFocused(false), 200);
							}}
							placeholder="Enter amount"
							className="w-full"
							min="0"
							step="0.01"
						/>

						{amountPaid &&
							parseFloat(amountPaid) > 0 &&
							parseFloat(amountPaid) < totalPrice &&
							isValidAmount() && (
								<div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
									<p className="font-medium text-amber-900">
										Balance: ₦
										{(totalPrice - parseFloat(amountPaid)).toLocaleString()}
									</p>
									<p className="text-amber-700 text-xs mt-1">
										Partial payment - customer credit will be created.
									</p>
								</div>
							)}
					</div>

					{/* Payment Method Selection */}
					<div className="w-full space-y-2 mt-4 px-1">
						<label className="block text-sm font-medium text-gray-700">
							Payment Method
						</label>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => handleCheckout('cash')}
								disabled={items.length === 0 || !isValidAmount() || isLoading}
								className="py-3 px-3 rounded-xl font-medium text-sm transition-all bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:transform active:scale-95"
							>
								💵 Cash
							</button>
							<button
								type="button"
								onClick={() => handleCheckout('transfer')}
								disabled={items.length === 0 || !isValidAmount() || isLoading}
								className="py-3 px-3 rounded-xl font-medium text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:transform active:scale-95"
							>
								🔄 Transfer
							</button>
						</div>
					</div>

					{isLoading && (
						<div className="text-center py-2 text-sm text-gray-600">
							Processing...
						</div>
					)}
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
