import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Search catalog items by name and brand for onboarding recommendations
 * Used for product form auto-fill
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const name = searchParams.get('name')?.trim() || '';
		const brand = searchParams.get('brand')?.trim() || '';

		// If both name and brand are provided, search for exact match first
		if (name && brand) {
			const exactMatch = await prisma.catalogItem.findFirst({
				where: {
					name: { contains: name, mode: 'insensitive' },
					brand: { contains: brand, mode: 'insensitive' },
				},
				select: {
					id: true,
					name: true,
					brand: true,
					category: true,
					costPrice: true,
					sellingPrice: true,
					unitName: true,
					unitsPerBulk: true,
					bulkSellingPrice: true,
					bulkUnitName: true,
					image: true,
				},
			});

			if (exactMatch) {
				return NextResponse.json({
					matches: [exactMatch],
					success: true,
				});
			}
		}

		// Search by name alone if provided
		if (name) {
			const byName = await prisma.catalogItem.findMany({
				where: {
					name: { contains: name, mode: 'insensitive' },
				},
				select: {
					id: true,
					name: true,
					brand: true,
					category: true,
					costPrice: true,
					sellingPrice: true,
					unitName: true,
					unitsPerBulk: true,
					bulkSellingPrice: true,
					bulkUnitName: true,
					image: true,
				},
				take: 10,
			});

			return NextResponse.json({
				matches: byName,
				success: true,
			});
		}

		// Search by brand alone if provided
		if (brand) {
			const byBrand = await prisma.catalogItem.findMany({
				where: {
					brand: { contains: brand, mode: 'insensitive' },
				},
				select: {
					id: true,
					name: true,
					brand: true,
					category: true,
					costPrice: true,
					sellingPrice: true,
					unitName: true,
					unitsPerBulk: true,
					bulkSellingPrice: true,
					bulkUnitName: true,
					image: true,
				},
				take: 10,
			});

			return NextResponse.json({
				matches: byBrand,
				success: true,
			});
		}

		return NextResponse.json({
			matches: [],
			success: true,
		});
	} catch (error) {
		console.error('Error searching catalog items:', error);
		return NextResponse.json(
			{ error: 'Failed to search catalog', success: false },
			{ status: 500 },
		);
	}
}
