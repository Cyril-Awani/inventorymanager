'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useStoreAuth } from '@/hooks/use-store-auth';

export default function LoginPage() {
	const router = useRouter();
	const { login, isLoading } = useStoreAuth();
	const [error, setError] = useState<string>('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			await login(email, password);
			router.push('/sales');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="w-full max-w-md">
				<Card className="shadow-lg">
					<div className="p-8">
						{/* Logo/Title */}
						<div className="text-center mb-8">
							<h1 className="text-3xl font-bold text-gray-900">PORES</h1>
							<p className="text-gray-600 mt-2">Point of Sale System</p>
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Email
								</label>
								<Input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Password
								</label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter password"
									required
								/>
							</div>

							{error && (
								<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
									{error}
								</div>
							)}

							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? 'Logging in...' : 'Login'}
							</Button>
						</form>

						{/* Sign up link */}
						<div className="mt-6 text-center">
							<p className="text-gray-600 text-sm">
								Don't have an account?{' '}
								<Link
									href="/auth/signup"
									className="text-indigo-600 hover:text-indigo-700 font-medium"
								>
									Sign up
								</Link>
							</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
