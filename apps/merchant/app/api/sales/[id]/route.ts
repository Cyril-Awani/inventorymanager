import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

const STORE_ID = 'default-store';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const sale = await prisma.sale.findUnique({
			where: { id },
			include: {
				items: {
					include: {
						product: true,
					},
				},
				worker: true,
				credits: true,
				salePayments: true,
			},
		});

		if (!sale || sale.storeId !== STORE_ID) {
			return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
		}

		return NextResponse.json(sale);
	} catch (error) {
		console.error('Error fetching sale:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to fetch sale' },
			{ status: 500 },
		);
	}
}
