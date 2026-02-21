'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavItem {
	icon: string;
	label: string;
	href: string;
}

interface NavSection {
	label: string;
	items: NavItem[];
}

const navSections: NavSection[] = [
	{
		label: 'Platform',
		items: [
			{ icon: '📊', label: 'Dashboard', href: '/dashboard' },
			{ icon: '🏪', label: 'Merchants', href: '/merchants' },
		],
	},
	{
		label: 'Ecosystem',
		items: [
			{ icon: '👨‍💼', label: 'Customers', href: '/customers' },
			{ icon: '🏭', label: 'Suppliers', href: '/suppliers' },
		],
	},
	{
		items: [
			{ icon: '✓', label: 'Compliance', href: '/compliance' },
			{ icon: '📋', label: 'Reports', href: '/reports' },
		],
	},
	{
		label: 'Legacy',
		items: [
			{ icon: '👥', label: 'Workers', href: '/workers' },
			{ icon: '📦', label: 'Products', href: '/products' },
			{ icon: '💬', label: 'Credits', href: '/credits' },
			{ icon: '🔁', label: 'Recommendations', href: '/recommendations' },
		],
	},
];

export function AdminSidebar() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [expandedSections, setExpandedSections] = useState<{
		[key: string]: boolean;
	}>({});
	const pathname = usePathname();

	const toggleSection = (label: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[label]: !prev[label],
		}));
	};

	const isLinkActive = (href: string) => {
		return pathname === href || pathname.startsWith(href + '/');
	};

	return (
		<aside
			className={`${
				sidebarOpen ? 'w-72' : 'w-24'
			} bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 flex flex-col shadow-2xl border-r border-gray-700`}
		>
			{/* Header */}
			<div className="p-6 flex items-center justify-between border-b border-gray-700">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
						P
					</div>
					{sidebarOpen && (
						<div>
							<h1 className="text-lg font-bold">PORES</h1>
							<p className="text-xs text-gray-400">Admin Portal</p>
						</div>
					)}
				</div>
				<button
					onClick={() => setSidebarOpen(!sidebarOpen)}
					className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300 hover:text-white"
					title={sidebarOpen ? 'Collapse' : 'Expand'}
				>
					{sidebarOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</div>

			{/* Navigation */}
			<nav className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
				{navSections.map((section, sIdx) => {
					const sectionKey = section.label ?? `section-${sIdx}`;
					const isExpanded = expandedSections[sectionKey] !== false;
					const hasActiveItem = section.items.some((item) =>
						isLinkActive(item.href),
					);

					return (
						<div key={sectionKey}>
							{sidebarOpen && (
								<button
									onClick={() => toggleSection(sectionKey)}
									className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-700 transition text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
								>
									<span>{section.label}</span>
									<ChevronDown
										size={16}
										className={`transition-transform ${
											isExpanded ? 'rotate-180' : ''
										}`}
									/>
								</button>
							)}

							{isExpanded && (
								<div className="space-y-1">
									{section.items.map((item) => {
										const isActive = isLinkActive(item.href);
										return (
											<Link key={item.href} href={item.href}>
												<button
													className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm group ${
														isActive
															? 'bg-blue-600 text-white shadow-lg'
															: 'text-gray-300 hover:bg-gray-700 hover:text-white'
													}`}
												>
													<span className="text-lg">{item.icon}</span>
													{sidebarOpen && (
														<span
															className={`flex-1 text-left ${
																isActive ? 'font-semibold' : ''
															}`}
														>
															{item.label}
														</span>
													)}
													{sidebarOpen && isActive && (
														<div className="w-2 h-2 bg-white rounded-full" />
													)}
												</button>
											</Link>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</nav>

			{/* Stats Footer */}
			{sidebarOpen && (
				<div className="p-4 border-t border-gray-700 bg-gray-900/50 space-y-3">
					<div className="text-xs text-gray-400">
						<p className="font-semibold mb-1">System Status</p>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
							<span>Operational</span>
						</div>
					</div>
					<div className="text-xs text-gray-400">
						<p className="font-semibold mb-1">Uptime</p>
						<p>99.99%</p>
					</div>
				</div>
			)}

			{/* Logout Button */}
			<div className="p-4 border-t border-gray-700">
				<Button
					variant="outline"
					className="w-full justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 border-red-700/50 text-red-200 hover:text-red-100"
				>
					<LogOut size={18} />
					{sidebarOpen && <span>Logout</span>}
				</Button>
			</div>
		</aside>
	);
}
