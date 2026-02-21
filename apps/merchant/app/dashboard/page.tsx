'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStoreAuth } from '@/hooks/use-store-auth';
import {
	BarChart3,
	Package,
	Users,
	CreditCard,
	FileText,
	Settings,
	LogOut,
	Menu,
	X,
} from 'lucide-react';
import { Card } from '@/components/Card';

export default function Dashboard() {
	const router = useRouter();
	const { auth, logout, isLoading } = useStoreAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	if (isLoading || !auth) {
		return null;
	}

	const handleLogout = () => {
		logout();
		router.push('/auth');
	};

	const menuItems = [
		{
			icon: BarChart3,
			label: 'Sales & POS',
			description: 'Process sales and checkout',
			href: '/sales',
			color: 'bg-blue-500',
		},
		{
			icon: Package,
			label: 'Inventory',
			description: 'Manage products and stock',
			href: '/inventory',
			color: 'bg-green-500',
		},
		{
			icon: Users,
			label: 'Workers',
			description: 'Manage staff and PINs',
			href: '/workers',
			color: 'bg-purple-500',
		},
		{
			icon: CreditCard,
			label: 'Credits',
			description: 'Manage customer credits',
			href: '/credits',
			color: 'bg-orange-500',
		},
		{
			icon: FileText,
			label: 'Reports',
			description: 'View analytics and reports',
			href: '/reports',
			color: 'bg-red-500',
		},
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-40">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">PORES</h1>
						<p className="text-sm text-gray-600">{auth.store.businessName}</p>
					</div>

					{/* Desktop Menu */}
					<div className="hidden md:flex items-center gap-4">
						<div className="text-right">
							<p className="text-sm font-medium text-gray-900">
								{auth.store.email}
							</p>
							<p className="text-xs text-gray-500">{auth.store.currency}</p>
						</div>
						<button
							onClick={handleLogout}
							className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
						>
							<LogOut size={18} />
							Logout
						</button>
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
					>
						{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="md:hidden border-t border-gray-200 bg-white">
						<div className="px-4 py-4 space-y-3">
							<div className="text-sm">
								<p className="font-medium text-gray-900">{auth.store.email}</p>
								<p className="text-gray-600">{auth.store.currency}</p>
							</div>
							<button
								onClick={handleLogout}
								className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							>
								<LogOut size={18} />
								Logout
							</button>
						</div>
					</div>
				)}
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				{/* Welcome Section */}
				<div className="mb-12">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Welcome back, {auth.store.businessName}!
					</h2>
					<p className="text-gray-600">
						Store Type:{' '}
						<span className="font-medium">
							{auth.store.storeType || 'Not Set'}
						</span>
					</p>
				</div>

				{/* Menu Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{menuItems.map((item) => {
						const Icon = item.icon;
						return (
							<Link key={item.href} href={item.href}>
								<Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
									<div className="p-6">
										<div
											className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
										>
											<Icon size={24} className="text-white" />
										</div>
										<h3 className="text-xl font-semibold text-gray-900 mb-2">
											{item.label}
										</h3>
										<p className="text-gray-600 text-sm">{item.description}</p>
									</div>
								</Card>
							</Link>
						);
					})}

					{/* Settings Card */}
					<Link href="/settings">
						<Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
							<div className="p-6">
								<div className="bg-gray-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
									<Settings size={24} className="text-white" />
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									Settings
								</h3>
								<p className="text-gray-600 text-sm">
									Configure store settings
								</p>
							</div>
						</Card>
					</Link>
				</div>
			</main>
		</div>
	);
}
