'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { Button } from '@/components/ui/button';

export default function AdminLoginPage() {
	const { login, isLoading } = useStoreAuth();
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		try {
			const res = await login(email, password);
			if (res) router.push('/recommendations');
		} catch (err: any) {
			setError(err?.message || 'Login failed');
		}
	};

	const createDevAdmin = async () => {
		try {
			const res = await fetch('/api/dev/create-admin', { method: 'POST' });
			const jb = await res.json();
			if (!res.ok) throw new Error(jb?.error || 'Failed');
			// auto-fill and login
			setEmail('admin@local');
			setPassword('password');
			// small delay then attempt login
			setTimeout(
				() =>
					login('admin@local', 'password')
						.then(() => router.push('/recommendations'))
						.catch(() => {}),
				250,
			);
		} catch (err: any) {
			setError(err?.message || 'Dev admin creation failed');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md bg-white rounded-lg shadow p-6">
				<h2 className="text-2xl font-semibold mb-4">Admin Sign In</h2>
				<form onSubmit={onSubmit} className="space-y-3">
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full border p-2 rounded"
						required
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full border p-2 rounded"
						required
					/>
					{error && <div className="text-sm text-red-600">{error}</div>}
					<div className="flex items-center justify-between">
						<Button type="submit" disabled={isLoading}>
							{isLoading ? 'Signing in...' : 'Sign in'}
						</Button>
						<a href="/signup" className="text-sm text-blue-600">
							Create account
						</a>
					</div>
					{process.env.NODE_ENV !== 'production' && (
						<div className="mt-3">
							<button
								type="button"
								onClick={createDevAdmin}
								className="px-3 py-2 bg-gray-100 rounded text-sm"
							>
								Create dev admin (localhost only)
							</button>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}
