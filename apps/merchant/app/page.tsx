'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreAuth } from '@/hooks/use-store-auth';

export default function Home() {
	const router = useRouter();
	const { auth, isLoading } = useStoreAuth();

	useEffect(() => {
		if (!isLoading) {
			if (!auth) {
				router.push('/auth');
			} else if (!auth.store.setupCompleted) {
				router.push('/onboarding');
			} else {
				// Already logged in and setup complete → go to sales
				router.push('/sales');
			}
		}
	}, [auth, isLoading, router]);

	if (isLoading || !auth) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return null;
}
