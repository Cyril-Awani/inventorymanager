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
		// Get storeId from auth token
		const token = getStoreTokenFromRequest(request);
		let storeId: string | null = null;

		if (token) {
			storeId = getStoreIdFromToken(token);
		}

		if (!storeId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get('search');
		const category = searchParams.get('category');
		const limit = parseInt(searchParams.get('limit') || '500', 10);

		const includeZeroStock = searchParams.get('includeZeroStock') === 'true';
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

		// Get count for pagination (optional)
		const [products, count] = await Promise.all([
			prisma.product.findMany({
				where,
				orderBy: { name: 'asc' },
				take: limit,
				select: {
					id: true,
					name: true,
					brand: true,
					category: true,
					costPrice: true,
					sellingPrice: true,
					quantity: true,
					unitName: true,
					unitsPerBulk: true,
					bulkSellingPrice: true,
					bulkUnitName: true,
					image: true,
				},
			}),
			search ? prisma.product.count({ where }) : Promise.resolve(0),
		]);

		return NextResponse.json(products, {
			headers: {
				'Cache-Control': 'private, max-age=60', // Cache for 60 seconds
			},
		});
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

		// Trim whitespace and validate field lengths
		const trimmedName = name?.trim();
		const trimmedBrand = brand?.trim();
		const trimmedCategory = category?.trim();
		const trimmedUnitName = unitName?.trim() ?? 'Piece';

		if (!trimmedName || !trimmedBrand || !trimmedCategory) {
			return NextResponse.json(
				{ error: 'Name, brand, and category cannot be empty' },
				{ status: 400 },
			);
		}

		// Check for identical product (name, brand, category, unitName)
		const existingProduct = await prisma.product.findFirst({
			where: {
				storeId,
				name: { equals: trimmedName, mode: 'insensitive' },
				brand: { equals: trimmedBrand, mode: 'insensitive' },
				category: { equals: trimmedCategory, mode: 'insensitive' },
				unitName: { equals: trimmedUnitName, mode: 'insensitive' },
			},
		});

		if (existingProduct) {
			// Product already exists - update inventory and prices if different
			const costPriceChanged = existingProduct.costPrice !== costPrice;
			const sellingPriceChanged = existingProduct.sellingPrice !== sellingPrice;

			// Create notification message for price changes
			let priceChangeNote = '';
			if (costPriceChanged || sellingPriceChanged) {
				const changes = [];
				if (costPriceChanged) {
					changes.push(
						`Cost: ₦${existingProduct.costPrice.toLocaleString()} → ₦${costPrice.toLocaleString()}`,
					);
				}
				if (sellingPriceChanged) {
					changes.push(
						`Selling: ₦${existingProduct.sellingPrice.toLocaleString()} → ₦${sellingPrice.toLocaleString()}`,
					);
				}
				priceChangeNote = `Price updated. ${changes.join(', ')}`;
			}

			// Update existing product
			const updatedProduct = await prisma.product.update({
				where: { id: existingProduct.id },
				data: {
					quantity: existingProduct.quantity + quantity,
					costPrice: costPriceChanged ? costPrice : existingProduct.costPrice,
					sellingPrice: sellingPriceChanged
						? sellingPrice
						: existingProduct.sellingPrice,
					image:
						image && image !== existingProduct.image
							? image
							: existingProduct.image,
				},
				select: {
					id: true,
					name: true,
					brand: true,
					category: true,
					costPrice: true,
					sellingPrice: true,
					quantity: true,
					unitName: true,
					unitsPerBulk: true,
					bulkSellingPrice: true,
					bulkUnitName: true,
					image: true,
					createdAt: true,
				},
			});

			// Log the restock with price change notes
			await prisma.restock.create({
				data: {
					productId: existingProduct.id,
					storeId,
					quantity,
					costPrice,
					totalCost: quantity * costPrice,
					notes: priceChangeNote
						? `Inventory addition (${quantity} units). ${priceChangeNote}`
						: `Inventory addition (${quantity} units)`,
				},
			});

			return NextResponse.json(
				{
					...updatedProduct,
					message: 'Product inventory updated',
					isDuplicate: true,
					priceChanged: costPriceChanged || sellingPriceChanged,
					priceChangeNote,
				},
				{ status: 200 },
			);
		}

		// Product doesn't exist - create new product
		const newProduct = await prisma.product.create({
			data: {
				name: trimmedName,
				brand: trimmedBrand,
				category: trimmedCategory,
				costPrice,
				sellingPrice,
				quantity,
				image: image || null, // Explicitly set to null if not provided
				unitName: trimmedUnitName,
				unitsPerBulk: unitsPerBulk != null ? Number(unitsPerBulk) : null,
				bulkSellingPrice:
					bulkSellingPrice != null ? Number(bulkSellingPrice) : null,
				bulkUnitName: bulkUnitName ?? null,
				storeId,
			},
			select: {
				id: true,
				name: true,
				brand: true,
				category: true,
				costPrice: true,
				sellingPrice: true,
				quantity: true,
				unitName: true,
				unitsPerBulk: true,
				bulkSellingPrice: true,
				bulkUnitName: true,
				image: true,
				createdAt: true,
			},
		});

		// Log initial restock
		await prisma.restock.create({
			data: {
				productId: newProduct.id,
				storeId,
				quantity,
				costPrice,
				totalCost: quantity * costPrice,
				notes: 'Initial stock',
			},
		});

		return NextResponse.json(
			{
				...newProduct,
				message: 'Product created',
				isDuplicate: false,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		console.error('Error creating/updating product:', error);
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
			{ error: 'Failed to create/update product' },
			{ status: 500 },
		);
	}
}
