import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createStoreToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
	try {
		// Only allow in development
		if (process.env.NODE_ENV === 'production') {
			return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
		}

		const body = await request.json().catch(() => ({}));
		const email = body?.email || 'admin@local';
		const password = body?.password || 'password';
		const businessName = body?.businessName || 'Local Admin';

		// Check existing
		const existing = await prisma.store.findUnique({ where: { email } });
		if (existing) {
			const token = createStoreToken(existing.id, existing.email);
			return NextResponse.json({ ok: true, token }, { status: 200 });
		}

		const passwordHash = await hashPassword(password);
		const store = await prisma.store.create({
			data: {
				email,
				passwordHash,
				businessName,
				currency: 'NGN',
				setupCompleted: true,
			},
			select: { id: true, email: true },
		});

		const token = createStoreToken(store.id, store.email);
		return NextResponse.json({ ok: true, token }, { status: 201 });
	} catch (err) {
		console.error('Dev create-admin failed', err);
		return NextResponse.json({ error: 'Failed' }, { status: 500 });
	}
}
