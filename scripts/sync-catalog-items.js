#!/usr/bin/env node
/**
 * Script to sync catalog items with store type definitions
 * Run this to ensure all products are properly linked to their store types
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
	console.log('Starting catalog sync...\n');

	// Step 1: Ensure all StoreTypeDef records exist with correct keys
	const storeTypes = [
		{ id: 'EATERY', label: 'Eatery', icon: '🍔' },
		{ id: 'COSMETICS', label: 'Cosmetics', icon: '💄' },
		{ id: 'GROCERY', label: 'Grocery', icon: '🥬' },
		{ id: 'PROVISIONS', label: 'Provisions/General Store', icon: '🛍️' },
		{ id: 'PHARMACY', label: 'Pharmacy', icon: '💊' },
		{ id: 'FASHION', label: 'Fashion/Clothing', icon: '👕' },
		{ id: 'ELECTRONICS', label: 'Electronics', icon: '📱' },
		{ id: 'BAKERY', label: 'Bakery', icon: '🥐' },
		{ id: 'BOOKSTORE', label: 'Bookstore', icon: '📚' },
		{ id: 'STATIONERY', label: 'Stationery', icon: '✏️' },
		{ id: 'BEVERAGES', label: 'Beverages', icon: '🥤' },
		{ id: 'GARDEN', label: 'Garden', icon: '🌿' },
		{ id: 'HOME', label: 'Home & Living', icon: '🏠' },
		{ id: 'TOYS', label: 'Toys', icon: '🧸' },
	];

	console.log('📌 Creating/updating StoreTypeDef records...');
	const storeTypeDefMap = {};

	for (const st of storeTypes) {
		const def = await prisma.storeTypeDef.upsert({
			where: { key: st.id },
			update: { label: st.label, icon: st.icon },
			create: { key: st.id, label: st.label, icon: st.icon },
		});
		storeTypeDefMap[st.id] = def.id;
		console.log(`  ✓ ${st.id} (${st.label}): ${def.id}`);
	}

	// Step 2: Check existing catalog items
	console.log('\n📊 Checking existing catalog items...');
	const catalogCount = await prisma.catalogItem.count();
	console.log(`  Total CatalogItems in database: ${catalogCount}`);

	// Step 3: List items by store type
	console.log('\n📋 CatalogItems by StoreType:');
	for (const st of storeTypes) {
		const count = await prisma.catalogItem.count({
			where: { storeType: { key: st.id } },
		});
		if (count > 0) {
			console.log(`  ${st.id}: ${count} items`);
		}
	}

	console.log('\n✅ Sync complete!');
	console.log(
		'\nIf you still see "No catalog items for this store type", you need to:',
	);
	console.log(
		'1. POST to /api/admin/recommendations to populate catalog items, OR',
	);
	console.log('2. Manually add items using the recommendations page form');
}

main()
	.catch((e) => {
		console.error('❌ Error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
