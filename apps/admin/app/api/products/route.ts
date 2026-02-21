import { prisma } from '@/lib/prisma';
import {
	getStoreTokenFromRequest,
	getStoreIdFromToken,
	verifyStoreToken,
} from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		// Get storeId from auth token (for merchant access)
		const token = getStoreTokenFromRequest(request);
		let storeId: string | null = null;

		if (token) {
			storeId = getStoreIdFromToken(token);
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get('search');
		const category = searchParams.get('category');
		const includeZeroStock = searchParams.get('includeZeroStock') === 'true';

		// Admin access - fetch all products with pagination
		if (!storeId) {
			const page = parseInt(searchParams.get('page') || '1');
			const limit = parseInt(searchParams.get('limit') || '20');
			const skip = (page - 1) * limit;
			const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

			const where: any = {};
			if (search) {
				where.OR = [
					{ name: { contains: search, mode: 'insensitive' } },
					{ brand: { contains: search, mode: 'insensitive' } },
					{ category: { contains: search, mode: 'insensitive' } },
				];
			}
			if (category) {
				where.category = category;
			}
			if (lowStockOnly) {
				where.quantity = { lte: 10 };
			}

			const [products, total] = await Promise.all([
				prisma.product.findMany({
					where,
					skip,
					take: limit,
					include: {
						store: {
							select: { businessName: true },
						},
					},
					orderBy: {
						createdAt: 'desc',
					},
				}),
				prisma.product.count({ where }),
			]);

			return NextResponse.json({
				products,
				pagination: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			});
		}

		// Merchant access - fetch products for specific store
		const where: any = {
			storeId,
		};
		if (!includeZeroStock) {
			where.quantity = { gt: 0 }; // Hide zero-stock items for POS
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ brand: { contains: search, mode: 'insensitive' } },
				{ category: { contains: search, mode: 'insensitive' } },
			];
		}

		if (category) {
			where.category = category;
		}

		const products = await prisma.product.findMany({
			where,
			orderBy: { name: 'asc' },
		});

		return NextResponse.json(products);
	} catch (error) {
		console.error('Error fetching products:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse(
				'Database unavailable. Check DATABASE_URL in .env.local and ensure PostgreSQL is running.',
			);
		}
		return NextResponse.json(
			{ error: 'Failed to fetch products' },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Get storeId from auth token
		const token = getStoreTokenFromRequest(request);
		const storeId = token ? getStoreIdFromToken(token) : null;

		if (!storeId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const {
			name,
			brand,
			category,
			costPrice,
			sellingPrice,
			quantity,
			image,
			unitName,
			unitsPerBulk,
			bulkSellingPrice,
			bulkUnitName,
		} = body;

		// Validate required fields
		if (
			!name ||
			!brand ||
			!category ||
			costPrice === undefined ||
			sellingPrice === undefined ||
			quantity === undefined
		) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 },
			);
		}

		const product = await prisma.product.create({
			data: {
				name,
				brand,
				category,
				costPrice,
				sellingPrice,
				quantity,
				image,
				unitName: unitName ?? 'Piece',
				unitsPerBulk: unitsPerBulk != null ? Number(unitsPerBulk) : null,
				bulkSellingPrice:
					bulkSellingPrice != null ? Number(bulkSellingPrice) : null,
				bulkUnitName: bulkUnitName ?? null,
				storeId,
			},
		});

		return NextResponse.json(product, { status: 201 });
	} catch (error: any) {
		console.error('Error creating product:', error);
		if (isDatabaseConnectionError(error)) {
			return databaseUnavailableResponse();
		}
		if (error?.code === 'P2002') {
			return NextResponse.json(
				{ error: 'Product already exists' },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ error: 'Failed to create product' },
			{ status: 500 },
		);
	}
}
