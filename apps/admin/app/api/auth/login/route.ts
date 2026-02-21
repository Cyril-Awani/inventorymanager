import { prisma } from '@/lib/prisma';
import { verifyPassword, createStoreToken } from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		// Validate inputs
		if (!email || typeof email !== 'string') {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		if (!password || typeof password !== 'string') {
			return NextResponse.json(
				{ error: 'Password is required' },
				{ status: 400 },
			);
		}

		// Find store by email
		const store = await prisma.store.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				businessName: true,
				currency: true,
				setupCompleted: true,
				passwordHash: true,
			},
		});

		if (!store) {
			return NextResponse.json({ error: 'Email not found' }, { status: 401 });
		}

		// Verify password
		const validPassword = await verifyPassword(password, store.passwordHash!);
		if (!validPassword) {
			return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
		}

		// Create token
		const token = createStoreToken(store.id, store.email);

		return NextResponse.json(
			{
				success: true,
				token,
				store: {
					id: store.id,
					email: store.email,
					businessName: store.businessName,
					currency: store.currency,
					setupCompleted: store.setupCompleted,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error('Login error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json({ error: 'Login failed' }, { status: 500 });
	}
}
