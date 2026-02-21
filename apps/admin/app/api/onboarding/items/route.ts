import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const storeTypeKey = searchParams.get('type') as string;

		if (!storeTypeKey) {
			return NextResponse.json(
				{ error: 'Store type parameter is required' },
				{ status: 400 },
			);
		}

		const storeType = await prisma.storeTypeDef.findUnique({
			where: { key: storeTypeKey },
		});
		if (!storeType) {
			return NextResponse.json(
				{ error: 'Invalid store type' },
				{ status: 400 },
			);
		}

		const q = searchParams.get('q')?.trim() || '';

		const where: any = { storeTypeId: storeType.id };
		if (q) {
			where.OR = [
				{ name: { contains: q, mode: 'insensitive' } },
				{ brand: { contains: q, mode: 'insensitive' } },
				{ category: { contains: q, mode: 'insensitive' } },
				{ keywords: { has: q } },
			];
		}

		const items = await prisma.catalogItem.findMany({
			where,
			orderBy: { createdAt: 'asc' },
			take: 200,
		});

		return NextResponse.json({
			storeType: storeTypeKey,
			products: items.map((p) => ({
				id: p.id,
				name: p.name,
				brand: p.brand,
				category: p.category,
				costPrice: p.costPrice,
				sellingPrice: p.sellingPrice,
				unitName: p.unitName,
				unitsPerBulk: p.unitsPerBulk,
				bulkSellingPrice: p.bulkSellingPrice,
				bulkUnitName: p.bulkUnitName,
				image: p.image,
			})),
		});
	} catch (error) {
		console.error('Error fetching items:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch items' },
			{ status: 500 },
		);
	}
}
