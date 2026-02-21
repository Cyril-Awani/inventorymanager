import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { pin } = body;

		if (!pin || typeof pin !== 'string' || pin.length < 1) {
			return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
		}

		// Get store ID from header
		const storeId = request.headers.get('x-store-id');
		if (!storeId) {
			return NextResponse.json(
				{ error: 'Store ID is required' },
				{ status: 401 },
			);
		}

		// Try to find a worker with this PIN
		const worker = await prisma.worker.findUnique({
			where: {
				storeId_pin: {
					storeId: storeId,
					pin: pin,
				},
			},
			select: {
				id: true,
				name: true,
			},
		});

		if (worker) {
			return NextResponse.json({
				success: true,
				workerId: worker.id,
				workerName: worker.name,
				type: 'worker',
			});
		}

		// If not a worker PIN, try storekeeper password
		const store = await prisma.store.findUnique({
			where: { id: storeId },
			select: { keeperPasswordHash: true },
		});

		if (!store) {
			return NextResponse.json({ error: 'Store not found' }, { status: 404 });
		}

		if (store.keeperPasswordHash === null) {
			return NextResponse.json(
				{
					error: 'No transaction approval PIN set up',
					code: 'NO_PIN_SETUP',
				},
				{ status: 401 },
			);
		}

		const isValidKeeperPassword = await verifyPassword(
			pin,
			store.keeperPasswordHash,
		);
		if (isValidKeeperPassword) {
			return NextResponse.json({
				success: true,
				workerId: 'keeper',
				workerName: 'Store Keeper',
				type: 'keeper',
			});
		}

		// Neither worker PIN nor storekeeper password matched
		return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
	} catch (error) {
		console.error('PIN verification error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json(
			{ error: 'Authentication failed' },
			{ status: 500 },
		);
	}
}
