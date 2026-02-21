import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const types = await prisma.storeTypeDef.findMany({
			orderBy: { key: 'asc' },
		});
		return NextResponse.json({
			storeTypes: types.map((t) => ({
				id: t.key,
				label: t.label,
				icon: t.icon,
			})),
		});
	} catch (error) {
		console.error('Error fetching store types:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch store types' },
			{ status: 500 },
		);
	}
}
