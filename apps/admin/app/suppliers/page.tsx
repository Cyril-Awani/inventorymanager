'use client';

import React, { useState, useMemo } from 'react';
import {
	Search,
	MapPin,
	Mail,
	Phone,
	TrendingUp,
	Filter,
	Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SuppliersPage() {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [selectedStatus, setSelectedStatus] = useState('all');

	// Mock supplier data
	const suppliers = [
		{
			id: 's001',
			companyName: 'Fresh Farms Limited',
			contactPerson: 'David Mutua',
			email: 'supply@freshfarms.ug',
			phone: '+256 701 111111',
			region: 'Mukono',
			category: 'Agriculture',
			productCount: 12,
			totalOrders: 45,
			totalValue: 18500000,
			paymentTerms: '30 days',
			status: 'active',
			rating: 4.8,
		},
		{
			id: 's002',
			companyName: 'Urban Manufacturing Co.',
			contactPerson: 'Robert Nyakoye',
			email: 'sales@urbanmfg.ug',
			phone: '+256 702 222222',
			region: 'Kampala',
			category: 'Manufactured Goods',
			productCount: 28,
			totalOrders: 67,
			totalValue: 42300000,
			paymentTerms: '15 days',
			status: 'active',
			rating: 4.6,
		},
		{
			id: 's003',
			companyName: 'Coastal Imports Ltd',
			contactPerson: 'Patricia Ouma',
			email: 'import@coastal.ke',
			phone: '+254 701 333333',
			region: 'Mombasa',
			category: 'Imports',
			productCount: 54,
			totalOrders: 92,
			totalValue: 76500000,
			paymentTerms: '45 days',
			status: 'active',
			rating: 4.4,
		},
		{
			id: 's004',
			companyName: 'Quality Beverages Inc',
			contactPerson: 'Michael Adeyemi',
			email: 'orders@qbev.ng',
			phone: '+234 701 444444',
			region: 'Lagos',
			category: 'Beverages',
			productCount: 8,
			totalOrders: 31,
			totalValue: 12400000,
			paymentTerms: '30 days',
			status: 'onboarding',
			rating: 0,
		},
		{
			id: 's005',
			companyName: 'Tech Supplies Africa',
			contactPerson: 'Grace Kipchoge',
			email: 'supply@techsupplyafrica.com',
			phone: '+256 703 555555',
			region: 'Nairobi',
			category: 'Electronics',
			productCount: 95,
			totalOrders: 124,
			totalValue: 89700000,
			paymentTerms: '7 days',
			status: 'active',
			rating: 4.9,
		},
		{
			id: 's006',
			companyName: 'Fashion Wholesalers',
			contactPerson: 'Charlotte Mueni',
			email: 'wholesale@fashionwholesale.ug',
			phone: '+256 704 666666',
			region: 'Kampala',
			category: 'Fashion',
			productCount: 156,
			totalOrders: 78,
			totalValue: 34200000,
			paymentTerms: '60 days',
			status: 'active',
			rating: 4.3,
		},
		{
			id: 's007',
			companyName: 'Medical Supplies Hub',
			contactPerson: 'Dr. Samuel Kiplagat',
			email: 'medical@supplyhub.org',
			phone: '+256 705 777777',
			region: 'Kampala',
			category: 'Medical',
			productCount: 42,
			totalOrders: 12,
			totalValue: 8900000,
			paymentTerms: '14 days',
			status: 'inactive',
			rating: 4.7,
		},
	];

	const categories = [
		'all',
		'Agriculture',
		'Manufactured Goods',
		'Imports',
		'Beverages',
		'Electronics',
		'Fashion',
		'Medical',
	];

	// Filter suppliers
	const filteredSuppliers = useMemo(() => {
		return suppliers.filter((supplier) => {
			const matchesSearch =
				supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesCategory =
				selectedCategory === 'all' || supplier.category === selectedCategory;
			const matchesStatus =
				selectedStatus === 'all' || supplier.status === selectedStatus;

			return matchesSearch && matchesCategory && matchesStatus;
		});
	}, [searchTerm, selectedCategory, selectedStatus]);

	// Calculate stats
	const stats = {
		totalSuppliers: suppliers.length,
		activeSuppliers: suppliers.filter((s) => s.status === 'active').length,
		totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0),
		avgRating:
			suppliers
				.filter((s) => s.rating > 0)
				.reduce((sum, s) => sum + s.rating, 0) /
			Math.max(suppliers.filter((s) => s.rating > 0).length, 1),
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
				<h1 className="text-4xl font-bold text-gray-900">Suppliers</h1>
				<p className="text-gray-600 mt-2">
					Manage your supplier network and inventory partnerships
				</p>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Suppliers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-gray-900">
							{stats.totalSuppliers}
						</div>
						<p className="text-sm text-gray-500 mt-1">
							{stats.activeSuppliers} active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Total Inventory Value
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-purple-600">
							{formatCurrency(stats.totalValue)}
						</div>
						<p className="text-sm text-gray-500 mt-1">From all suppliers</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Avg Supplier Rating
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-yellow-500">
							{stats.avgRating.toFixed(2)}
						</div>
						<p className="text-sm text-gray-500 mt-1">Out of 5.0</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">
							Categories
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<Package className="w-6 h-6 text-blue-600" />
							<div className="text-3xl font-bold text-blue-600">
								{categories.length - 1}
							</div>
						</div>
						<p className="text-sm text-gray-500 mt-1">Active categories</p>
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
									placeholder="Company name or email..."
									className="pl-10"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Category
							</label>
							<select
								value={selectedCategory}
								onChange={(e) => setSelectedCategory(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{categories.map((category) => (
									<option key={category} value={category}>
										{category === 'all' ? 'All Categories' : category}
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
								<option value="onboarding">Onboarding</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Suppliers Table */}
			<Card>
				<CardHeader>
					<CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Company
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Contact
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Category
									</th>
									<th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
										Products
									</th>
									<th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
										Orders
									</th>
									<th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
										Total Value
									</th>
									<th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
										Rating
									</th>
									<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredSuppliers.map((supplier) => (
									<tr
										key={supplier.id}
										className="border-b border-gray-100 hover:bg-gray-50"
									>
										<td className="px-6 py-4">
											<div>
												<div className="font-medium text-gray-900">
													{supplier.companyName}
												</div>
												<div className="text-sm text-gray-500">
													ID: {supplier.id}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="space-y-1">
												<div className="text-sm font-medium text-gray-900">
													{supplier.contactPerson}
												</div>
												<div className="flex items-center gap-1 text-sm text-gray-600">
													<Mail className="w-3 h-3" />
													{supplier.email}
												</div>
												<div className="flex items-center gap-1 text-sm text-gray-600">
													<Phone className="w-3 h-3" />
													{supplier.phone}
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{supplier.category}
												</div>
												<div className="text-xs text-gray-500">
													{supplier.region}
												</div>
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="font-medium text-gray-900">
												{supplier.productCount}
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="font-medium text-gray-900">
												{supplier.totalOrders}
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											<div className="font-medium text-gray-900">
												{formatCurrency(supplier.totalValue)}
											</div>
										</td>
										<td className="px-6 py-4 text-center">
											{supplier.rating > 0 ? (
												<div className="flex items-center justify-center gap-1">
													<span className="font-medium text-yellow-500">★</span>
													<span className="text-sm font-medium text-gray-900">
														{supplier.rating.toFixed(1)}
													</span>
												</div>
											) : (
												<span className="text-sm text-gray-500">New</span>
											)}
										</td>
										<td className="px-6 py-4">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													supplier.status === 'active'
														? 'bg-green-100 text-green-800'
														: supplier.status === 'onboarding'
															? 'bg-blue-100 text-blue-800'
															: 'bg-gray-100 text-gray-800'
												}`}
											>
												{supplier.status.charAt(0).toUpperCase() +
													supplier.status.slice(1)}
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
