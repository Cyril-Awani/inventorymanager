import bcrypt from 'bcryptjs';
import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const SALT_ROUNDS = 10;

function getSecret(): string {
	const secret =
		process.env.AUTH_SECRET || process.env.DATABASE_URL || 'pures-pos-secret';
	return secret;
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export interface AuthToken {
	storeId: string;
	email: string;
	exp: number;
}

export function createStoreToken(storeId: string, email: string): string {
	const payload: AuthToken = {
		storeId,
		email,
		exp: Date.now() + TOKEN_EXPIRY_MS,
	};
	const payloadStr = JSON.stringify(payload);
	const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
	const signature = createHmac('sha256', getSecret())
		.update(payloadB64)
		.digest('base64url');
	return `${payloadB64}.${signature}`;
}

export function verifyStoreToken(token: string): AuthToken | null {
	try {
		const [payloadB64, signature] = token.split('.');
		if (!payloadB64 || !signature) return null;
		const expectedSig = createHmac('sha256', getSecret())
			.update(payloadB64)
			.digest('base64url');
		if (
			signature.length !== expectedSig.length ||
			!timingSafeEqual(
				Buffer.from(signature, 'utf8'),
				Buffer.from(expectedSig, 'utf8'),
			)
		)
			return null;
		const payload: AuthToken = JSON.parse(
			Buffer.from(payloadB64, 'base64url').toString('utf8'),
		);
		if (payload.exp < Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
}

export function getStoreTokenFromRequest(request: Request): string | null {
	const auth = request.headers.get('authorization');
	if (!auth?.startsWith('Bearer ')) return null;
	return auth.slice(7).trim() || null;
}

// Backward compatibility
export function getKeeperTokenFromRequest(request: Request): string | null {
	return getStoreTokenFromRequest(request);
}

export function getStoreIdFromToken(token: string): string | null {
	const payload = verifyStoreToken(token);
	return payload?.storeId || null;
}

// Keeper authentication (worker PIN) - for backward compatibility if needed
const KEEPER_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function createKeeperToken(): string {
	const payload = {
		role: 'keeper',
		exp: Date.now() + KEEPER_TOKEN_EXPIRY_MS,
	};
	const payloadStr = JSON.stringify(payload);
	const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');
	const signature = createHmac('sha256', getSecret())
		.update(payloadB64)
		.digest('base64url');
	return `${payloadB64}.${signature}`;
}

export function verifyKeeperToken(token: string): boolean {
	try {
		const [payloadB64, signature] = token.split('.');
		if (!payloadB64 || !signature) return false;
		const expectedSig = createHmac('sha256', getSecret())
			.update(payloadB64)
			.digest('base64url');
		if (
			signature.length !== expectedSig.length ||
			!timingSafeEqual(
				Buffer.from(signature, 'utf8'),
				Buffer.from(expectedSig, 'utf8'),
			)
		)
			return false;
		const payload = JSON.parse(
			Buffer.from(payloadB64, 'base64url').toString('utf8'),
		);
		if (payload.role !== 'keeper' || payload.exp < Date.now()) return false;
		return true;
	} catch {
		return false;
	}
}
