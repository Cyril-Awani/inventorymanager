'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CreditsData {
	credits: Array<{
		id: string;
		customerName: string;
		totalOwed: number;
		totalPaid: number;
		remainingBalance: number;
		paymentStatus: string;
		store: {
			businessName: string;
		};
	}>;
	pagination: {
		total: number;
		pages: number;
	};
}

export default function ReportsPage() {
	const [creditStats, setCreditStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchCreditReports();
	}, []);

	const fetchCreditReports = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/credits?limit=1000');
			const data: CreditsData = await response.json();

			const stats = {
				totalCredits: data.pagination.total,
				totalOwed: data.credits.reduce((sum, c) => sum + c.totalOwed, 0),
				totalPaid: data.credits.reduce((sum, c) => sum + c.totalPaid, 0),
				totalRemaining: data.credits.reduce(
					(sum, c) => sum + c.remainingBalance,
					0
				),
				pendingCount: data.credits.filter((c) => c.paymentStatus === 'pending')
					.length,
				paidCount: data.credits.filter((c) => c.paymentStatus === 'paid')
					.length,
				byStore: data.credits.reduce(
					(acc: any, credit) => {
						const store = credit.store.businessName;
						if (!acc[store]) {
							acc[store] = {
								totalOwed: 0,
								totalPaid: 0,
								count: 0,
							};
						}
						acc[store].totalOwed += credit.totalOwed;
						acc[store].totalPaid += credit.totalPaid;
						acc[store].count += 1;
						return acc;
					},
					{}
				),
			};

			setCreditStats(stats);
		} catch (error) {
			console.error('Failed to fetch credit reports:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8">
			<Link href="/">
				<Button variant="outline" className="mb-6">
					← Back
				</Button>
			</Link>

			<h2 className="text-3xl font-bold text-gray-800 mb-8">
				Reports & Analytics
			</h2>

			{loading ? (
				<div className="text-gray-500">Loading reports...</div>
			) : creditStats ? (
				<>
					{/* Credit Summary */}
					<div className="mb-8">
						<h3 className="text-2xl font-bold text-gray-800 mb-4">
							Credits Summary
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Total Credits</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-gray-800">
										{creditStats.totalCredits}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Total Owed</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-red-600">
										₦{creditStats.totalOwed.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Total Paid</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-green-600">
										₦{creditStats.totalPaid.toLocaleString()}
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Remaining Balance</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-orange-600">
										₦{creditStats.totalRemaining.toLocaleString()}
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* Payment Status */}
					<div className="mb-8">
						<h3 className="text-2xl font-bold text-gray-800 mb-4">
							Payment Status
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle>Pending Payments</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-4xl font-bold text-orange-600">
										{creditStats.pendingCount}
									</div>
									<p className="text-gray-600 mt-2">credits awaiting payment</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Completed Payments</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-4xl font-bold text-green-600">
										{creditStats.paidCount}
									</div>
									<p className="text-gray-600 mt-2">credits fully paid</p>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* By Store */}
					<div className="mb-8">
						<h3 className="text-2xl font-bold text-gray-800 mb-4">
							Credits by Store
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{Object.entries(creditStats.byStore).map(
								([storeName, data]: any) => (
									<Card key={storeName}>
										<CardHeader>
											<CardTitle className="text-lg">{storeName}</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												<div className="flex justify-between">
													<span className="text-gray-600">Total Credits:</span>
													<span className="font-semibold">{data.count}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Total Owed:</span>
													<span className="font-semibold text-red-600">
														₦{data.totalOwed.toLocaleString()}
													</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-600">Total Paid:</span>
													<span className="font-semibold text-green-600">
														₦{data.totalPaid.toLocaleString()}
													</span>
												</div>
												<div className="flex justify-between pt-2 border-t">
													<span className="text-gray-600">Remaining:</span>
													<span className="font-semibold text-orange-600">
														₦
														{(data.totalOwed - data.totalPaid).toLocaleString()}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								)
							)}
						</div>
					</div>

					{/* Quick Links */}
					<div className="flex gap-4">
						<Link href="/sales">
							<Button>View Sales Report</Button>
						</Link>
						<Link href="/products">
							<Button variant="outline">View Inventory Report</Button>
						</Link>
					</div>
				</>
			) : (
				<div className="text-red-500">Failed to load reports</div>
			)}
		</div>
	);
}
