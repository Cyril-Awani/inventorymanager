import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { amount, workerId } = body;

		if (!amount || amount <= 0) {
			return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
		}

		// Require worker verification (workerId must be provided and valid)
		if (!workerId || typeof workerId !== 'string') {
			return NextResponse.json(
				{ error: 'Worker verification required' },
				{ status: 401 },
			);
		}

		// Get store ID from header
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Store ID is required' },
				{ status: 401 },
			);
		}

		// verify worker exists or is keeper
		if (workerId !== 'keeper') {
			const worker = await prisma.worker.findUnique({
				where: { id: workerId },
			});
			if (!worker) {
				return NextResponse.json({ error: 'Invalid worker' }, { status: 401 });
			}
		}

		// Get current credit and verify it belongs to this store
		const credit = await prisma.credit.findUnique({
			where: { id },
		});

		if (!credit) {
			return NextResponse.json({ error: 'Credit not found' }, { status: 404 });
		}

		if (credit.storeId !== storeId) {
			return NextResponse.json({ error: 'Credit not found' }, { status: 404 });
		}

		// Allow overpayment: apply up to remainingBalance and convert extra to store credit
		const appliedAmount = Math.min(amount, credit.remainingBalance);
		const overpaid = amount - appliedAmount;

		const payment = await prisma.creditPayment.create({
			data: {
				creditId: id,
				amount: appliedAmount,
			},
		});

		// Update credit
		const newTotalPaid = credit.totalPaid + appliedAmount;
		const newRemainingBalance = credit.totalOwed - newTotalPaid;
		const newPaymentStatus = newRemainingBalance <= 0 ? 'paid' : 'partial';

		const updatedCredit = await prisma.credit.update({
			where: { id },
			data: {
				totalPaid: newTotalPaid,
				remainingBalance: Math.max(0, newRemainingBalance),
				paymentStatus: newPaymentStatus,
			},
			include: { payments: true },
		});

		let storeCredit = null;
		if (overpaid > 0) {
			// Create a simple store credit record: totalOwed=0, totalPaid=overpaid
			storeCredit = await prisma.credit.create({
				data: {
					customerName: credit.customerName + ' (Store credit)',
					phoneNumber: credit.phoneNumber,
					saleId: null,
					totalOwed: 0,
					totalPaid: overpaid,
					remainingBalance: 0,
					isStoreCredit: true,
					paymentStatus: 'paid',
					storeId: credit.storeId,
				},
			});
		}

		return NextResponse.json(
			{ payment, credit: updatedCredit, storeCredit },
			{ status: 201 },
		);
	} catch (error) {
		console.error('Error processing credit payment:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to process payment' },
			{ status: 500 },
		);
	}
}
