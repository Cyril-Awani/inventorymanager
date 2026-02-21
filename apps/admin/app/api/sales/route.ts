import { prisma } from '@/lib/prisma';
import { generateTransactionId } from '@/lib/transaction';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

interface SaleItemInput {
	productId: string;
	quantity: number;
	unitPrice: number;
	costPrice: number;
	sellByBulk?: boolean;
}

export async function POST(request: NextRequest) {
	try {
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Unauthorized - missing store ID' },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const {
			workerId,
			items,
			amountPaid,
			isPartial,
			paymentMethod = 'cash',
			customerName,
			customerPhone,
		} = body;

		if (!workerId || !items || items.length === 0) {
			return NextResponse.json({ error: 'Invalid sale data' }, { status: 400 });
		}

		// Calculate totals
		let totalPrice = 0;
		let totalCost = 0;

		items.forEach((item: SaleItemInput) => {
			totalPrice += item.unitPrice * item.quantity;
			totalCost += item.costPrice * item.quantity;
		});

		const remainingBalance = totalPrice - (amountPaid || totalPrice);
		const paymentStatus =
			amountPaid >= totalPrice
				? 'completed'
				: isPartial
					? 'partial'
					: 'pending';

		// Create sale with transaction
		const sale = await prisma.sale.create({
			data: {
				transactionId: generateTransactionId(),
				storeId,
				workerId,
				totalPrice,
				totalCost,
				amountPaid: amountPaid || totalPrice,
				remainingBalance: Math.max(0, remainingBalance),
				paymentStatus,
				paymentMethod: paymentMethod || 'cash',
				items: {
					create: items.map((item: SaleItemInput) => ({
						productId: item.productId,
						quantity: item.quantity,
						sellByBulk: item.sellByBulk ?? false,
						unitPrice: item.unitPrice,
						totalPrice: item.unitPrice * item.quantity,
						costPrice: item.costPrice,
					})),
				},
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
				worker: true,
			},
		});

		// Update product quantities (quantity stored in smallest unit)
		for (const item of items) {
			const product = await prisma.product.findUnique({
				where: { id: item.productId },
				select: { unitsPerBulk: true },
			});
			const decrement =
				item.sellByBulk && product?.unitsPerBulk
					? item.quantity * product.unitsPerBulk
					: item.quantity;
			await prisma.product.update({
				where: { id: item.productId },
				data: { quantity: { decrement } },
			});
		}

		// Create credit record if there's a remaining balance
		if (remainingBalance > 0 && customerName) {
			await prisma.credit.create({
				data: {
					customerName,
					phoneNumber: customerPhone || null,
					saleId: sale.id,
					storeId,
					totalOwed: remainingBalance,
					totalPaid: 0,
					remainingBalance: remainingBalance,
					paymentStatus: 'pending',
				},
			});
		}

		return NextResponse.json({ sale }, { status: 201 });
	} catch (error) {
		console.error('Error creating sale:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to create sale' },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const storeId = request.headers.get('x-store-id');
		const { searchParams } = new URL(request.url);

		// Admin access - fetch all sales with pagination
		if (!storeId) {
			const page = parseInt(searchParams.get('page') || '1');
			const limit = parseInt(searchParams.get('limit') || '20');
			const skip = (page - 1) * limit;
			const paymentStatus = searchParams.get('paymentStatus');

			const where: any = {};
			if (paymentStatus) where.paymentStatus = paymentStatus;

			const [sales, total] = await Promise.all([
				prisma.sale.findMany({
					where,
					skip,
					take: limit,
					include: {
						store: {
							select: { businessName: true },
						},
						worker: {
							select: { name: true },
						},
						items: {
							include: {
								product: {
									select: { name: true, brand: true },
								},
							},
						},
					},
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.sale.count({ where }),
			]);

			return NextResponse.json({
				sales,
				pagination: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			});
		}

		// Merchant access - fetch sales for specific store
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		const where: any = { storeId };

		if (startDate && endDate) {
			where.createdAt = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		const sales = await prisma.sale.findMany({
			where,
			include: {
				items: {
					include: {
						product: true,
					},
				},
				worker: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(sales);
	} catch (error) {
		console.error('Error fetching sales:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to fetch sales' },
			{ status: 500 },
		);
	}
}
