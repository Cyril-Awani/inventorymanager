'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

export default function AuthPage() {
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

						{/* Welcome message */}
						<div className="text-center mb-8">
							<p className="text-gray-700 text-lg font-medium">Welcome</p>
							<p className="text-gray-600 text-sm mt-2">
								Choose an option to continue
							</p>
						</div>

						{/* Buttons */}
						<div className="space-y-3">
							<Link href="/auth/login" className="block">
								<Button className="w-full bg-indigo-600 hover:bg-indigo-700">
									Login
								</Button>
							</Link>
							<Link href="/auth/signup" className="block">
								<Button
									variant="ghost"
									className="w-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
								>
									Sign Up
								</Button>
							</Link>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
