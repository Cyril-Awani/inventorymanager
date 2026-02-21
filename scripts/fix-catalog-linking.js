const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient({
	datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
	console.log('🔍 Checking database state...\n');

	// Get all StoreTypeDef records
	const storeDefs = await prisma.storeTypeDef.findMany();
	console.log('📋 StoreTypeDef records:');
	storeDefs.forEach((def) => {
		console.log(`  - Key: "${def.key}", ID: ${def.id}, Label: ${def.label}`);
	});

	// Get all CatalogItem records
	const catalogItems = await prisma.catalogItem.findMany();
	console.log(`\n📦 CatalogItem records: ${catalogItems.length} items total`);

	// Group by storeTypeId
	const byStoreType = {};
	catalogItems.forEach((item) => {
		if (!byStoreType[item.storeTypeId]) {
			byStoreType[item.storeTypeId] = [];
		}
		byStoreType[item.storeTypeId].push(item);
	});

	console.log('\n🔗 CatalogItems by storeTypeId:');
	Object.entries(byStoreType).forEach(([storeTypeId, items]) => {
		const matchingDef = storeDefs.find((d) => d.id === storeTypeId);
		const defInfo = matchingDef
			? `✅ LINKED to "${matchingDef.key}"`
			: '❌ ORPHANED (no matching StoreTypeDef)';
		console.log(`  ${storeTypeId}: ${items.length} items - ${defInfo}`);
	});

	// Check for orphaned catalogs
	const orphanedStoreTypeIds = Object.keys(byStoreType).filter(
		(storeTypeId) => !storeDefs.some((d) => d.id === storeTypeId),
	);

	if (orphanedStoreTypeIds.length > 0) {
		console.log(
			`\n⚠️  Found ${orphanedStoreTypeIds.length} orphaned store type(s). Fixing...\n`,
		);

		// Get unique store types from orphaned items
		const orphanedItems = orphanedStoreTypeIds.flatMap((id) => byStoreType[id]);

		// Group by category to infer store type
		const byCategory = {};
		orphanedItems.forEach((item) => {
			if (!byCategory[item.category]) {
				byCategory[item.category] = [];
			}
			byCategory[item.category].push(item);
		});

		console.log('Categories in orphaned items:', Object.keys(byCategory));

		// Since we can't easily infer, delete orphaned items
		console.log(
			`\n🗑️  Deleting ${orphanedItems.length} orphaned catalog items...`,
		);
		await prisma.catalogItem.deleteMany({
			where: {
				storeTypeId: {
					in: orphanedStoreTypeIds,
				},
			},
		});
		console.log('✅ Deleted orphaned items');
	}

	console.log('\n✨ Database linking check complete!');
}

main()
	.catch((err) => {
		console.error('Error:', err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
