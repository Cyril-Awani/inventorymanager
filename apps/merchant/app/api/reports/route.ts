import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly
		const date = new Date(searchParams.get('date') || new Date());

		// Get store ID from header
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Store ID is required' },
				{ status: 401 },
			);
		}

		let startDate: Date;
		let endDate: Date = new Date();

		if (period === 'daily') {
			startDate = new Date(date);
			startDate.setHours(0, 0, 0, 0);
			endDate = new Date(date);
			endDate.setHours(23, 59, 59, 999);
		} else if (period === 'weekly') {
			startDate = new Date(date);
			startDate.setDate(date.getDate() - date.getDay());
			startDate.setHours(0, 0, 0, 0);
			endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + 6);
			endDate.setHours(23, 59, 59, 999);
		} else if (period === 'monthly') {
			startDate = new Date(date.getFullYear(), date.getMonth(), 1);
			endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			endDate.setHours(23, 59, 59, 999);
		} else {
			return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
		}

		// Get sales data
		const sales = await prisma.sale.findMany({
			where: {
				storeId: storeId,
				createdAt: {
					gte: startDate,
					lte: endDate,
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

		// Calculate totals
		const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
		const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
		const totalProfit = totalRevenue - totalCost;
		const totalTransactions = sales.length;

		// Get low stock items
		const lowStockProducts = await prisma.product.findMany({
			where: {
				storeId: storeId,
				quantity: { lte: 5 },
			},
			orderBy: { quantity: 'asc' },
		});

		// Worker performance
		const workerPerformance = await prisma.sale.findMany({
			where: {
				storeId: storeId,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				worker: true,
			},
		});

		const performanceMap = new Map<
			string,
			{ sales: number; revenue: number }
		>();
		workerPerformance.forEach((sale) => {
			const key = sale.worker.name;
			const current = performanceMap.get(key) || { sales: 0, revenue: 0 };
			performanceMap.set(key, {
				sales: current.sales + 1,
				revenue: current.revenue + sale.totalPrice,
			});
		});

		const workerStats = Array.from(performanceMap.entries()).map(
			([name, data]) => ({
				worker: name,
				...data,
			}),
		);

		return NextResponse.json({
			period,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			summary: {
				totalRevenue,
				totalCost,
				totalProfit,
				totalTransactions,
				averageTransaction:
					totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
			},
			lowStockProducts,
			workerPerformance: workerStats,
			salesData: sales,
		});
	} catch (error) {
		console.error('Error generating report:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to generate report' },
			{ status: 500 },
		);
	}
}
