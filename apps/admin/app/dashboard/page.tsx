'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Analytics {
	summary: {
		totalStores: number;
		totalSales: number;
		recentSales: number;
		activeWorkers: number;
		totalRevenue: number;
		totalCosts: number;
		profit: number;
		pendingCredits: number;
	};
	topWorkers: Array<{
		id: string;
		name: string;
		salesCount: number;
		totalAmount: number;
	}>;
	recentSales: Array<{
		id: string;
		transactionId: string;
		storeName: string;
		workerName: string;
		totalPrice: number;
		createdAt: string;
	}>;
}

export default function DashboardPage() {
	const [analytics, setAnalytics] = useState<Analytics | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch('/api/analytics')
			.then((res) => res.json())
			.then((data) => {
				setAnalytics(data);
				setLoading(false);
			})
			.catch((err) => {
				console.error('Failed to fetch analytics:', err);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<div className="p-8">
				<div className="text-gray-500">Loading dashboard...</div>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className="p-8">
				<div className="text-red-500">Failed to load analytics data</div>
			</div>
		);
	}

	const platformMetrics = [
		{
			title: 'Active Merchants',
			value: analytics.summary.totalStores,
			icon: '🏪',
			change: '+12%',
			color: 'text-blue-600',
		},
		{
			title: 'Total Transactions',
			value: analytics.summary.totalSales,
			icon: '💳',
			change: '+23%',
			color: 'text-green-600',
		},
		{
			title: 'Platform Revenue (GMV)',
			value: `₦${(analytics.summary.totalRevenue || 0).toLocaleString()}`,
			icon: '💰',
			change: '+18%',
			color: 'text-purple-600',
		},
		{
			title: 'Processing Volume',
			value: `₦${(analytics.summary.totalCosts || 0).toLocaleString()}`,
			icon: '📊',
			change: '+15%',
			color: 'text-orange-600',
		},
	];

	return (
		<div className="p-8 bg-gray-50 min-h-screen">
			<div className="mb-8">
				<h1 className="text-4xl font-bold text-gray-900">
					POS Platform Overview
				</h1>
				<p className="text-gray-600 mt-2">
					Company-wide metrics and system health
				</p>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				{platformMetrics.map((metric, index) => (
					<Card key={index} className="border-l-4 border-l-blue-500">
						<CardHeader className="pb-3">
							<div className="flex justify-between items-start">
								<CardTitle className="text-sm font-medium text-gray-600">
									{metric.title}
								</CardTitle>
								<span className="text-2xl">{metric.icon}</span>
							</div>
						</CardHeader>
						<CardContent>
							<div className={`text-2xl font-bold ${metric.color}`}>
								{metric.value}
							</div>
							<p className="text-xs text-green-600 mt-2">
								{metric.change} this month
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Financial Summary */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Net Platform Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600 mb-2">
							₦{(analytics.summary.profit || 0).toLocaleString()}
						</div>
						<p className="text-sm text-gray-600">Revenue after costs</p>
						<div className="mt-4 pt-4 border-t">
							<div className="flex justify-between text-sm mb-2">
								<span>Processing Fees:</span>
								<span className="font-semibold">2.5%</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Settlement Cycle:</span>
								<span className="font-semibold">T+2 Days</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Credit Exposure</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-orange-600 mb-2">
							₦{(analytics.summary.pendingCredits || 0).toLocaleString()}
						</div>
						<p className="text-sm text-gray-600">
							Outstanding merchant credits
						</p>
						<Button className="w-full mt-4" variant="outline" size="sm">
							View Disputes
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Health</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">API Uptime</span>
								<span className="text-green-600 font-bold">99.99%</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">Response Time</span>
								<span className="font-bold">245ms</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600">
									Active Connections
								</span>
								<span className="font-bold">
									{analytics.summary.activeWorkers}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Top Performing Merchants</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{analytics.topWorkers.slice(0, 5).length > 0 ? (
								analytics.topWorkers.slice(0, 5).map((worker, index) => (
									<div
										key={worker.id}
										className="flex justify-between items-center pb-3 border-b last:border-0"
									>
										<div>
											<p className="font-semibold text-gray-800">
												#{index + 1} {worker.name}
											</p>
											<p className="text-xs text-gray-500">
												{worker.salesCount} transactions
											</p>
										</div>
										<p className="font-bold text-green-600">
											₦{worker.totalAmount.toLocaleString()}
										</p>
									</div>
								))
							) : (
								<p className="text-gray-500 text-sm">No merchant data</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Transactions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{analytics.recentSales.slice(0, 5).length > 0 ? (
								analytics.recentSales.slice(0, 5).map((sale) => (
									<div
										key={sale.id}
										className="flex justify-between items-center pb-3 border-b last:border-0 text-sm"
									>
										<div>
											<p className="font-semibold text-gray-800">
												{sale.storeName}
											</p>
											<p className="text-xs text-gray-500">
												{new Date(sale.createdAt).toLocaleDateString()}
											</p>
										</div>
										<p className="font-bold">
											₦{sale.totalPrice.toLocaleString()}
										</p>
									</div>
								))
							) : (
								<p className="text-gray-500 text-sm">No recent data</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Admin Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						<Link href="/merchants">
							<Button className="w-full" size="sm">
								🏪 Merchants
							</Button>
						</Link>
						<Link href="/transactions">
							<Button className="w-full" size="sm" variant="outline">
								💳 Transactions
							</Button>
						</Link>
						<Link href="/payouts">
							<Button className="w-full" size="sm" variant="outline">
								💸 Payouts
							</Button>
						</Link>
						<Link href="/compliance">
							<Button className="w-full" size="sm" variant="outline">
								✓ Compliance
							</Button>
						</Link>
						<Link href="/reports">
							<Button className="w-full" size="sm" variant="outline">
								📊 Reports
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
