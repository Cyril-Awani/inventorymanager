#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Seed data defined directly
const STORE_TYPES = [
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

const PRODUCTS_BY_STORE_TYPE = {
	EATERY: [
		{
			name: 'Coca-Cola 50cl',
			brand: 'Coca-Cola',
			category: 'Beverages',
			costPrice: 200,
			sellingPrice: 250,
			unitName: 'Bottle',
			image:
				'https://images.unsplash.com/photo-1554866585-d7ab9e3e20ad?w=400&h=400&fit=crop',
		},
		{
			name: 'Pepsi 50cl',
			brand: 'Pepsi',
			category: 'Beverages',
			costPrice: 200,
			sellingPrice: 250,
			unitName: 'Bottle',
			image:
				'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=400&fit=crop',
		},
	],
	ELECTRONICS: [
		{
			name: 'Phone Charger',
			brand: 'Generic',
			category: 'Accessories',
			costPrice: 1000,
			sellingPrice: 2000,
			unitName: 'Piece',
			image:
				'https://images.unsplash.com/photo-1619983081854-430f63602796?w=400&h=400&fit=crop',
		},
		{
			name: 'USB Cable',
			brand: 'Generic',
			category: 'Accessories',
			costPrice: 300,
			sellingPrice: 600,
			unitName: 'Piece',
			image:
				'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop',
		},
	],
	COSMETICS: [
		{
			name: 'Body Lotion',
			brand: 'Ponds',
			category: 'Skincare',
			costPrice: 1500,
			sellingPrice: 2000,
			unitName: 'Bottle',
			image:
				'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
		},
	],
	GROCERY: [
		{
			name: 'Rice',
			brand: 'Local',
			category: 'Grains',
			costPrice: 8000,
			sellingPrice: 10000,
			unitName: 'Kg',
		},
	],
};

async function main() {
	console.log('🌱 Seeding catalog items...\n');

	for (const st of STORE_TYPES) {
		console.log(`Processing ${st.id}...`);

		// Create store type
		const def = await prisma.storeTypeDef.upsert({
			where: { key: st.id },
			update: { label: st.label, icon: st.icon },
			create: { key: st.id, label: st.label, icon: st.icon },
		});

		const products = PRODUCTS_BY_STORE_TYPE[st.id] || [];

		if (products.length > 0) {
			// Delete existing items for this store type
			await prisma.catalogItem.deleteMany({
				where: { storeTypeId: def.id },
			});

			// Create new items
			await prisma.catalogItem.createMany({
				data: products.map((p) => ({
					storeTypeId: def.id,
					name: p.name,
					brand: p.brand || 'Generic',
					category: p.category || 'Misc',
					costPrice: p.costPrice || 0,
					sellingPrice: p.sellingPrice || 0,
					unitName: p.unitName || 'Piece',
					unitsPerBulk: null,
					bulkSellingPrice: null,
					bulkUnitName: null,
					description: null,
					image: p.image || null,
					keywords: [],
				})),
			});
			console.log(`  ✓ Added ${products.length} items`);
		} else {
			console.log(`  ℹ No products defined`);
		}
	}

	const total = await prisma.catalogItem.count();
	console.log(`\n✨ Seeding complete! Total catalog items: ${total}`);
}

main()
	.catch((err) => {
		console.error('❌ Seed failed:', err);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
