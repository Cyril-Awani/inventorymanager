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
		const limit = parseInt(searchParams.get('limit') || '20');
		const skip = (page - 1) * limit;
		const paymentStatus = searchParams.get('paymentStatus');

		const where: any = {};
		if (paymentStatus) where.paymentStatus = paymentStatus;

		const [credits, total] = await Promise.all([
			prisma.credit.findMany({
				where,
				skip,
				take: limit,
				include: {
					store: {
						select: { businessName: true },
					},
					sale: {
						select: { transactionId: true },
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
			prisma.credit.count({ where }),
		]);

		return NextResponse.json({
			credits,
			pagination: {
				total,
				page,
				limit,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error('Failed to fetch credits:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to fetch credits' },
			{ status: 500 },
		);
	}
}
