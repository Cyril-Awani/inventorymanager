#!/usr/bin/env node
/**
 * Seed catalog items by calling the API endpoint
 * First, make sure your server is running
 */

const fs = require('fs');
const path = require('path');

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

// Read the store-recommendations file and extract products
const recommendationsPath = path.join(
	__dirname,
	'../apps/admin/lib/store-recommendations.ts',
);
const recommendations = fs.readFileSync(recommendationsPath, 'utf-8');

// Extract PRODUCTS_BY_STORE_TYPE from the file
const productsMatch = recommendations.match(
	/export const PRODUCTS_BY_STORE_TYPE.*?^};/ms,
);
if (!productsMatch) {
	console.error('❌ Could not extract PRODUCTS_BY_STORE_TYPE from file');
	process.exit(1);
}

// Parse products - this is a simplified approach
const PRODUCTS_BY_STORE_TYPE = {};

for (const storeType of STORE_TYPES) {
	const regex = new RegExp(`${storeType.id}:\\s*\\[(.*?)\\]\\s*,`, 's');
	PRODUCTS_BY_STORE_TYPE[storeType.id] = [];
}

// For this approach, we'll require that you use the API endpoint directly
console.log(
	'📌 To seed catalog items, please run your development server and execute:',
);
console.log('');
console.log('For the first time setup, you can:');
console.log('1. Start your dev server (npm run dev)');
console.log(
	'2. Make a POST request to http://localhost:3000/api/admin/recommendations',
);
console.log(
	'3. This will seed all STORE_TYPES and products from your constants',
);
console.log('');
console.log('Or use this curl command:');
console.log('curl -X POST http://localhost:3000/api/admin/recommendations \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"');
console.log('');
console.log(
	'The auth token can be obtained by logging in as an admin through your app.',
);
