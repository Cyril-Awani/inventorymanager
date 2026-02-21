'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { Button } from '@/components/ui/button';

const navItems = [
	{ icon: '📊', label: 'Dashboard', href: '/dashboard' },
	{ icon: '🏪', label: 'Merchants', href: '/merchants' },
	{ icon: '👨‍💼', label: 'Customers', href: '/customers' },
	{ icon: '📦', label: 'Products', href: '/products' },
	{ icon: '🔁', label: 'Recommendations', href: '/recommendations' },
];

export function AdminTopNav() {
	const { logout, isAuthenticated, store } = useStoreAuth();
	const router = useRouter();

	const handleLogout = () => {
		logout();
		// small delay then navigate to admin login screen
		setTimeout(() => router.push('/admin/login'), 100);
	};

	return (
		<header className="w-full bg-white border-b shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					<div className="flex items-center gap-4">
						<Link href="/admin" className="flex items-center gap-3">
							<div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center text-white font-bold">
								P
							</div>
							<div className="hidden sm:block">
								<div className="font-semibold">PORES</div>
								<div className="text-xs text-gray-500">Admin</div>
							</div>
						</Link>

						<nav className="hidden md:flex items-center gap-2">
							{navItems.map((it) => (
								<Link
									key={it.href}
									href={it.href}
									className="px-3 py-2 rounded hover:bg-gray-100 text-sm flex items-center gap-2"
								>
									<span>{it.icon}</span>
									<span>{it.label}</span>
								</Link>
							))}
						</nav>
					</div>

					<div className="flex items-center gap-3">
						{isAuthenticated && (
							<div className="text-sm text-gray-700 mr-2">
								{store?.businessName}
							</div>
						)}
						<Button
							variant="outline"
							onClick={handleLogout}
							className="px-3 py-1"
						>
							Logout
						</Button>
					</div>
				</div>
			</div>
		</header>
	);
}
