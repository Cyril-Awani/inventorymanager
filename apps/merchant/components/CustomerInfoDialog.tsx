'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface CustomerInfoDialogProps {
	onCancel: () => void;
	onSubmit: (customerInfo: { name: string; phone?: string }) => void;
	totalPrice: number;
	amountPaid: number;
	isLoading?: boolean;
}

export function CustomerInfoDialog({
	onCancel,
	onSubmit,
	totalPrice,
	amountPaid,
	isLoading = false,
}: CustomerInfoDialogProps) {
	const [customerName, setCustomerName] = useState('');
	const [customerPhone, setCustomerPhone] = useState('');
	const [error, setError] = useState('');

	const remainingBalance = totalPrice - amountPaid;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (!customerName.trim()) {
			setError('Customer name is required');
			return;
		}

		onSubmit({
			name: customerName.trim(),
			phone: customerPhone.trim() || undefined,
		});
		setCustomerName('');
		setCustomerPhone('');
	};

	return (
		<Modal
			isOpen={true}
			onClose={onCancel}
			title="Customer Information"
			size="sm"
		>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
					<p className="text-sm text-gray-700">
						<span className="font-semibold">Total Amount:</span> ₦
						{totalPrice.toLocaleString()}
					</p>
					<p className="text-sm text-gray-700">
						<span className="font-semibold">Amount Paid:</span> ₦
						{amountPaid.toLocaleString()}
					</p>
					{remainingBalance > 0 && (
						<p className="text-lg font-bold text-red-600 mt-2">
							<span className="font-semibold">Balance Due:</span> ₦
							{remainingBalance.toLocaleString()}
						</p>
					)}
				</div>

				<p className="text-gray-600 text-sm">
					Enter customer details to record the transaction:
				</p>

				<Input
					label="Customer Name *"
					type="text"
					value={customerName}
					onChange={(e) => setCustomerName(e.target.value)}
					placeholder="e.g. John Doe"
					error={error}
					autoFocus
				/>

				<Input
					label="Phone Number (Optional)"
					type="tel"
					value={customerPhone}
					onChange={(e) => setCustomerPhone(e.target.value)}
					placeholder="e.g. +234 8012345678"
				/>

				<div className="flex gap-3">
					<Button
						variant="secondary"
						size="md"
						onClick={onCancel}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="primary"
						size="md"
						isLoading={isLoading}
						className="flex-1"
					>
						Complete Sale
					</Button>
				</div>
			</form>
		</Modal>
	);
}
