import { prisma } from '@/lib/prisma';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

const STORE_ID = 'default-store';

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;
		const product = await prisma.product.findUnique({
			where: { id },
		});

		if (!product || product.storeId !== STORE_ID) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 });
		}

		return NextResponse.json(product);
	} catch (error) {
		console.error('Error fetching product:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to fetch product' },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;
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

		const product = await prisma.product.update({
			where: { id },
			data: {
				...(name && { name }),
				...(brand && { brand }),
				...(category && { category }),
				...(costPrice !== undefined && { costPrice }),
				...(sellingPrice !== undefined && { sellingPrice }),
				...(quantity !== undefined && { quantity }),
				...(image !== undefined && { image }),
				...(unitName !== undefined && { unitName }),
				...(unitsPerBulk !== undefined && {
					unitsPerBulk: unitsPerBulk == null ? null : Number(unitsPerBulk),
				}),
				...(bulkSellingPrice !== undefined && {
					bulkSellingPrice:
						bulkSellingPrice == null ? null : Number(bulkSellingPrice),
				}),
				...(bulkUnitName !== undefined && { bulkUnitName }),
			},
		});

		return NextResponse.json(product);
	} catch (error) {
		console.error('Error updating product:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to update product' },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const { id } = params;

		// Check if product exists and belongs to store
		const product = await prisma.product.findUnique({
			where: { id },
			select: { storeId: true },
		});

		if (!product || product.storeId !== STORE_ID) {
			return NextResponse.json({ error: 'Product not found' }, { status: 404 });
		}

		await prisma.product.delete({
			where: { id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting product:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Failed to delete product' },
			{ status: 500 },
		);
	}
}
