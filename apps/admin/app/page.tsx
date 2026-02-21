'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
	return (
		<div className="p-10">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-10">
					<h1 className="text-4xl font-bold text-gray-900">
						POS Platform Admin
					</h1>
					<p className="text-gray-600 mt-2">
						Manage merchants, transactions, and platform operations
					</p>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm text-gray-600">
								Platform Status
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								<span className="font-semibold">Operational</span>
							</div>
							<p className="text-xs text-gray-500 mt-2">99.99% Uptime</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm text-gray-600">
								Active Merchants
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">1,247</div>
							<p className="text-xs text-green-600 mt-2">
								↑ 12% from last month
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm text-gray-600">
								Daily Volume
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-blue-600">₦2.4B</div>
							<p className="text-xs text-gray-500 mt-2">Across all merchants</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm text-gray-600">
								Pending Review
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-orange-600">23</div>
							<p className="text-xs text-gray-500 mt-2">KYC verifications</p>
						</CardContent>
					</Card>
				</div>

				{/* Main Navigation Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
					{/* Core Functions */}
					<Card>
						<CardHeader>
							<CardTitle>Core Functions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-3">
								<Link href="/merchants">
									<Button className="w-full h-24 flex flex-col items-center justify-center gap-2">
										<span className="text-3xl">🏪</span>
										<span className="text-xs">Merchants</span>
									</Button>
								</Link>
								<Link href="/transactions">
									<Button
										className="w-full h-24 flex flex-col items-center justify-center gap-2"
										variant="outline"
									>
										<span className="text-3xl">💳</span>
										<span className="text-xs">Transactions</span>
									</Button>
								</Link>
								<Link href="/payouts">
									<Button
										className="w-full h-24 flex flex-col items-center justify-center gap-2"
										variant="outline"
									>
										<span className="text-3xl">💸</span>
										<span className="text-xs">Payouts</span>
									</Button>
								</Link>
								<Link href="/compliance">
									<Button
										className="w-full h-24 flex flex-col items-center justify-center gap-2"
										variant="outline"
									>
										<span className="text-3xl">✓</span>
										<span className="text-xs">Compliance</span>
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>

					{/* Alerts & Monitoring */}
					<Card>
						<CardHeader>
							<CardTitle>Alerts & Monitoring</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
									<div>
										<p className="font-semibold text-sm">
											High Chargeback Rate
										</p>
										<p className="text-xs text-gray-600">
											Merchant #4521 - 8.2%
										</p>
									</div>
									<Button size="sm" variant="ghost">
										→
									</Button>
								</div>
								<div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
									<div>
										<p className="font-semibold text-sm">API Rate Limit</p>
										<p className="text-xs text-gray-600">
											Merchant #8834 - 95% usage
										</p>
									</div>
									<Button size="sm" variant="ghost">
										→
									</Button>
								</div>
								<div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
									<div>
										<p className="font-semibold text-sm">KYC Expiring</p>
										<p className="text-xs text-gray-600">
											23 merchants - 7 days
										</p>
									</div>
									<Button size="sm" variant="ghost">
										→
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Additional Resources */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Access</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
							<Link href="/transactions">
								<Button className="w-full" size="sm">
									Recent Transactions
								</Button>
							</Link>
							<Link href="#pending">
								<Button className="w-full" size="sm" variant="outline">
									Pending Disputes
								</Button>
							</Link>
							<Link href="/reports">
								<Button className="w-full" size="sm" variant="outline">
									Generate Report
								</Button>
							</Link>
							<Link href="/compliance">
								<Button className="w-full" size="sm" variant="outline">
									KYC Review
								</Button>
							</Link>
							<Link href="#settings">
								<Button className="w-full" size="sm" variant="outline">
									Settings
								</Button>
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
