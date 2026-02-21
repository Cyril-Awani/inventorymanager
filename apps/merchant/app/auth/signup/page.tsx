'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { useStoreAuth } from '@/hooks/use-store-auth';

export default function SignupPage() {
	const router = useRouter();
	const { signup, isLoading } = useStoreAuth();
	const [error, setError] = useState<string>('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [businessName, setBusinessName] = useState('');
	const [currency, setCurrency] = useState('NGN');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		try {
			await signup(email, password, businessName, currency);
			router.push('/onboarding');
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
									Business Name
								</label>
								<Input
									type="text"
									value={businessName}
									onChange={(e) => setBusinessName(e.target.value)}
									placeholder="Your store name"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Currency
								</label>
								<select
									value={currency}
									onChange={(e) => setCurrency(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
								>
									<option value="NGN">NGN - Nigerian Naira</option>
									<option value="USD">USD - US Dollar</option>
									<option value="GBP">GBP - British Pound</option>
									<option value="EUR">EUR - Euro</option>
								</select>
							</div>

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
									placeholder="Minimum 6 characters"
									required
								/>
							</div>

							{error && (
								<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
									{error}
								</div>
							)}

							<Button type="submit" disabled={isLoading} className="w-full">
								{isLoading ? 'Creating account...' : 'Create Store'}
							</Button>
						</form>

						{/* Login link */}
						<div className="mt-6 text-center">
							<p className="text-gray-600 text-sm">
								Already have an account?{' '}
								<Link
									href="/auth/login"
									className="text-indigo-600 hover:text-indigo-700 font-medium"
								>
									Login
								</Link>
							</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
