(async () => {
	const fetch = globalThis.fetch;
	function log(...args) {
		console.log(...args);
	}

	let base = null;
	for (let p = 3000; p <= 3010; p++) {
		try {
			const res = await fetch(`http://localhost:${p}/`);
			if (res.ok || res.status === 200 || res.status === 404) {
				base = `http://localhost:${p}`;
				break;
			}
		} catch (e) {
			// continue
		}
	}
	if (!base) {
		console.error('No local server found on ports 3000-3010');
		process.exit(1);
	}
	log('Using base URL', base);

	const email = `test+${Date.now()}@example.com`;
	log('Signing up with', email);
	const signup = await fetch(`${base}/api/auth/signup`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email,
			password: 'password123',
			businessName: 'TestBiz',
		}),
	});
	log('signup status', signup.status);
	const signupJson = await signup.json();
	log('signup response', signupJson);
	const token = signupJson.token;
	if (!token) {
		console.error('No token returned from signup; aborting');
		process.exit(1);
	}

	// get items for GROCERY
	const itemsRes = await fetch(`${base}/api/onboarding/items?type=GROCERY`);
	log('items status', itemsRes.status);
	const itemsJson = await itemsRes.json();
	log('items body keys', Object.keys(itemsJson));
	const products = itemsJson.products || [];
	log('products count', products.length);
	if (products.length === 0) {
		console.warn('No recommended products returned');
	}

	// pick first two by id if available
	const selected = products
		.slice(0, 2)
		.map((p, idx) => p.id || `${'GROCERY'}-${idx}`);
	log('selected ids', selected);

	const setupRes = await fetch(`${base}/api/onboarding/setup`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ storeType: 'GROCERY', selectedItems: selected }),
	});
	log('setup status', setupRes.status);
	const setupJson = await setupRes.json();
	log('setup response', setupJson);

	// fetch products (include zero stock)
	const prodRes = await fetch(`${base}/api/products?includeZeroStock=true`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	log('products list status', prodRes.status);
	const prodJson = await prodRes.json();
	if (Array.isArray(prodJson)) {
		log('inventory count', prodJson.length);
		log('first items', prodJson.slice(0, 5));
	} else {
		log('products response', prodJson);
	}

	process.exit(0);
})().catch((e) => {
	console.error('Script error', e);
	process.exit(1);
});
