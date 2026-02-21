'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
	Home,
	Package,
	CreditCard,
	BarChart3,
	Calculator,
	Users,
	Menu,
	X,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Settings,
} from 'lucide-react';
import { useStoreAuth } from '@/hooks/use-store-auth';

function formatStoreType(type?: string) {
	if (!type) return 'Store';
	// Make readable: GROCERY -> Grocery
	const lower = type.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function BusinessName() {
	const { store } = useStoreAuth();
	const name = store?.businessName || '';
	return (
		<div className="text-sm font-semibold text-gray-800 truncate">
			{name || 'Your business'}
		</div>
	);
}

interface LayoutProps {
	children: ReactNode;
	headerHeight?: string; // e.g., '11vh' or '15vh', default is '11vh'
	isSalesPage?: boolean; // For the special sales page design
}

const menuItems = [
	{ href: '/sales', label: 'Home', icon: Home },
	{ href: '/credits', label: 'Credits', icon: CreditCard },
	{ href: '/inventory', label: 'Inventory', icon: Package },
	{ href: '/reports', label: 'Reports', icon: BarChart3 },
	{ href: '/pages', label: 'Insight', icon: Calculator },
	{ href: '/workers', label: 'Team', icon: Users },
];

export default function Layout({
	children,
	headerHeight = '11vh',
	isSalesPage = false,
}: LayoutProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { logout, store } = useStoreAuth();
	const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isOnline, setIsOnline] = useState(true);

	const handleLogout = () => {
		logout();
		router.push('/auth');
	};

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

	return (
		<div className="h-screen flex overflow-hidden bg-gray-50">
			{/* LEFT SECTION: Logo Header + Menu + Main Content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Logo Header - Fixed at top */}
				<div
					className="bg-white border-b border-gray-200 p-2 flex-shrink-0"
					style={{ height: headerHeight }}
				>
					<div className="flex items-center justify-between h-full">
						<span className=" text-gray-900">Pures POS</span>

						<div className="flex-1 text-center px-4">
							<div className="text-lg font-bold flex flex-col gap-1">
								<BusinessName />
								<span className="text-xs font-normal text-gray-500">
									{formatStoreType(store?.storeType)}
								</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
									isOnline
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-800'
								}`}
							>
								<span
									className={`w-2 h-2 rounded-full ${
										isOnline ? 'bg-green-500' : 'bg-gray-500'
									}`}
								/>
								{isOnline ? 'Online' : 'Offline'}
							</div>
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

				{/* Content Area: Menu (left on desktop) + Main Content */}
				<div className="flex-1 flex min-h-0">
					{/* Navigation Menu - Desktop Sidebar */}
					<nav
						className={`
							hidden lg:flex lg:flex-col lg:relative z-50 bg-white border-r border-gray-200 transition-all duration-300 h-full
							${isMenuCollapsed ? 'w-20' : 'w-36'}
						`}
						style={
							isSalesPage
								? { height: 'calc(100vh - ' + headerHeight + ')' }
								: {}
						}
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

							{/* Footer: Toggle + Settings + Logout Buttons */}
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
								<Link
									href="/profile"
									className={`
										flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
										${
											pathname === '/profile'
												? 'bg-blue-600 text-white'
												: 'text-gray-600 hover:bg-gray-100'
										}
									`}
									title={!isMenuCollapsed ? 'Profile & Settings' : undefined}
								>
									<Settings size={20} />
									{!isMenuCollapsed && <span>Settings</span>}
								</Link>
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
							marginTop: headerHeight,
							height: `calc(100vh - ${headerHeight})`,
						}}
					>
						{/* Menu Items - Scrollable */}
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

							{/* Divider */}
							<div className="border-t border-gray-200 my-2"></div>

							{/* Settings + Logout */}
							<Link
								href="/profile"
								onClick={() => setIsMobileMenuOpen(false)}
								className={`
									flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
									${
										pathname === '/profile'
											? 'bg-blue-600 text-white'
											: 'text-gray-600 hover:bg-gray-100'
									}
								`}
							>
								<Settings size={24} />
								<span>Settings</span>
							</Link>
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
							style={{ marginTop: headerHeight }}
							onClick={() => setIsMobileMenuOpen(false)}
						/>
					)}

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
						{/* Page Content */}
						<div className="flex-1 overflow-auto">{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
