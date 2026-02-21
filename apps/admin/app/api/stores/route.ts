import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const search = searchParams.get('search');

		const skip = (page - 1) * limit;

		const where: any = {};
		if (search) {
			where.OR = [
				{ businessName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
			];
		}

		const [stores, total] = await Promise.all([
			prisma.store.findMany({
				where,
				skip,
				take: limit,
				select: {
					id: true,
					email: true,
					businessName: true,
					storeType: true,
					currency: true,
					setupCompleted: true,
					createdAt: true,
					_count: {
						select: {
							products: true,
							workers: true,
							sales: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			prisma.store.count({ where }),
		]);

		return NextResponse.json({
			stores,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Failed to fetch stores:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to fetch stores' },
			{ status: 500 },
		);
	}
}
