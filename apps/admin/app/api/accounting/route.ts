import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const period = searchParams.get('period') || 'daily';
		const date = new Date(searchParams.get('date') || new Date());

		let startDate: Date;
		let endDate: Date = new Date();

		// Calculate date range
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

		// Get store ID from header
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Store ID is required' },
				{ status: 401 },
			);
		}

		// Get all sales items for the period
		const saleItems = await prisma.saleItem.findMany({
			where: {
				sale: {
					storeId: storeId,
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
				},
			},
			include: {
				product: true,
				sale: true,
			},
		});

		// Get summary totals
		const sales = await prisma.sale.findMany({
			where: {
				storeId: storeId,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
		});

		const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
		const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
		const totalProfit = totalRevenue - totalCost;
		const profitMargin =
			totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

		// Analyze products
		const productMap = new Map<
			string,
			{
				id: string;
				name: string;
				quantitySold: number;
				revenue: number;
				cost: number;
				profit: number;
			}
		>();

		saleItems.forEach((item) => {
			const key = item.product.id;
			const current = productMap.get(key) || {
				id: item.product.id,
				name: item.product.name,
				quantitySold: 0,
				revenue: 0,
				cost: 0,
				profit: 0,
			};

			// Calculate item cost and revenue from SaleItem
			const itemRevenue = item.totalPrice;
			const itemCost = item.costPrice * item.quantity;
			const itemProfit = itemRevenue - itemCost;

			productMap.set(key, {
				...current,
				quantitySold: current.quantitySold + item.quantity,
				revenue: current.revenue + itemRevenue,
				cost: current.cost + itemCost,
				profit: current.profit + itemProfit,
			});
		});

		// Convert map to array and sort
		const products = Array.from(productMap.values());

		// Most sold - top 5 by quantity
		const mostSold = products
			.sort((a, b) => b.quantitySold - a.quantitySold)
			.slice(0, 5)
			.map((p) => ({
				name: p.name,
				quantitySold: p.quantitySold,
				revenue: p.revenue,
			}));

		// Highest profiting - top 5 by profit
		const highestProfit = products
			.sort((a, b) => b.profit - a.profit)
			.slice(0, 5)
			.map((p) => ({
				name: p.name,
				profit: p.profit,
				marginPercent: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
			}));

		// Lowest sold - bottom 5 by quantity
		const lowestSold = products
			.sort((a, b) => a.quantitySold - b.quantitySold)
			.slice(0, 5)
			.map((p) => ({
				name: p.name,
				quantitySold: p.quantitySold,
				revenue: p.revenue,
			}));

		// Lowest profiting - bottom 5 by profit
		const lowestProfit = products
			.sort((a, b) => a.profit - b.profit)
			.slice(0, 5)
			.map((p) => ({
				name: p.name,
				profit: p.profit,
				marginPercent: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
			}));

		// Get current inventory capital
		const currentProducts = await prisma.product.findMany({
			where: {
				storeId: storeId,
			},
			orderBy: { name: 'asc' },
		});

		const inventoryData = currentProducts.map((product) => ({
			id: product.id,
			name: product.name,
			brand: product.brand,
			category: product.category,
			quantity: product.quantity,
			costPrice: product.costPrice,
			totalCapital: product.quantity * product.costPrice,
		}));

		const totalInventoryCapital = inventoryData.reduce(
			(sum, item) => sum + item.totalCapital,
			0,
		);

		return NextResponse.json({
			period,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			summary: {
				totalRevenue,
				totalCost,
				totalProfit,
				profitMargin: parseFloat(profitMargin.toFixed(2)),
				totalTransactions: sales.length,
			},
			productAnalysis: {
				mostSold,
				highestProfit,
				lowestSold,
				lowestProfit,
			},
			inventory: {
				products: inventoryData,
				totalCapital: totalInventoryCapital,
				totalProducts: currentProducts.length,
			},
		});
	} catch (error) {
		console.error('Error fetching accounting data:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to fetch accounting data' },
			{ status: 500 },
		);
	}
}
