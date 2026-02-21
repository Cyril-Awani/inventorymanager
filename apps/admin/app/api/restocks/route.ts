import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

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
		const { productId, quantity, costPrice, notes } = body;

		if (!productId || !quantity || !costPrice) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 },
			);
		}

		// Create restock record
		const restock = await prisma.restock.create({
			data: {
				productId,
				storeId,
				quantity,
				costPrice,
				totalCost: quantity * costPrice,
				notes,
			},
			include: {
				product: true,
			},
		});

		// Update product quantity
		await prisma.product.update({
			where: { id: productId },
			data: {
				quantity: {
					increment: quantity,
				},
				costPrice, // Update cost price
			},
		});

		return NextResponse.json(restock, { status: 201 });
	} catch (error) {
		console.error('Error creating restock:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to create restock' },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Unauthorized - missing store ID' },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		const where: any = { storeId };

		if (startDate && endDate) {
			where.createdAt = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		const restocks = await prisma.restock.findMany({
			where,
			include: {
				product: true,
			},
			orderBy: { createdAt: 'desc' },
		});

		return NextResponse.json(restocks);
	} catch (error) {
		console.error('Error fetching restocks:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to fetch restocks' },
			{ status: 500 },
		);
	}
}
