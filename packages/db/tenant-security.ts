/**
 * @file tenant-security.ts
 * @description Enforces tenant isolation and prevents cross-merchant data leakage
 * @warning CRITICAL: All queries MUST include tenant filtering through these utilities
 */

// Minimal session shape used by tenant utilities.
// Keep this local to avoid introducing app-specific auth deps.
export interface Session {
	user?: {
		id?: string;
	} | null;
}

/**
 * Validates that the session has a valid merchant ID
 * Should be called before any database query
 */
export function validateTenantSession(session: Session | null): string {
	if (!session?.user?.id) {
		throw new Error('Unauthorized: No valid session');
	}

	// For merchant app: merchantId should be the user's store ID
	// For admin: should verify admin permissions separately
	return session.user.id;
}

/**
 * Creates a safe Prisma where clause that includes tenant filtering
 * ALWAYS use this when querying merchant-specific data
 *
 * @example
 * // ✅ CORRECT - Uses tenant filter
 * const sales = await prisma.sale.findMany({
 *   where: withTenantFilter(session, { status: "completed" }),
 * });
 *
 * // ❌ WRONG - Missing tenant filter (allows data leak!)
 * const sales = await prisma.sale.findMany({
 *   where: { status: "completed" },
 * });
 */
export function withTenantFilter(
	session: Session | null,
	additionalWhere: any = {},
) {
	const tenantId = validateTenantSession(session);

	return {
		...additionalWhere,
		merchantId: tenantId, // ALWAYS filter by current merchant
	};
}

/**
 * Validates that a resource belongs to the current tenant before modification
 * Use before UPDATE or DELETE operations
 */
export async function validateOwnership(
	resourceId: string,
	tenantId: string,
	prismaQuery: any,
): Promise<void> {
	const resource = await prismaQuery;

	if (!resource || resource.merchantId !== tenantId) {
		throw new Error(
			'Forbidden: Cannot modify resource from different merchant',
		);
	}
}

/**
 * List of API routes that MUST enforce tenant filtering
 * Add routes here as they're created - this is a checklist
 */
export const TENANT_PROTECTED_ROUTES = [
	'/api/sales',
	'/api/products',
	'/api/inventory',
	'/api/workers',
	'/api/credits',
];

/**
 * @security CRITICAL RULES
 *
 * 1. Every merchant-facing query MUST include { merchantId: session.user.id }
 * 2. Never trust frontend merchantId - always use session.user.id
 * 3. Always validate resource ownership before modifications
 * 4. Log all admin actions that access merchant data
 * 5. Never expose merchantId in API responses directly
 *
 * @example SECURE PATTERN
 *
 * export async function getSalesForMerchant(session: Session) {
 *   const tenantId = validateTenantSession(session);
 *
 *   return prisma.sale.findMany({
 *     where: {
 *       merchantId: tenantId, // ✅ Always include this
 *     },
 *   });
 * }
 */
