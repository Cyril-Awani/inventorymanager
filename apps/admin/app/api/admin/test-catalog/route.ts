import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Test endpoint to verify catalog data exists
 * No auth required - for debugging only
 */
export async function GET(request: NextRequest) {
	try {
		const storeTypeDefs = await prisma.storeTypeDef.findMany();
		const catalogItems = await prisma.catalogItem.findMany({
			take: 100,
		});

		// Group items by store type
		const byStoreType: Record<string, number> = {};
		catalogItems.forEach((item) => {
			byStoreType[item.storeTypeId] = (byStoreType[item.storeTypeId] || 0) + 1;
		});

		return NextResponse.json({
			storeTypesCount: storeTypeDefs.length,
		storeTypes: storeTypeDefs.map((st) => ({
			id: st.id,
			key: st.key,
			label: st.label,
		})),
		catalogItemsCount: catalogItems.length,
		catalogByStoreType: byStoreType,
		sampleEateryItems: catalogItems
			.filter((it) =>
				storeTypeDefs.find((def) => def.key === 'EATERY' && def.id === it.storeTypeId),
			)
			.slice(0, 5)
			.map((it) => ({
				id: it.id,
				name: it.name,
				storeTypeId: it.storeTypeId,
			})),
		});
	} catch (err) {
		console.error('Test endpoint error:', err);
		return NextResponse.json({ error: String(err) }, { status: 500 });
	}
}
