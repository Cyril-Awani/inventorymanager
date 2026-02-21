import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const store = await prisma.store.findUnique({
			where: { id: params.id },
			include: {
				products: {
					select: {
						id: true,
						name: true,
						brand: true,
						quantity: true,
						sellingPrice: true,
					},
					take: 10,
				},
				workers: {
					select: {
						id: true,
						name: true,
						createdAt: true,
					},
				},
				sales: {
					select: {
						id: true,
						transactionId: true,
						totalPrice: true,
						createdAt: true,
					},
					orderBy: { createdAt: 'desc' },
					take: 10,
				},
				credits: {
					select: {
						id: true,
						customerName: true,
						totalOwed: true,
						paymentStatus: true,
					},
					take: 10,
				},
			},
		});

		if (!store) {
			return NextResponse.json({ error: 'Store not found' }, { status: 404 });
		}

		return NextResponse.json(store);
	} catch (error) {
		console.error('Failed to fetch store:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to fetch store' },
			{ status: 500 },
		);
	}
}
