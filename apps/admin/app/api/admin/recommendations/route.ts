import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
	STORE_TYPES,
	PRODUCTS_BY_STORE_TYPE,
} from '@/lib/store-recommendations';
import { getStoreTokenFromRequest, verifyStoreToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
	try {
		// Require a valid store token (admin/merchant) to call this endpoint
		const token = getStoreTokenFromRequest(request as Request);
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const payload = verifyStoreToken(token);
		if (!payload) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		const body = await request.json().catch(() => null);

		// If client is sending a createMany payload, use it
		if (body && body.action === 'createMany') {
			const { storeTypeKey, storeTypeLabel, items } = body as {
				storeTypeKey: string;
				storeTypeLabel?: string;
				items: any[];
			};

			if (!storeTypeKey || !Array.isArray(items) || items.length === 0) {
				return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
			}

			const def = await prisma.storeTypeDef.upsert({
				where: { key: storeTypeKey },
				update: { label: storeTypeLabel ?? storeTypeKey },
				create: { key: storeTypeKey, label: storeTypeLabel ?? storeTypeKey },
			});

			const createData = items.map((p: any) => ({
				storeTypeId: def.id,
				name: p.name,
				brand: p.brand ?? 'Generic',
				category: p.category ?? 'Misc',
				costPrice: p.costPrice ?? 0,
				sellingPrice: p.sellingPrice ?? p.costPrice ?? 0,
				unitName: p.unitName ?? 'Piece',
				unitsPerBulk: p.unitsPerBulk ?? null,
				bulkSellingPrice: p.bulkSellingPrice ?? null,
				bulkUnitName: p.bulkUnitName ?? null,
				image: p.image ?? null,
				description: p.description ?? null,
				keywords: p.keywords ?? [],
			}));

			// createMany for performance; fallback to loop if needed
			if (createData.length)
				await prisma.catalogItem.createMany({ data: createData });

			return NextResponse.json({ ok: true });
		}

		// Default: seed from in-repo constants (legacy import)
		for (const st of STORE_TYPES) {
			const key = st.id;
			const def = await prisma.storeTypeDef.upsert({
				where: { key },
				update: { label: st.label, icon: st.icon ?? null },
				create: { key, label: st.label, icon: st.icon ?? null },
			});

			// remove existing catalog items for this store type (we'll recreate)
			await prisma.catalogItem.deleteMany({ where: { storeTypeId: def.id } });

			const items = (PRODUCTS_BY_STORE_TYPE as any)[key] || [];
			const createData = items.map((p: any) => ({
				storeTypeId: def.id,
				name: p.name,
				brand: p.brand ?? 'Generic',
				category: p.category ?? 'Misc',
				costPrice: p.costPrice ?? 0,
				sellingPrice: p.sellingPrice ?? p.costPrice ?? 0,
				unitName: p.unitName ?? 'Piece',
				unitsPerBulk: p.unitsPerBulk ?? null,
				bulkSellingPrice: p.bulkSellingPrice ?? null,
				bulkUnitName: p.bulkUnitName ?? null,
				image: p.image ?? null,
				description: p.description ?? null,
				keywords: p.keywords ?? [],
			}));

			if (createData.length)
				await prisma.catalogItem.createMany({ data: createData });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('Failed to populate recommendations:', error);
		return NextResponse.json(
			{ error: 'Failed to populate recommendations' },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		// Require auth
		const token = getStoreTokenFromRequest(request as Request);
		if (!token)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const payload = verifyStoreToken(token);
		if (!payload)
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

		const url = new URL(request.url);
		const storeTypeKey = url.searchParams.get('storeTypeKey');
		if (!storeTypeKey)
			return NextResponse.json(
				{ error: 'storeTypeKey required' },
				{ status: 400 },
			);

		const def = await prisma.storeTypeDef.findUnique({
			where: { key: storeTypeKey },
		});
		if (!def) return NextResponse.json({ items: [], storeType: null });

		const items = await prisma.catalogItem.findMany({
			where: { storeTypeId: def.id },
			orderBy: { name: 'asc' },
		});
		return NextResponse.json({ items, storeType: def });
	} catch (err) {
		console.error('Failed to fetch catalog items', err);
		return NextResponse.json({ error: 'Failed' }, { status: 500 });
	}
}
