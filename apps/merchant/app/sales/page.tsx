'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/Button';
import Link from 'next/link';
import {
	Search,
	LayoutGrid,
	List,
	ChevronDown,
	Home,
	Package,
	CreditCard,
	BarChart3,
	Calculator,
	Users,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Menu,
	X,
} from 'lucide-react';
import { ProductTile } from '@/components/ProductTile';
import { CheckoutCart } from '@/components/CheckoutCart';
import { MobileCheckout } from '@/components/MobileCheckout';
import { PinDialog } from '@/components/PinDialog';
import { ReceiptModal } from '@/components/ReceiptModal';
import { CustomerInfoDialog } from '@/components/CustomerInfoDialog';
import { NetworkStatusIndicator } from '@/components/NetworkStatusIndicator';
import { db, cacheProducts, getCachedProducts } from '@/lib/db';
import { formatCurrency } from '@/lib/transaction';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
	{ href: '/sales', label: 'Home', icon: Home },
	{ href: '/credits', label: 'Credits', icon: CreditCard },
	{ href: '/inventory', label: 'Inventory', icon: Package },
	{ href: '/reports', label: 'Reports', icon: BarChart3 },
	{ href: '/pages', label: 'Insight', icon: Calculator },
	{ href: '/workers', label: 'Team', icon: Users },
];

interface Product {
	id: string;
	name: string;
	brand: string;
	category: string;
	costPrice: number;
	sellingPrice: number;
	quantity: number;
	image?: string;
	unitName?: string;
	unitsPerBulk?: number | null;
	bulkSellingPrice?: number | null;
	bulkUnitName?: string | null;
}

interface CartItem {
	id: string;
	productId: string;
	name: string;
	brand: string;
	quantity: number;
	unitPrice: number;
	costPrice: number;
	sellByBulk: boolean;
	unitLabel: string;
}

interface Worker {
	id: string;
	name: string;
}

export default function SalesPage() {
	const router = useRouter();
	const pathname = usePathname();
	const { auth, isLoading, logout } = useStoreAuth();
	const { isOnline, syncWorkers } = useNetworkStatus();
	const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// State declarations - must be before early returns
	const [products, setProducts] = useState<Product[]>([]);
	const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
	const [cartItems, setCartItems] = useState<CartItem[]>(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('cartItems');
			if (saved) {
				try {
					return JSON.parse(saved);
				} catch (error) {
					console.error('Failed to load cart from localStorage:', error);
				}
			}
		}
		return [];
	});
	const [workers, setWorkers] = useState<Worker[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('All Categories');
	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showPinDialog, setShowPinDialog] = useState(false);
	const [showCustomerDialog, setShowCustomerDialog] = useState(false);
	const [showReceipt, setShowReceipt] = useState(false);
	const [receiptData, setReceiptData] = useState<any>(null);
	const [isLoading2, setIsLoading2] = useState(false);
	const [paymentInfo, setPaymentInfo] = useState<{
		amountPaid: number;
		isPartial: boolean;
		paymentMethod: 'cash' | 'transfer' | 'partial';
	} | null>(null);
	const [customerInfo, setCustomerInfo] = useState<{
		name: string;
		phone?: string;
	} | null>(null);
	const [workerId, setWorkerId] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	// Save cart to localStorage whenever it changes
	useEffect(() => {
		localStorage.setItem('cartItems', JSON.stringify(cartItems));
	}, [cartItems]);

	// Redirect if not authenticated
	useEffect(() => {
		if (!isLoading && !auth) {
			router.push('/auth');
		}
	}, [auth, isLoading, router]);

	// Monitor online status
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	const handleLogout = () => {
		logout();
		router.push('/auth');
	};

	// Fetch products
	useEffect(() => {
		// Don't fetch if still loading or not authenticated
		if (isLoading || !auth) return;

		const fetchProducts = async () => {
			try {
				const headers: HeadersInit = {};
				if (auth?.token) {
					headers['Authorization'] = `Bearer ${auth.token}`;
				}

				const response = await fetch('/api/products', { headers });
				if (response.ok) {
					const data = await response.json();
					setProducts(data);
					await cacheProducts(
						data.map((p: Product) => ({
							productId: p.id,
							name: p.name,
							brand: p.brand,
							category: p.category,
							costPrice: p.costPrice,
							sellingPrice: p.sellingPrice,
							quantity: p.quantity,
							image: p.image,
							unitName: p.unitName ?? 'Piece',
							unitsPerBulk: p.unitsPerBulk ?? null,
							bulkSellingPrice: p.bulkSellingPrice ?? null,
							bulkUnitName: p.bulkUnitName ?? null,
						})),
					);
				}
			} catch (error) {
				console.log('Offline: using cached products');
				const cached = await getCachedProducts();
				if (cached && cached.length > 0) {
					setProducts(
						cached.map((cp) => ({
							id: cp.productId,
							name: cp.name,
							brand: cp.brand,
							category: cp.category,
							costPrice: cp.costPrice,
							sellingPrice: cp.sellingPrice,
							quantity: cp.quantity,
							image: cp.image,
							unitName: cp.unitName,
							unitsPerBulk: cp.unitsPerBulk,
							bulkSellingPrice: cp.bulkSellingPrice,
							bulkUnitName: cp.bulkUnitName,
						})),
					);
				}
			}
		};

		fetchProducts();

		// Also sync workers for offline use (non-blocking)
		if (isOnline) {
			syncWorkers(auth).catch((error) => {
				console.warn('Failed to sync workers:', error);
				// Don't fail the page load for worker sync
			});
		}
	}, [auth, isLoading, isOnline, syncWorkers]);

	// Fetch workers
	useEffect(() => {
		if (isLoading || !auth) return;

		const fetchWorkers = async () => {
			try {
				const headers: HeadersInit = {};
				if (auth?.token) {
					headers['Authorization'] = `Bearer ${auth.token}`;
				}
				if (auth?.store?.id) {
					headers['x-store-id'] = auth.store.id;
				}

				const response = await fetch('/api/workers', { headers });
				if (response.ok) {
					const data = await response.json();
					setWorkers(data);
				}
			} catch (error) {
				console.log('Failed to fetch workers');
			}
		};

		fetchWorkers();
	}, [auth, isLoading]);

	const categories = useMemo(() => {
		const cats = new Set(['All Categories']);
		products.forEach((p) => cats.add(p.category));
		return Array.from(cats);
	}, [products]);

	// Filter products
	useEffect(() => {
		let filtered = products;

		if (selectedCategory !== 'All Categories') {
			filtered = filtered.filter((p) => p.category === selectedCategory);
		}

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.brand.toLowerCase().includes(query),
			);
		}

		setFilteredProducts(filtered);
	}, [products, selectedCategory, searchQuery]);

	const handleAddToCart = (
		productId: string,
		quantity: number,
		unitPrice: number,
		costPrice: number,
		sellByBulk: boolean,
	) => {
		const product = products.find((p) => p.id === productId);
		if (!product) return;

		const cartItem: CartItem = {
			id: `${productId}-${Date.now()}`,
			productId,
			name: product.name,
			brand: product.brand,
			quantity,
			unitPrice,
			costPrice,
			sellByBulk,
			unitLabel:
				sellByBulk && product.bulkUnitName
					? product.bulkUnitName
					: product.unitName || 'Piece',
		};

		setCartItems([...cartItems, cartItem]);
	};

	const handleRemoveFromCart = (cartItemId: string) => {
		setCartItems(cartItems.filter((item) => item.id !== cartItemId));
	};

	const handleClearCart = () => {
		setCartItems([]);
		localStorage.removeItem('cartItems');
	};

	const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
		if (newQuantity <= 0) {
			handleRemoveFromCart(cartItemId);
			return;
		}
		setCartItems(
			cartItems.map((item) =>
				item.id === cartItemId ? { ...item, quantity: newQuantity } : item,
			),
		);
	};

	const handleCheckout = async (
		amountPaid: number,
		isPartial: boolean,
		paymentMethod: 'cash' | 'transfer' | 'partial',
	) => {
		setPaymentInfo({ amountPaid, isPartial, paymentMethod });

		// If partial payment, show customer info dialog first; otherwise show PIN dialog
		if (isPartial) {
			setShowCustomerDialog(true);
		} else {
			setShowPinDialog(true);
		}
	};

	const handlePinVerified = (id: string, name: string) => {
		setWorkerId(id);
		setShowPinDialog(false);
		// Call submitSale with worker ID and customer info
		submitSale(id, customerInfo || { name: '', phone: undefined });
	};

	const handleCustomerInfoSubmitted = async (info: {
		name: string;
		phone?: string;
	}) => {
		if (!paymentInfo || cartItems.length === 0) {
			alert('Missing transaction information');
			return;
		}

		setCustomerInfo(info);

		// If partial payment, proceed to PIN dialog; otherwise submit immediately
		if (paymentInfo.isPartial) {
			setShowCustomerDialog(false);
			setShowPinDialog(true);
		} else {
			// This shouldn't happen - complete payments go straight to PIN
			alert('Complete payment flow error');
		}
	};

	const submitSale = async (
		workerIdParam: string,
		customerInfo: { name: string; phone?: string },
	) => {
		if (!paymentInfo || cartItems.length === 0) {
			alert('Missing transaction information');
			return;
		}

		setIsLoading2(true);

		try {
			const saleData = {
				workerId: workerIdParam,
				customerName: customerInfo.name,
				customerPhone: customerInfo.phone,
				items: cartItems.map((item) => ({
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					costPrice: item.costPrice,
					sellByBulk: item.sellByBulk,
				})),
				amountPaid: paymentInfo.amountPaid,
				paymentMethod: paymentInfo.paymentMethod,
				isPartial: paymentInfo.isPartial,
			};

			const headers: HeadersInit = { 'Content-Type': 'application/json' };
			if (auth?.token) {
				headers['Authorization'] = `Bearer ${auth.token}`;
			}
			if (auth?.store?.id) {
				headers['x-store-id'] = auth.store.id;
			}

			// Try to submit online
			let response: Response | null = null;
			let isOfflineSubmission = false;

			try {
				response = await fetch('/api/sales', {
					method: 'POST',
					headers,
					body: JSON.stringify(saleData),
				});
			} catch (networkError) {
				// Network error - save offline
				console.warn('Network error, saving sale offline:', networkError);
				isOfflineSubmission = true;
			}

			// If online submission failed, save offline
			if (!response?.ok || isOfflineSubmission) {
				if (!isOfflineSubmission && response) {
					const data = await response.json().catch(() => ({}));
					alert(data.error || 'Failed to complete sale');
					return;
				}

				// Save to offline database
				try {
					const { db } = await import('@/lib/db');
					const saleId = await db.sales.add({
						items: saleData.items,
						workerId: saleData.workerId,
						workerName: 'Worker', // TODO: get actual worker name
						totalPrice: cartItems.reduce(
							(sum, item) => sum + item.unitPrice * item.quantity,
							0,
						),
						totalCost: cartItems.reduce(
							(sum, item) => sum + item.costPrice * item.quantity,
							0,
						),
						amountPaid: saleData.amountPaid,
						isPartial: saleData.isPartial,
						timestamp: Date.now(),
						synced: false,
					});

					console.log('✓ Sale saved offline:', saleId);

					// Show receipt with offline badge
					setReceiptData({
						saleId: `offline-${saleId}`,
						transactionId: `offline-${saleId}`,
						items: cartItems.map((item) => ({
							name: item.name,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							totalPrice: item.unitPrice * item.quantity,
							unit: item.unitLabel || 'Piece',
						})),
						totalPrice: cartItems.reduce(
							(sum, item) => sum + item.unitPrice * item.quantity,
							0,
						),
						amountPaid: paymentInfo.amountPaid,
						paymentMethod: paymentInfo.paymentMethod,
						customerName: customerInfo.name,
						customerPhone: customerInfo.phone,
						workerName: 'Worker',
						timestamp: new Date().toLocaleString(),
						isOffline: true,
					});
				} catch (dbError) {
					console.error('Failed to save offline:', dbError);
					alert(
						'Failed to save sale. Please check your connection and try again.',
					);
					return;
				}
			} else {
				// Online submission successful
				const data = await response.json().catch(() => ({}));
				const sale = data.sale || data;

				// Show receipt
				setReceiptData({
					saleId: sale.id,
					transactionId: sale.transactionId,
					items: cartItems.map((item) => ({
						name: item.name,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						totalPrice: item.unitPrice * item.quantity,
						unit: item.unitLabel || 'Piece',
					})),
					totalPrice: cartItems.reduce(
						(sum, item) => sum + item.unitPrice * item.quantity,
						0,
					),
					amountPaid: paymentInfo.amountPaid,
					paymentMethod: paymentInfo.paymentMethod,
					customerName: customerInfo.name,
					customerPhone: customerInfo.phone,
					workerName: 'Worker',
					timestamp: new Date().toLocaleString(),
				});
			}

			// Show receipt regardless of online/offline
			setShowReceipt(true);
			setShowPinDialog(false);
			setShowCustomerDialog(false);
		} catch (error) {
			console.error('Sale submission error:', error);
			alert('Failed to submit sale');
		} finally {
			setIsLoading2(false);
		}
	};

	const handleReceiptClose = () => {
		setShowReceipt(false);
		setReceiptData(null);
		setCartItems([]);
		setPaymentInfo(null);
		setCustomerInfo(null);
		setWorkerId(null);
		setShowPinDialog(false);
		setShowCustomerDialog(false);
		localStorage.removeItem('cartItems');
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="h-screen flex overflow-hidden bg-gray-50">
			{/* LEFT SECTION: Header + Sidebar + Products */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Logo Header - Fixed at top */}
				<div className="bg-white border-b border-gray-200 p-4 flex-shrink-0 h-[11vh]">
					<div className="flex items-center justify-between h-full">
						<div className="flex flex-col gap-1">
							<span className="text-lg font-bold text-gray-900">Pures POS</span>
							<span className="text-xs font-normal text-gray-500">
								{(() => {
									const t = auth?.store?.storeType;
									if (!t) return 'Store';
									const lower = t.toLowerCase();
									return lower.charAt(0).toUpperCase() + lower.slice(1);
								})()}
							</span>
						</div>
						<div className="flex-1 text-center px-4">
							<div className="text-sm font-semibold text-gray-800 truncate">
								{auth?.store?.businessName || 'Your business'}
							</div>
						</div>

						<div className="flex items-center gap-3">
							<NetworkStatusIndicator />
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
								aria-label="Toggle menu"
							>
								{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
						</div>
					</div>
				</div>

				{/* Content Area: Menu (left on desktop) + Products */}
				<div className="flex-1 flex min-h-0">
					{/* Navigation Menu - Desktop Sidebar */}
					<nav
						className={`
							hidden lg:flex lg:flex-col lg:relative z-50 bg-white border-r border-gray-200 transition-all duration-300 h-full
							${isMenuCollapsed ? 'w-20' : 'w-36'}
						`}
					>
						{/* Menu Items */}
						<div className="flex flex-col h-full overflow-y-auto">
							<div className="flex-1 px-2 py-4 space-y-2">
								{menuItems.map(({ href, label, icon: Icon }) => {
									const isActive = pathname === href;
									return (
										<Link
											key={href}
											href={href}
											className={`
												flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
												${
													isActive
														? 'bg-blue-600 text-white'
														: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
												}
											`}
											title={!isMenuCollapsed ? label : undefined}
										>
											<Icon size={20} />
											{!isMenuCollapsed && <span>{label}</span>}
										</Link>
									);
								})}
							</div>

							{/* Footer: Toggle + Logout Buttons */}
							<div className="px-2 py-3 border-t border-gray-200 space-y-2">
								<button
									onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
									className="w-full flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
									aria-label="Toggle menu"
									title={!isMenuCollapsed ? 'Collapse menu' : 'Expand menu'}
								>
									{isMenuCollapsed ? (
										<ChevronRight size={20} className="text-gray-600" />
									) : (
										<ChevronLeft size={20} className="text-gray-600" />
									)}
								</button>
								<button
									onClick={handleLogout}
									className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
									title={!isMenuCollapsed ? 'Logout' : undefined}
								>
									<LogOut size={20} />
									{!isMenuCollapsed && <span>Logout</span>}
								</button>
							</div>
						</div>
					</nav>

					{/* Mobile Menu - Full Width Sidebar from Right */}
					<nav
						className={`
							lg:hidden fixed top-0 right-0 z-50 bg-white h-screen w-full transition-transform duration-300
							${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
						`}
						style={{
							marginTop: '11vh',
							height: 'calc(100vh - 11vh)',
						}}
					>
						{/* Menu Items */}
						<div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-2">
							{menuItems.map(({ href, label, icon: Icon }) => {
								const isActive = pathname === href;
								return (
									<Link
										key={href}
										href={href}
										onClick={() => setIsMobileMenuOpen(false)}
										className={`
											flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
											${
												isActive
													? 'bg-blue-600 text-white'
													: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
											}
										`}
									>
										<Icon size={24} />
										<span>{label}</span>
									</Link>
								);
							})}
						</div>

						{/* Mobile Menu Footer: Logout Button */}
						<div className="border-t border-gray-200 pt-4 mt-4 px-4">
							<button
								onClick={() => {
									setIsMobileMenuOpen(false);
									handleLogout();
								}}
								className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							>
								<LogOut size={24} />
								<span>Logout</span>
							</button>
						</div>
					</nav>

					{/* Mobile Menu Overlay */}
					{isMobileMenuOpen && (
						<div
							className="fixed inset-0 bg-black/50 z-40 lg:hidden"
							style={{ marginTop: '11vh' }}
							onClick={() => setIsMobileMenuOpen(false)}
						/>
					)}

					{/* Products Section */}
					<div className="flex-1 flex flex-col min-w-0 overflow-y-auto gap-4 pb-16">
						{/* Filters */}
						<div className="bg-white rounded-lg shadow py-2 px-1 flex-shrink-0">
							{/* Search + Controls (stack on mobile, single row on desktop) */}
							<div className="mb-4">
								<div className="flex flex-row items-center gap-3">
									<div className="flex-1">
										<div className="relative" ref={dropdownRef}>
											{/* Left icon acts as category toggle */}
											<button
												type="button"
												onClick={() =>
													setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
												}
												className="absolute left-2 top-1.5 bottom-1.5 z-20 flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-l-md text-sm text-gray-700"
											>
												<span className="truncate max-w-[120px] text-sm">
													{selectedCategory === 'All Categories'
														? 'All'
														: selectedCategory}
												</span>
												<ChevronDown
													size={16}
													className={`transition ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
												/>
											</button>

											<input
												type="text"
												placeholder="Search products..."
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className="w-full pl-36 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
											/>

											{isCategoryDropdownOpen && (
												<div className="absolute top-full left-2 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-30 min-w-[200px]">
													{categories.map((cat) => (
														<button
															key={cat}
															onClick={() => {
																setSelectedCategory(cat);
																setIsCategoryDropdownOpen(false);
															}}
															className={`w-full text-left px-4 py-2 hover:bg-indigo-50 ${
																selectedCategory === cat
																	? 'bg-indigo-100 font-medium'
																	: ''
															}`}
														>
															{cat}
														</button>
													))}
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center gap-3">
										{/* View Mode Toggle */}
										<div className="flex gap-2">
											<button
												onClick={() =>
													setViewMode(viewMode === 'grid' ? 'list' : 'grid')
												}
												aria-label={
													viewMode === 'grid'
														? 'Switch to list view'
														: 'Switch to grid view'
												}
												title={viewMode === 'grid' ? 'List view' : 'Grid view'}
												className={`p-2 rounded-lg ${
													viewMode === 'grid'
														? 'bg-indigo-600 text-white'
														: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
												}`}
											>
												{viewMode === 'grid' ? (
													<LayoutGrid size={20} />
												) : (
													<List size={20} />
												)}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Products Grid/List */}
						<div
							className={` overflow-y-auto bg-gray-50 rounded-lg p-4 ${
								viewMode === 'grid'
									? 'grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4'
									: 'flex flex-col gap-2'
							}`}
						>
							{filteredProducts.map((product) => (
								<ProductTile
									key={product.id}
									product={{
										id: product.id,
										name: product.name,
										brand: product.brand,
										costPrice: product.costPrice,
										price: product.sellingPrice,
										quantity: product.quantity,
										image: product.image,
										unitName: product.unitName || 'Piece',
										unitsPerBulk: product.unitsPerBulk,
										bulkSellingPrice: product.bulkSellingPrice,
										bulkUnitName: product.bulkUnitName,
									}}
									onAddToCart={handleAddToCart}
									viewMode={viewMode}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
			{/* RIGHT SECTION - Checkout Cart (Full Height) */}
			<div className="hidden md:flex md:flex-col w-96 bg-white border-l border-gray-200">
				<CheckoutCart
					items={cartItems}
					onRemoveItem={handleRemoveFromCart}
					onUpdateQuantity={handleUpdateQuantity}
					onCheckout={handleCheckout}
					onClearCart={handleClearCart}
				/>
			</div>
			{/* Cart Section - Mobile */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
				<MobileCheckout
					items={cartItems}
					onRemoveItem={handleRemoveFromCart}
					onUpdateQuantity={handleUpdateQuantity}
					onCheckout={handleCheckout}
					onClearCart={handleClearCart}
				/>
			</div>
			{/* Dialogs */}
			{showPinDialog && (
				<PinDialog
					onPinVerified={handlePinVerified}
					onCancel={() => setShowPinDialog(false)}
					onNavigateToWorkers={() => router.push('/workers')}
					storeId={auth?.store?.id}
					workers={workers}
				/>
			)}
			{showCustomerDialog && paymentInfo && (
				<CustomerInfoDialog
					onSubmit={handleCustomerInfoSubmitted}
					onCancel={() => setShowCustomerDialog(false)}
					totalPrice={cartItems.reduce(
						(sum, item) => sum + item.unitPrice * item.quantity,
						0,
					)}
					amountPaid={paymentInfo.amountPaid}
					isLoading={isLoading2}
				/>
			)}

			{showReceipt && receiptData && (
				<ReceiptModal
					isOpen={showReceipt}
					onClose={handleReceiptClose}
					transactionId={receiptData.transactionId}
					storeName={auth?.store?.businessName || 'Store'}
					workerName={receiptData.workerName}
					items={receiptData.items}
					totalPrice={receiptData.totalPrice}
					amountPaid={receiptData.amountPaid}
					paymentType={
						receiptData.paymentMethod === 'partial' ? 'partial' : 'cash'
					}
					paymentMethod={receiptData.paymentMethod}
					customerName={receiptData.customerName}
					customerPhone={receiptData.customerPhone}
					isOffline={receiptData.isOffline}
				/>
			)}
		</div>
	);
}
