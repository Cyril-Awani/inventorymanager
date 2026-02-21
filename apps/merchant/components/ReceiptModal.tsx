'use client';

import React, { useRef } from 'react';
import {
	Download,
	Share2,
	Mail,
	MessageCircle,
	AlertTriangle,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { generatePDFReceipt, generateImageReceipt } from '@/lib/receipt';

interface ReceiptItem {
	name: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	unit?: string;
}

interface ReceiptModalProps {
	isOpen: boolean;
	onClose: () => void;
	transactionId: string;
	storeName: string;
	workerName: string;
	items: ReceiptItem[];
	totalPrice: number;
	amountPaid: number;
	remainingBalance?: number;
	paymentType: 'cash' | 'partial' | 'credit' | 'transfer';
	paymentMethod?: 'cash' | 'transfer' | 'partial';
	customerName?: string;
	customerPhone?: string;
	isOffline?: boolean;
}

export function ReceiptModal({
	isOpen,
	onClose,
	transactionId,
	storeName,
	workerName,
	items,
	totalPrice,
	amountPaid,
	remainingBalance = 0,
	paymentType,
	paymentMethod,
	customerName,
	customerPhone,
	isOffline = false,
}: ReceiptModalProps) {
	const receiptRef = useRef<HTMLDivElement>(null);

	const handleDownloadPDF = async () => {
		await generatePDFReceipt({
			storeName,
			transactionId,
			workerName,
			date: new Date(),
			items,
			totalPrice,
			amountPaid,
			remainingBalance,
			paymentType,
			paymentMethod,
			customerName,
			customerPhone,
		});
	};

	const handleDownloadImage = async () => {
		if (!receiptRef.current) return;

		const blob = await generateImageReceipt(receiptRef.current);
		if (!blob) {
			alert('Failed to generate image');
			return;
		}

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `Receipt-${transactionId}.png`;
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleShareWhatsApp = () => {
		if (!customerPhone) {
			alert('Customer phone number not available');
			return;
		}

		const message = `Receipt from ${storeName}\nTransaction ID: ${transactionId}\nTotal: ₦${totalPrice.toLocaleString()}\nThank you!`;
		const whatsappUrl = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
		window.open(whatsappUrl, '_blank');
	};

	const handleShareEmail = () => {
		if (!customerName) {
			alert('Customer email not available');
			return;
		}

		const subject = `Receipt - ${transactionId}`;
		const body = `Hello ${customerName},\n\nTransaction ID: ${transactionId}\nTotal Amount: ₦${totalPrice.toLocaleString()}\nAmount Paid: ₦${amountPaid.toLocaleString()}\n\nThank you!`;
		const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		window.location.href = mailtoUrl;
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Transaction Receipt"
			size="md"
		>
			{isOffline && (
				<div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
					<AlertTriangle
						size={16}
						className="text-amber-700 flex-shrink-0 mt-0.5"
					/>
					<div className="text-sm text-amber-800">
						<p className="font-semibold">Saved Offline</p>
						<p className="text-xs">
							This transaction will sync to the server when you're back online.
						</p>
					</div>
				</div>
			)}

			{/* Receipt Preview */}
			<div
				ref={receiptRef}
				className="bg-white p-6 mb-6 border border-gray-300 rounded font-mono text-sm"
			>
				<div className="text-center mb-4 border-b pb-3">
					<h3 className="font-bold text-lg">{storeName}</h3>
					<p className="text-xs text-gray-600">Receipt</p>
				</div>

				<div className="mb-4 text-xs space-y-1">
					<div className="flex justify-between">
						<span>Transaction ID:</span>
						<span className="font-bold">{transactionId}</span>
					</div>
					<div className="flex justify-between">
						<span>Worker:</span>
						<span>{workerName}</span>
					</div>
					<div className="flex justify-between">
						<span>Date:</span>
						<span>{new Date().toLocaleString()}</span>
					</div>
					{customerName && (
						<div className="flex justify-between">
							<span>Customer:</span>
							<span>{customerName}</span>
						</div>
					)}
					{customerPhone && (
						<div className="flex justify-between">
							<span>Phone:</span>
							<span>{customerPhone}</span>
						</div>
					)}
				</div>

				<div className="border-t border-b py-3 mb-3">
					<div className="text-xs font-bold mb-2 grid grid-cols-12 gap-2">
						<span className="col-span-5">Item</span>
						<span className="col-span-2 text-right">Qty</span>
						<span className="col-span-3 text-right">Price</span>
						<span className="col-span-2 text-right">Total</span>
					</div>

					{items.map((item, index) => (
						<div
							key={index}
							className="text-xs mb-2 grid grid-cols-12 gap-2 items-center"
						>
							<span className="col-span-5 truncate">
								{item.name.substring(0, 15)}
							</span>
							<span className="col-span-2 text-right whitespace-nowrap">
								{item.quantity} {item.unit}
							</span>
							<span className="col-span-3 text-right">
								₦
								{item.unitPrice.toLocaleString('en-NG', {
									maximumFractionDigits: 0,
								})}
							</span>
							<span className="col-span-2 text-right font-semibold">
								₦
								{item.totalPrice.toLocaleString('en-NG', {
									maximumFractionDigits: 0,
								})}
							</span>
						</div>
					))}
				</div>

				<div className="space-y-2 text-xs">
					<div className="flex justify-between">
						<span>Total:</span>
						<span className="font-bold">₦{totalPrice.toLocaleString()}</span>
					</div>
					<div className="flex justify-between">
						<span>Paid:</span>
						<span className="font-bold">₦{amountPaid.toLocaleString()}</span>
					</div>

					{/* Payment Method */}
					{paymentMethod && (
						<div className="flex justify-between pt-2 border-t">
							<span>Payment Method:</span>
							<span className="font-bold">
								{paymentMethod === 'cash'
									? '💵 Cash'
									: paymentMethod === 'transfer'
										? '🔄 Transfer'
										: '⏳ Partial'}
							</span>
						</div>
					)}

					{/* Removed store credit display */}

					{remainingBalance > 0 && (
						<>
							<div className="flex justify-between text-red-600 font-bold border-t pt-2">
								<span>Balance Due:</span>
								<span>₦{remainingBalance.toLocaleString()}</span>
							</div>
							<div className="mt-2 pt-2 border-t text-center text-red-600 font-bold text-xs">
								PARTIAL PAYMENT
								{customerName && <div>Customer: {customerName}</div>}
							</div>
						</>
					)}

					{paymentType === 'credit' && remainingBalance === 0 && (
						<div className="mt-2 pt-2 border-t text-center text-red-600 font-bold">
							CREDIT PAYMENT
							{customerName && (
								<div className="text-xs">Customer: {customerName}</div>
							)}
						</div>
					)}
				</div>

				<div className="mt-4 text-center text-xs text-gray-600">
					Thank you for your patronage!
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex flex-col gap-3 mb-4">
				<div className="flex gap-3">
					<Button
						variant="secondary"
						size="md"
						onClick={handleDownloadPDF}
						className="flex-1 gap-2"
					>
						<Download size={16} />
						<span className="hidden sm:inline">PDF</span>
					</Button>

					<Button
						variant="secondary"
						size="md"
						onClick={handleDownloadImage}
						className="flex-1 gap-2"
					>
						<Download size={16} />
						<span className="hidden sm:inline">Image</span>
					</Button>

					<Button
						variant="secondary"
						size="md"
						onClick={handleShareEmail}
						className="flex-1 gap-2"
					>
						<Mail size={16} />
						<span className="hidden sm:inline">Email</span>
					</Button>
				</div>

				{customerPhone && (
					<Button
						variant="secondary"
						size="md"
						onClick={handleShareWhatsApp}
						className="w-full gap-2"
					>
						<MessageCircle size={16} />
						<span className="hidden sm:inline">Share on WhatsApp</span>
						<span className="sm:hidden">WhatsApp</span>
					</Button>
				)}
			</div>

			<Button variant="primary" size="lg" onClick={onClose} className="w-full">
				Close
			</Button>
		</Modal>
	);
}
