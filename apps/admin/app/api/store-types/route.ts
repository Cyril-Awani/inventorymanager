import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const storeTypes = await prisma.storeTypeDef.findMany({
			orderBy: {
				label: 'asc',
			},
		});

		return NextResponse.json({
			storeTypes,
		});
	} catch (error) {
		console.error('Failed to fetch store types:', error);
		return NextResponse.json(
			{
				error: 'Failed to fetch store types',
			},
			{ status: 500 },
		);
	}
}
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { label, key } = body;

		// Validate required fields
		if (!label || !key) {
			return NextResponse.json(
				{
					error: 'Label and key are required',
				},
				{ status: 400 },
			);
		}

		// Check if store type already exists
		const existingStoreType = await prisma.storeTypeDef.findUnique({
			where: { key },
		});

		if (existingStoreType) {
			return NextResponse.json(
				{
					error: 'Store type with this key already exists',
				},
				{ status: 400 },
			);
		}

		// Create new store type
		const newStoreType = await prisma.storeTypeDef.create({
			data: {
				label,
				key,
			},
		});

		return NextResponse.json(newStoreType, { status: 201 });
	} catch (error) {
		console.error('Failed to create store type:', error);
		return NextResponse.json(
			{
				error: 'Failed to create store type',
			},
			{ status: 500 },
		);
	}
}
