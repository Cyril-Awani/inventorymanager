import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStoreTokenFromRequest, verifyStoreToken } from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';

export async function GET(request: NextRequest) {
	try {
		const token = getStoreTokenFromRequest(request);
		if (!token) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const payload = verifyStoreToken(token);
		if (!payload) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
		}

		const store = await prisma.store.findUnique({
			where: { id: payload.storeId },
			select: {
				id: true,
				email: true,
				businessName: true,
					storeType: true,
				currency: true,
				setupCompleted: true,
			},
		});

		if (!store) {
			return NextResponse.json({ error: 'Store not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, store }, { status: 200 });
	} catch (error) {
		console.error('Auth me error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json({ error: 'Failed' }, { status: 500 });
	}
}
