'use client';

import { AdminTopNav } from './admin-topnav';

export function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<AdminTopNav />
			<main className="flex-1 overflow-auto p-6">{children}</main>
		</div>
	);
}
