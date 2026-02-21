import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const storeTypeId = searchParams.get('storeTypeId');

		let where: any = {};

		if (storeTypeId) {
			where.storeTypeId = storeTypeId;
		}

		const catalogItems = await prisma.catalogItem.findMany({
			where,
			include: {
				storeType: {
					select: {
						id: true,
						label: true,
						key: true,
					},
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return NextResponse.json({
			catalogItems,
		});
	} catch (error) {
		console.error('Failed to fetch catalog items:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch catalog items',
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const {
			storeTypeId,
			name,
			brand,
			category,
			costPrice,
			sellingPrice,
			unitName,
			unitsPerBulk,
			bulkSellingPrice,
			bulkUnitName,
			image,
			description,
			keywords,
		} = body;

		// Validate required fields
		if (
			!storeTypeId ||
			!name ||
			!brand ||
			!category ||
			costPrice === undefined ||
			sellingPrice === undefined ||
			!unitName
		) {
			return NextResponse.json(
				{
					error: 'Missing required fields',
				},
				{ status: 400 },
			);
		}

		const catalogItem = await prisma.catalogItem.create({
			data: {
				storeTypeId,
				name,
				brand,
				category,
				costPrice,
				sellingPrice,
				unitName,
				unitsPerBulk: unitsPerBulk || null,
				bulkSellingPrice: bulkSellingPrice || null,
				bulkUnitName: bulkUnitName || null,
				image: image || null,
				description: description || null,
				keywords: keywords || [],
			},
			include: {
				storeType: {
					select: {
						id: true,
						label: true,
						key: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			catalogItem,
		});
	} catch (error) {
		console.error('Failed to create catalog item:', error);
		return NextResponse.json(
			{
				error: 'Failed to create catalog item',
			},
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { id, ...updateData } = body;

		if (!id) {
			return NextResponse.json(
				{
					error: 'Item ID is required',
				},
				{ status: 400 },
			);
		}

		// Parse numeric fields
		if (updateData.costPrice)
			updateData.costPrice = parseFloat(updateData.costPrice);
		if (updateData.sellingPrice)
			updateData.sellingPrice = parseFloat(updateData.sellingPrice);
		if (updateData.unitsPerBulk)
			updateData.unitsPerBulk = parseInt(updateData.unitsPerBulk);
		if (updateData.bulkSellingPrice)
			updateData.bulkSellingPrice = parseFloat(updateData.bulkSellingPrice);

		const catalogItem = await prisma.catalogItem.update({
			where: { id },
			data: updateData,
			include: {
				storeType: {
					select: {
						id: true,
						label: true,
						key: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			catalogItem,
		});
	} catch (error) {
		console.error('Failed to update catalog item:', error);
		return NextResponse.json(
			{
				error: 'Failed to update catalog item',
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return NextResponse.json(
				{
					error: 'Item ID is required',
				},
				{ status: 400 },
			);
		}

		await prisma.catalogItem.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: 'Item deleted successfully',
		});
	} catch (error) {
		console.error('Failed to delete catalog item:', error);
		return NextResponse.json(
			{
				error: 'Failed to delete catalog item',
			},
			{ status: 500 },
		);
	}
}
