import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const days = parseInt(searchParams.get('days') || '30');
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Fetch all data in parallel
		const [
			storesCount,
			totalStores,
			salesCount,
			totalRevenue,
			totalCosts,
			activeWorkers,
			pendingCredits,
			topWorkers,
			recentSales,
		] = await Promise.all([
			prisma.sale.count({
				where: {
					createdAt: {
						gte: startDate,
					},
				},
			}),
			prisma.store.count(),
			prisma.sale.count(),
			prisma.sale.aggregate({
				_sum: {
					totalPrice: true,
				},
				where: {
					createdAt: {
						gte: startDate,
					},
				},
			}),
			prisma.sale.aggregate({
				_sum: {
					totalCost: true,
				},
				where: {
					createdAt: {
						gte: startDate,
					},
				},
			}),
			prisma.worker.count(),
			prisma.credit.aggregate({
				_sum: {
					remainingBalance: true,
				},
				where: {
					paymentStatus: 'pending',
				},
			}),
			prisma.worker.findMany({
				take: 5,
				include: {
					sales: {
						where: {
							createdAt: {
								gte: startDate,
							},
						},
						select: {
							totalPrice: true,
						},
					},
				},
				orderBy: {
					sales: {
						_count: 'desc',
					},
				},
			}),
			prisma.sale.findMany({
				take: 10,
				include: {
					store: {
						select: { businessName: true },
					},
					worker: {
						select: { name: true },
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			}),
		]);

		const topWorkersWithStats = topWorkers.map((worker) => ({
			id: worker.id,
			name: worker.name,
			salesCount: worker.sales.length,
			totalAmount: worker.sales.reduce((sum, sale) => sum + sale.totalPrice, 0),
		}));

		const profit =
			(totalRevenue._sum.totalPrice || 0) - (totalCosts._sum.totalCost || 0);

		return NextResponse.json({
			summary: {
				totalStores,
				totalSales: salesCount,
				recentSales: storesCount,
				activeWorkers,
				totalRevenue: totalRevenue._sum.totalPrice || 0,
				totalCosts: totalCosts._sum.totalCost || 0,
				profit,
				pendingCredits: pendingCredits._sum.remainingBalance || 0,
			},
			topWorkers: topWorkersWithStats,
			recentSales: recentSales.map((sale) => ({
				id: sale.id,
				transactionId: sale.transactionId,
				storeName: sale.store.businessName,
				workerName: sale.worker.name,
				totalPrice: sale.totalPrice,
				createdAt: sale.createdAt,
			})),
		});
	} catch (error) {
		console.error('Failed to fetch analytics:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		return NextResponse.json(
			{ error: 'Failed to fetch analytics' },
			{ status: 500 },
		);
	}
}
