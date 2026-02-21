import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { customerName, phoneNumber, saleId, totalOwed } = body;

		if (!customerName || !totalOwed) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 },
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

		const credit = await prisma.credit.create({
			data: {
				customerName,
				phoneNumber,
				saleId,
				totalOwed,
				totalPaid: 0,
				remainingBalance: totalOwed,
				paymentStatus: 'pending',
				storeId: storeId,
			},
		});

		return NextResponse.json(credit, { status: 201 });
	} catch (error) {
		console.error('Error creating credit:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to create credit' },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status');

		// Get store ID from header
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Store ID is required' },
				{ status: 401 },
			);
		}

		const where: any = { storeId: storeId };
		if (status) {
			where.paymentStatus = status;
		}

		const credits = await prisma.credit.findMany({
			where,
			include: {
				payments: {
					orderBy: { createdAt: 'desc' },
				},
				sale: {
					include: {
						worker: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(credits);
	} catch (error) {
		console.error('Error fetching credits:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to fetch credits' },
			{ status: 500 },
		);
	}
}
