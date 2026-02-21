import { prisma } from '@/lib/prisma';
import { hashPassword, createStoreToken } from '@/lib/auth';
import {
	isDatabaseConnectionError,
	databaseUnavailableResponse,
} from '@/lib/db-error';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password, businessName, currency = 'NGN' } = body;

		// Validate inputs
		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return NextResponse.json(
				{ error: 'Valid email is required' },
				{ status: 400 },
			);
		}

		if (!password || typeof password !== 'string' || password.length < 6) {
			return NextResponse.json(
				{ error: 'Password must be at least 6 characters' },
				{ status: 400 },
			);
		}

		if (
			!businessName ||
			typeof businessName !== 'string' ||
			businessName.trim().length < 2
		) {
			return NextResponse.json(
				{ error: 'Business name is required' },
				{ status: 400 },
			);
		}

		// Check if email already exists
		const existingStore = await prisma.store.findUnique({
			where: { email },
		});

		if (existingStore) {
			return NextResponse.json(
				{ error: 'Email already registered' },
				{ status: 409 },
			);
		}

		// Create store
		const passwordHash = await hashPassword(password);
		const store = await prisma.store.create({
			data: {
				email,
				passwordHash,
				businessName: businessName.trim(),
				currency,
				setupCompleted: false,
			},
			select: {
				id: true,
				email: true,
				businessName: true,
				currency: true,
				setupCompleted: true,
			},
		});

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
			{ status: 201 },
		);
	} catch (error) {
		console.error('Signup error:', error);
		if (isDatabaseConnectionError(error)) return databaseUnavailableResponse();
		return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
	}
}
