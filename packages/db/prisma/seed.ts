import { prisma } from '../lib/prisma';
import {
	STORE_TYPES,
	PRODUCTS_BY_STORE_TYPE,
} from '../lib/store-recommendations';

async function main() {
	console.log('Seeding store types and catalog items...');

	// Clear existing defs and items
	await prisma.catalogItem.deleteMany();
	await prisma.storeTypeDef.deleteMany();

	for (const st of STORE_TYPES) {
		const created = await prisma.storeTypeDef.create({
			data: {
				key: st.id,
				label: st.label,
				icon: st.icon,
			},
		});

		const products = PRODUCTS_BY_STORE_TYPE[st.id] || [];
		if (products.length > 0) {
			// For onboarding seed data, zero out prices so users don't see costs
			const itemsToCreate = products.map((p) => ({
				storeTypeId: created.id,
				name: p.name,
				brand: p.brand,
				category: p.category,
				costPrice: 0,
				sellingPrice: 0,
				unitName: p.unitName || 'Piece',
				unitsPerBulk: p.unitsPerBulk ?? null,
				bulkSellingPrice: p.bulkSellingPrice ?? null,
				bulkUnitName: p.bulkUnitName ?? null,
				description: p.description ?? null,
				keywords: p.keywords ?? [],
			}));

			await prisma.catalogItem.createMany({ data: itemsToCreate });
		}
	}

	console.log('Seeding completed.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
