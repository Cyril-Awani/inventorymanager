'use client';

import LoginPage from '@/app/login/page';

// Simple wrapper so the login UI is also available at /admin/login
export default function AdminLoginAlias() {
	return <LoginPage />;
}
