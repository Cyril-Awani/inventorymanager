#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const {
	STORE_TYPES,
	PRODUCTS_BY_STORE_TYPE,
} = require('../apps/admin/lib/store-recommendations');

const prisma = new PrismaClient({
	datasourceUrl: process.env.DATABASE_URL,
});

async function seedCatalog() {
	console.log('🌱 Seeding catalog items...\n');

	for (const st of STORE_TYPES) {
		// Find or create the store type def
		let def = await prisma.storeTypeDef.findUnique({
			where: { key: st.id },
		});

		if (!def) {
			console.log(`Creating StoreTypeDef: ${st.id}`);
			def = await prisma.storeTypeDef.create({
				data: {
					key: st.id,
					label: st.label,
					icon: st.icon,
				},
			});
		} else {
			console.log(`Found existing StoreTypeDef: ${st.id}`);
		}

		// Check if items already exist
		const existing = await prisma.catalogItem.count({
			where: { storeTypeId: def.id },
		});

		if (existing > 0) {
			console.log(`  ✅ ${existing} items already exist for ${st.id}`);
			continue;
		}

		// Create items
		const products = PRODUCTS_BY_STORE_TYPE[st.id] || [];
		if (products.length > 0) {
			console.log(`  Adding ${products.length} items for ${st.id}`);
			await prisma.catalogItem.createMany({
				data: products.map((p) => ({
					storeTypeId: def.id,
					name: p.name,
					brand: p.brand || 'Generic',
					category: p.category || 'Misc',
					costPrice: p.costPrice || 0,
					sellingPrice: p.sellingPrice || 0,
					unitName: p.unitName || 'Piece',
					unitsPerBulk: p.unitsPerBulk || null,
					bulkSellingPrice: p.bulkSellingPrice || null,
					bulkUnitName: p.bulkUnitName || null,
					description: p.description || null,
					image: p.image || null,
					keywords: p.keywords || [],
				})),
			});
		}
	}

	const total = await prisma.catalogItem.count();
	console.log(`\n✨ Seeding complete! Total catalog items: ${total}`);
}

seedCatalog()
	.catch((err) => {
		console.error('❌ Seed failed:', err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
