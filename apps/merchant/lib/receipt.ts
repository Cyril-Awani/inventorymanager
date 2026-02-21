import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptItem {
	name: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	unit?: string;
}

export interface ReceiptData {
	storeName: string;
	storeLogoUrl?: string;
	transactionId: string;
	workerName: string;
	date: Date;
	items: ReceiptItem[];
	totalPrice: number;
	amountPaid: number;
	remainingBalance: number;
	paymentType: 'cash' | 'partial' | 'credit' | 'transfer';
	paymentMethod?: 'cash' | 'transfer' | 'partial';
	customerName?: string;
	customerPhone?: string;
}

export async function generatePDFReceipt(data: ReceiptData): Promise<void> {
	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4',
	});

	let yPosition = 20;
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();

	// Set fonts
	pdf.setFont('helvetica', 'bold');
	pdf.setFontSize(16);

	// Store name
	pdf.text(data.storeName, pageWidth / 2, yPosition, { align: 'center' });
	yPosition += 10;

	// Receipt header
	pdf.setFont('helvetica', 'normal');
	pdf.setFontSize(10);
	pdf.text(`Receipt: ${data.transactionId}`, pageWidth / 2, yPosition, {
		align: 'center',
	});
	yPosition += 6;

	// Date and worker
	pdf.setFontSize(8);
	pdf.text(`Date: ${data.date.toLocaleString()}`, 20, yPosition);
	pdf.text(`Worker: ${data.workerName}`, pageWidth - 20, yPosition, {
		align: 'right',
	});
	yPosition += 8;

	// Divider
	pdf.line(20, yPosition, pageWidth - 20, yPosition);
	yPosition += 6;

	// Items header
	pdf.setFont('helvetica', 'bold');
	pdf.setFontSize(9);
	pdf.text('Item', 20, yPosition);
	pdf.text('Qty', 100, yPosition);
	pdf.text('Price', 130, yPosition);
	pdf.text('Total', pageWidth - 20, yPosition, { align: 'right' });
	yPosition += 6;

	// Divider
	pdf.line(20, yPosition, pageWidth - 20, yPosition);
	yPosition += 6;

	// Items
	pdf.setFont('helvetica', 'normal');
	pdf.setFontSize(8);

	data.items.forEach((item) => {
		if (yPosition > pageHeight - 40) {
			pdf.addPage();
			yPosition = 20;
		}

		const itemName = item.name.substring(0, 25);
		const qtyLabel = item.unit
			? `${item.quantity} ${item.unit}`
			: `${item.quantity}`;
		pdf.text(itemName, 20, yPosition);
		pdf.text(qtyLabel, 100, yPosition);
		pdf.text(`₦${item.unitPrice.toLocaleString()}`, 130, yPosition);
		pdf.text(
			`₦${item.totalPrice.toLocaleString()}`,
			pageWidth - 20,
			yPosition,
			{
				align: 'right',
			},
		);

		yPosition += 5;
	});

	// Divider
	yPosition += 2;
	pdf.line(20, yPosition, pageWidth - 20, yPosition);
	yPosition += 6;

	// Totals
	pdf.setFont('helvetica', 'bold');
	pdf.setFontSize(10);

	pdf.text(
		`Total: ₦${data.totalPrice.toLocaleString()}`,
		pageWidth - 20,
		yPosition,
		{
			align: 'right',
		},
	);
	yPosition += 6;

	pdf.text(
		`Paid: ₦${data.amountPaid.toLocaleString()}`,
		pageWidth - 20,
		yPosition,
		{
			align: 'right',
		},
	);
	yPosition += 6;

	// Store credit display removed

	if (data.remainingBalance > 0) {
		pdf.setTextColor(220, 38, 38);
		pdf.text(
			`Balance: ₦${data.remainingBalance.toLocaleString()}`,
			pageWidth - 20,
			yPosition,
			{ align: 'right' },
		);
		yPosition += 6;
		pdf.setTextColor(0, 0, 0);
	}

	// Payment type and method
	pdf.setTextColor(74, 85, 104);
	pdf.setFontSize(8);

	if (data.paymentMethod) {
		const methodLabel =
			data.paymentMethod === 'cash'
				? '💵 Cash'
				: data.paymentMethod === 'transfer'
					? '🔄 Bank Transfer'
					: '⏳ Partial Payment';
		pdf.text(`Payment Method: ${methodLabel}`, 20, yPosition);
		yPosition += 4;
	}

	if (data.paymentType === 'credit') {
		pdf.text('Payment Type: CREDIT', 20, yPosition);
		yPosition += 4;
		if (data.customerName) {
			pdf.text(`Customer: ${data.customerName}`, 20, yPosition);
			yPosition += 4;
			if (data.customerPhone) {
				pdf.text(`Phone: ${data.customerPhone}`, 20, yPosition);
			}
		}
	}
	pdf.setTextColor(0, 0, 0);

	// Footer
	yPosition = pageHeight - 15;
	pdf.setFont('helvetica', 'italic');
	pdf.setFontSize(7);
	pdf.text('Thank you for your patronage!', pageWidth / 2, yPosition, {
		align: 'center',
	});

	// Save PDF
	pdf.save(`Receipt-${data.transactionId}.pdf`);
}

export async function generateImageReceipt(
	htmlElement: HTMLElement,
): Promise<Blob | null> {
	try {
		const canvas = await html2canvas(htmlElement, {
			backgroundColor: '#ffffff',
			scale: 2,
		});

		return new Promise((resolve) => {
			canvas.toBlob((blob) => {
				resolve(blob);
			}, 'image/png');
		});
	} catch (error) {
		console.error('Error generating receipt image:', error);
		return null;
	}
}

export async function shareReceiptWhatsApp(
	receiptUrl: string,
	customerPhone: string,
): Promise<void> {
	const message = `Receipt: ${receiptUrl}`;
	const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
	window.open(whatsappUrl, '_blank');
}

export async function shareReceiptEmail(
	receiptUrl: string,
	email: string,
	transactionId: string,
): Promise<void> {
	const subject = `Your Receipt - Transaction ${transactionId}`;
	const body = `Please find attached your receipt for transaction ${transactionId}.\n\nReceipt URL: ${receiptUrl}`;
	const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	window.location.href = mailtoUrl;
}
