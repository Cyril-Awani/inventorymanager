import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		// Extract storeId from request headers (for merchant access)
		const storeId = request.headers.get('x-store-id');
		const { searchParams } = new URL(request.url);

		// Admin access - fetch all workers with pagination
		if (!storeId) {
			const page = parseInt(searchParams.get('page') || '1');
			const limit = parseInt(searchParams.get('limit') || '20');
			const skip = (page - 1) * limit;

			const [workers, total] = await Promise.all([
				prisma.worker.findMany({
					skip,
					take: limit,
					include: {
						store: {
							select: { businessName: true },
						},
						sales: {
							select: {
								totalPrice: true,
							},
						},
					},
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.worker.count(),
			]);

			const workersWithStats = workers.map((worker) => ({
				...worker,
				totalSalesAmount: worker.sales.reduce(
					(sum, sale) => sum + sale.totalPrice,
					0,
				),
				salesCount: worker.sales.length,
			}));

			return NextResponse.json({
				workers: workersWithStats,
				pagination: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			});
		}

		// Merchant access - fetch workers for specific store
		const workers = await prisma.worker.findMany({
			where: { storeId },
			select: {
				id: true,
				name: true,
				createdAt: true,
			},
		});

		return NextResponse.json(workers);
	} catch (error) {
		console.error('Error fetching workers:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse(
				'Database unavailable. Check DATABASE_URL in .env.local and ensure PostgreSQL is running.',
			);
		}
		return NextResponse.json(
			{ error: 'Failed to fetch workers' },
			{ status: 500 },
		);
	}
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
		const { name, pin } = body;

		if (!name || !pin) {
			return NextResponse.json(
				{ error: 'Name and PIN are required' },
				{ status: 400 },
			);
		}

		if (String(pin).length < 4) {
			return NextResponse.json(
				{ error: 'Worker PIN must be at least 4 characters' },
				{ status: 400 },
			);
		}

		const worker = await prisma.worker.create({
			data: {
				name,
				pin, // In production, hash this
				storeId,
			},
			select: {
				id: true,
				name: true,
				createdAt: true,
			},
		});

		return NextResponse.json(worker, { status: 201 });
	} catch (error) {
		console.error('Error creating worker:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to create worker' },
			{ status: 500 },
		);
	}
}
