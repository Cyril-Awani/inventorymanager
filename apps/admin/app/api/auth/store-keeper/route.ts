import { prisma } from '@/lib/prisma';
import {
	verifyPassword,
	createKeeperToken,
	verifyStoreToken,
} from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { password, action = 'verify' } = body;

		// Get Authorization header to identify the store
		const authHeader = request.headers.get('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return NextResponse.json(
				{ error: 'Unauthorized - missing token' },
				{ status: 401 },
			);
		}

		const token = authHeader.slice(7); // Remove 'Bearer ' prefix

		// Verify and decode the token to get store ID
		const authToken = verifyStoreToken(token);
		if (!authToken) {
			return NextResponse.json(
				{ error: 'Invalid or expired token' },
				{ status: 401 },
			);
		}

		const storeId = authToken.storeId;

		// Find store by ID
		const store = await prisma.store.findUnique({
			where: { id: storeId },
			select: {
				id: true,
				email: true,
				businessName: true,
				passwordHash: true,
			},
		});

		if (!store) {
			return NextResponse.json({ error: 'Store not found' }, { status: 404 });
		}

		if (action === 'setup') {
			// Setting up keeper password for the first time
			if (!password || typeof password !== 'string') {
				return NextResponse.json(
					{ error: 'Password is required' },
					{ status: 400 },
				);
			}

			if (password.length < 6) {
				return NextResponse.json(
					{ error: 'Password must be at least 6 characters' },
					{ status: 400 },
				);
			}

			// For new setup, keeper password IS the store password
			// So we just return a token - no password change needed
			const keeperToken = createKeeperToken();

			return NextResponse.json(
				{
					success: true,
					token: keeperToken,
					storeId,
				},
				{ status: 200 },
			);
		}

		// Verify action (default)
		if (!password || typeof password !== 'string') {
			return NextResponse.json(
				{ error: 'Password is required' },
				{ status: 400 },
			);
		}

		// Verify password against store's password hash
		const validPassword = await verifyPassword(password, store.passwordHash!);

		if (!validPassword) {
			return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
		}

		// Password is correct - create keeper token
		const keeperToken = createKeeperToken();

		return NextResponse.json(
			{
				success: true,
				token: keeperToken,
				storeId,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('Store keeper verification error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
	}
}
