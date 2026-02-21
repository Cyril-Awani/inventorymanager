'use client';

import React, { useState, useMemo } from 'react';
import { Search, MapPin, Mail, Phone, TrendingUp, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRegion, setSelectedRegion] = useState('all');
	const [selectedStatus, setSelectedStatus] = useState('all');

	// Mock customer data
	const customers = [
		{
			id: 'c001',
			name: 'Sarah Johnson',
			email: 'sarah@example.com',
			phone: '+256 701 234567',
			region: 'Kampala',
			city: 'Kampala',
			totalSpent: 2500000,
			orderCount: 24,
			memberSince: '2023-06-15',
			status: 'active',
			lastOrder: '2024-02-14',
		},
		{
			id: 'c002',
			name: 'James Okonkwo',
			email: 'james@example.com',
			phone: '+256 702 345678',
			region: 'Lagos',
			city: 'Lagos',
			totalSpent: 3200000,
			orderCount: 31,
			memberSince: '2023-04-20',
			status: 'active',
			lastOrder: '2024-02-16',
		},
		{
			id: 'c003',
			name: 'Maria Santos',
			email: 'maria@example.com',
			phone: '+256 703 456789',
			region: 'Kampala',
			city: 'Makindye',
			totalSpent: 1800000,
			orderCount: 18,
			memberSince: '2023-08-10',
			status: 'active',
			lastOrder: '2024-02-10',
		},
		{
			id: 'c004',
			name: 'Ahmed Hassan',
			email: 'ahmed@example.com',
			phone: '+256 704 567890',
			region: 'Jinja',
			city: 'Jinja',
			totalSpent: 950000,
			orderCount: 8,
			memberSince: '2024-01-05',
			status: 'active',
			lastOrder: '2024-02-12',
		},
		{
			id: 'c005',
			name: 'Fatima Mutesi',
			email: 'fatima@example.com',
			phone: '+256 705 678901',
			region: 'Kampala',
			city: 'Nakawa',
			totalSpent: 0,
			orderCount: 0,
			memberSince: '2024-02-01',
			status: 'inactive',
			lastOrder: null,
		},
		{
			id: 'c006',
			name: 'John Smith',
			email: 'john@example.com',
			phone: '+256 706 789012',
			region: 'Mbarara',
			city: 'Mbarara',
			totalSpent: 1200000,
			orderCount: 12,
			memberSince: '2023-09-14',
			status: 'active',
			lastOrder: '2024-02-15',
		},
	];

	const regions = ['all', 'Kampala', 'Lagos', 'Jinja', 'Mbarara'];

	// Filter customers
	const filteredCustomers = useMemo(() => {
		return customers.filter((customer) => {
			const matchesSearch =
				customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				customer.email.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesRegion =
				selectedRegion === 'all' || customer.region === selectedRegion;
			const matchesStatus =
				selectedStatus === 'all' || customer.status === selectedStatus;

			return matchesSearch && matchesRegion && matchesStatus;
		});
	}, [searchTerm, selectedRegion, selectedStatus]);

	// Calculate stats
	const stats = {
		totalCustomers: customers.length,
		activeCustomers: customers.filter((c) => c.status === 'active').length,
		totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
		avgOrderValue:
			customers.reduce((sum, c) => sum + c.totalSpent, 0) /
			Math.max(
				customers.reduce((sum, c) => sum + c.orderCount, 0),
				1,
			),
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-UG', {
			style: 'currency',
			currency: 'UGX',
		}).format(amount);
	};

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">Customers</h1>
				<p className="text-gray-600 mt-2">
					Manage and analyze your customer base
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Customers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">
							{stats.totalCustomers}
						</div>
						<p className="text-sm text-gray-500 mt-1">
							{stats.activeCustomers} active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Revenue
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							{formatCurrency(stats.totalRevenue)}
						</div>
						<p className="text-sm text-gray-500 mt-1">Lifetime value</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Avg Order Value
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600">
							{formatCurrency(stats.avgOrderValue)}
						</div>
						<p className="text-sm text-gray-500 mt-1">Per transaction</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Growth
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<TrendingUp className="w-6 h-6 text-green-600" />
							<div className="text-3xl font-bold text-green-600">12%</div>
						</div>
						<p className="text-sm text-gray-500 mt-1">This month</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="w-5 h-5" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Search
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
								<Input
									placeholder="Name or email..."
									className="pl-10"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Region
							</label>
							<select
								value={selectedRegion}
								onChange={(e) => setSelectedRegion(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{regions.map((region) => (
									<option key={region} value={region}>
										{region === 'all' ? 'All Regions' : region}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Status
							</label>
							<select
								value={selectedStatus}
								onChange={(e) => setSelectedStatus(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="all">All Statuses</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Customers Table */}
			<Card>
				<CardHeader>
					<CardTitle>Customers ({filteredCustomers.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Customer
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Contact
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Location
									</th>
									<th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
										Total Spent
									</th>
									<th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
										Orders
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Last Order
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredCustomers.map((customer) => (
									<tr
										key={customer.id}
										className="border-b border-gray-100 hover:bg-gray-50"
									>
										<td className="px-6 py-4">
											<div>
												<div className="font-medium text-gray-900">
													{customer.name}
												</div>
												<div className="text-sm text-gray-500">
													ID: {customer.id}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2 text-sm text-gray-600">
													<Mail className="w-4 h-4" />
													{customer.email}
												</div>
												<div className="flex items-center gap-2 text-sm text-gray-600">
													<Phone className="w-4 h-4" />
													{customer.phone}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2 text-sm text-gray-600">
												<MapPin className="w-4 h-4" />
												<div>
													<div className="font-medium">{customer.city}</div>
													<div className="text-xs text-gray-500">
														{customer.region}
													</div>
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="font-medium text-gray-900">
												{formatCurrency(customer.totalSpent)}
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="font-medium text-gray-900">
												{customer.orderCount}
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-gray-500">
											{customer.lastOrder
												? new Date(customer.lastOrder).toLocaleDateString()
												: 'No orders'}
										</td>
										<td className="px-6 py-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													customer.status === 'active'
														? 'bg-green-100 text-green-800'
														: 'bg-gray-100 text-gray-800'
												}`}
											>
												{customer.status.charAt(0).toUpperCase() +
													customer.status.slice(1)}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
