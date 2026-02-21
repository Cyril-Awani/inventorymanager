import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
	getStoreTokenFromRequest,
	getStoreIdFromToken,
	verifyStoreToken,
} from '@/lib/auth';
import { PRODUCTS_BY_STORE_TYPE } from '@/lib/store-recommendations';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';

export async function POST(request: NextRequest) {
	try {
		// Get auth token
		const token = getStoreTokenFromRequest(request);
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const authToken = verifyStoreToken(token);
		if (!authToken) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		const storeId = authToken.storeId;
		const body = await request.json();
		const { storeType, selectedItems = [] } = body;

		if (!storeType) {
			return NextResponse.json(
				{ error: 'Invalid store type' },
				{ status: 400 },
			);
		}

		// Update store with storeType and mark as setupCompleted
		const updatedStore = await prisma.store.update({
			where: { id: storeId },
			data: {
				storeType: storeType as any,
				setupCompleted: true,
			},
			select: {
				id: true,
				email: true,
				businessName: true,
				storeType: true,
				setupCompleted: true,
			},
		});

		// Prefer DB-backed catalog items if available
		const storeTypeDef = await prisma.storeTypeDef.findUnique({
			where: { key: storeType },
		});
		let catalogItems = null;
		if (storeTypeDef) {
			catalogItems = await prisma.catalogItem.findMany({
				where: { storeTypeId: storeTypeDef.id },
				orderBy: { createdAt: 'asc' },
			});
		}

		// If DB catalog exists, use it; otherwise fall back to in-memory recommendations
		const recommendedProducts = catalogItems
			? catalogItems.map((c) => ({
					name: c.name,
					brand: c.brand,
					category: c.category,
					costPrice: c.costPrice,
					sellingPrice: c.sellingPrice,
					unitName: c.unitName,
				}))
			: PRODUCTS_BY_STORE_TYPE[storeType] || [];

		// Determine items to create based on selectedItems
		let itemsToCreate = recommendedProducts;
		if (selectedItems.length > 0) {
			const selectedIndices = new Set<number>();

			for (const s of selectedItems) {
				// numeric indices
				if (typeof s === 'number') {
					selectedIndices.add(s);
					continue;
				}

				if (typeof s === 'string') {
					// If DB-backed and s matches a CatalogItem id, find its index in catalogItems
					if (catalogItems) {
						const foundIdx = catalogItems.findIndex((c) => c.id === s);
						if (foundIdx >= 0) {
							selectedIndices.add(foundIdx);
							continue;
						}
					}

					// Attempt to parse trailing index from id format: `${storeType}-${idx}`
					const parts = s.split('-');
					const last = parts[parts.length - 1];
					const parsed = Number(last);
					if (!Number.isNaN(parsed)) selectedIndices.add(parsed);
				}
			}

			itemsToCreate = recommendedProducts.filter((_, idx) =>
				selectedIndices.has(idx),
			);
		}

		// Create initial inventory with 0 quantity
		const createProductPromises = itemsToCreate.map((product) =>
			prisma.product.create({
				data: {
					name: product.name,
					brand: product.brand,
					category: product.category,
					costPrice: product.costPrice,
					sellingPrice: product.sellingPrice,
					unitName: product.unitName || 'Piece',
					image: (product as any).image || null,
					quantity: 0, // Start with 0 stock
					storeId,
				},
			}),
		);

		const createdProducts = await Promise.all(createProductPromises);

		return NextResponse.json(
			{
				success: true,
				store: updatedStore,
				productsCreated: createdProducts.length,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('Setup error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
	}
}
