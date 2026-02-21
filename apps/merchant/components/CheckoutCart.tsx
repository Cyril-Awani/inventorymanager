'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

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

interface CheckoutCartProps {
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

export function CheckoutCart({
	items,
	onRemoveItem,
	onUpdateQuantity,
	onCheckout,
	onClearCart,
	isLoading = false,
}: CheckoutCartProps) {
	const [amountPaid, setAmountPaid] = React.useState('');
	const [editingQuantity, setEditingQuantity] = React.useState<string | null>(
		null,
	);
	const [quantityInput, setQuantityInput] = React.useState('');
	const cartBodyRef = React.useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new items are added
	React.useEffect(() => {
		if (cartBodyRef.current) {
			setTimeout(() => {
				if (cartBodyRef.current) {
					cartBodyRef.current.scrollTop = cartBodyRef.current.scrollHeight;
				}
			}, 0);
		}
	}, [items]);

	const totalPrice = items.reduce(
		(sum, item) => sum + item.unitPrice * item.quantity,
		0,
	);
	const totalCost = items.reduce(
		(sum, item) => sum + item.costPrice * item.quantity,
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
	};

	const startEditingQuantity = (itemId: string, currentQuantity: number) => {
		setEditingQuantity(itemId);
		setQuantityInput(currentQuantity.toString());
	};

	const handleQuantityInputChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		// Only allow positive integers
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

	return (
		<Card className="h-screen flex flex-col">
			<CardHeader className="flex flex-row justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">Checkout</h2>
					<p className="text-gray-600 text-sm">Items: {items.length}</p>
				</div>
				<button
					type="button"
					onClick={() => {
						if (onClearCart) {
							onClearCart();
						} else {
							// Fallback if onClearCart is not provided
							items.forEach((item) => {
								onRemoveItem(item.id);
							});
						}
					}}
					className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
				>
					Clear Cart
				</button>
			</CardHeader>

			<CardBody
				ref={cartBodyRef}
				className="flex-1 overflow-y-auto scrollbar-hide"
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
								className="border border-gray-200 rounded p-3 flex items-center gap-3"
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
											onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
										}
										className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
									>
										-
									</button>

									{editingQuantity === item.id ? (
										<input
											type="text"
											value={quantityInput}
											onChange={handleQuantityInputChange}
											onKeyDown={(e) => handleQuantityInputKeyDown(e, item.id)}
											onBlur={() => handleQuantityInputBlur(item.id)}
											autoFocus
											className="w-12 text-center border border-blue-500 rounded-md px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									) : (
										<button
											onClick={() =>
												startEditingQuantity(item.id, item.quantity)
											}
											className="min-w-[2rem] px-1 py-1 text-center font-medium text-sm hover:bg-gray-100 rounded cursor-text"
											title="Click to edit"
										>
											{item.quantity}
										</button>
									)}

									<button
										onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
										className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
									>
										+
									</button>
								</div>

								<button
									onClick={() => onRemoveItem(item.id)}
									className="text-red-600 hover:text-red-700 p-1"
								>
									<Trash2 size={18} />
								</button>
							</div>
						))}
					</div>
				)}
			</CardBody>

			<CardFooter className="flex-col gap-4 border-t">
				<div className="w-full space-y-2">
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

				<div className="w-full space-y-3">
					<label className="block text-sm font-medium text-gray-700">
						Amount Paid (₦)
					</label>
					<Input
						type="number"
						value={amountPaid}
						onChange={(e) => {
							setAmountPaid(e.target.value);
						}}
						placeholder="Enter amount"
					/>

					{amountPaid &&
						parseFloat(amountPaid) > 0 &&
						parseFloat(amountPaid) < totalPrice && (
							<div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
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
				<div className="w-full space-y-2">
					<label className="block text-sm font-medium text-gray-700">
						Payment Method
					</label>
					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={() => handleCheckout('cash')}
							disabled={items.length === 0 || parseFloat(amountPaid) <= 0}
							className="py-2 px-3 rounded-lg font-medium text-sm transition-all bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
						>
							💵 Cash
						</button>
						<button
							type="button"
							onClick={() => handleCheckout('transfer')}
							disabled={items.length === 0 || parseFloat(amountPaid) <= 0}
							className="py-2 px-3 rounded-lg font-medium text-sm transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
						>
							🔄 Transfer
						</button>
					</div>
				</div>
			</CardFooter>
		</Card>
	);
}
