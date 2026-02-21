'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
	Search,
	ChevronLeft,
	ChevronRight,
	AlertCircle,
	CheckCircle,
} from 'lucide-react';

interface Merchant {
	id: string;
	businessName: string;
	email: string;
	storeType: string;
	kycStatus: string;
	riskTier: string;
	totalTransactions: number;
	monthlyVolume: number;
	setupCompleted: boolean;
	createdAt: string;
}

export default function MerchantsPage() {
	const [merchants, setMerchants] = useState<Merchant[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterRisk, setFilterRisk] = useState('all');
	const pageSize = 10;

	useEffect(() => {
		const fetchMerchants = async () => {
			try {
				const params = new URLSearchParams({
					page: currentPage.toString(),
					limit: pageSize.toString(),
					search: searchTerm,
				});

				const response = await fetch(`/api/stores?${params}`);
				const data = await response.json();

				// Transform and add calculated fields
				const enrichedMerchants = (data.stores || []).map((store: any) => ({
					id: store.id,
					businessName: store.businessName,
					email: store.email,
					storeType: store.storeType || 'Retail',
					kycStatus: Math.random() > 0.3 ? 'verified' : 'pending', // Mock for demo
					riskTier: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
					totalTransactions: Math.floor(Math.random() * 5000) + 100,
					monthlyVolume: Math.floor(Math.random() * 50000000) + 1000000,
					setupCompleted: store.email ? true : false,
					createdAt: store.createdAt,
				}));

				setMerchants(enrichedMerchants);
			} catch (error) {
				console.error('Error fetching merchants:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchMerchants();
	}, [currentPage, searchTerm]);

	const filteredMerchants = merchants.filter((merchant) => {
		let match = true;

		if (filterStatus !== 'all') {
			match = match && merchant.kycStatus === filterStatus;
		}

		if (filterRisk !== 'all') {
			match = match && merchant.riskTier === filterRisk;
		}

		return match;
	});

	const getKYCBadge = (status: string) => {
		switch (status) {
			case 'verified':
				return (
					<Badge className="bg-green-100 text-green-800 flex items-center gap-1">
						<CheckCircle size={14} /> Verified
					</Badge>
				);
			case 'pending':
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
						<AlertCircle size={14} /> Pending
					</Badge>
				);
			default:
				return <Badge variant="outline">Unknown</Badge>;
		}
	};

	const getRiskBadge = (risk: string) => {
		const colorMap: Record<string, string> = {
			low: 'bg-green-50 text-green-700 border-green-200',
			medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
			high: 'bg-red-50 text-red-700 border-red-200',
		};

		return (
			<Badge variant="outline" className={colorMap[risk] || ''}>
				{risk.toUpperCase()}
			</Badge>
		);
	};

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">Merchants</h1>
				<p className="text-gray-600 mt-2">
					Manage all merchants and their KYC/compliance status
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Total Active</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{merchants.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">KYC Verified</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{merchants.filter((m) => m.kycStatus === 'verified').length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Pending Review</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{merchants.filter((m) => m.kycStatus === 'pending').length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">High Risk</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{merchants.filter((m) => m.riskTier === 'high').length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Search & Filter</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search
								className="absolute left-3 top-3 text-gray-400"
								size={18}
							/>
							<Input
								placeholder="Search merchants..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-10"
							/>
						</div>

						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="KYC Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="verified">Verified</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
							</SelectContent>
						</Select>

						<Select value={filterRisk} onValueChange={setFilterRisk}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Risk Tier" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Tiers</SelectItem>
								<SelectItem value="low">Low Risk</SelectItem>
								<SelectItem value="medium">Medium Risk</SelectItem>
								<SelectItem value="high">High Risk</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Merchants Table */}
			<Card>
				<CardHeader>
					<CardTitle>Merchant List</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Loading merchants...</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Business Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Store Type</TableHead>
											<TableHead>KYC Status</TableHead>
											<TableHead>Risk Tier</TableHead>
											<TableHead>Transactions</TableHead>
											<TableHead>Monthly Volume</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredMerchants.length > 0 ? (
											filteredMerchants.map((merchant) => (
												<TableRow key={merchant.id}>
													<TableCell className="font-semibold">
														{merchant.businessName}
													</TableCell>
													<TableCell>{merchant.email}</TableCell>
													<TableCell>{merchant.storeType}</TableCell>
													<TableCell>
														{getKYCBadge(merchant.kycStatus)}
													</TableCell>
													<TableCell>
														{getRiskBadge(merchant.riskTier)}
													</TableCell>
													<TableCell className="text-right">
														{merchant.totalTransactions.toLocaleString()}
													</TableCell>
													<TableCell className="text-right font-mono">
														₦{(merchant.monthlyVolume / 1000000).toFixed(1)}M
													</TableCell>
													<TableCell>
														<Button size="sm" variant="outline">
															View
														</Button>
													</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={8}
													className="text-center py-8 text-gray-500"
												>
													No merchants found
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<div className="flex items-center justify-between pt-6 border-t">
								<div className="text-sm text-gray-600">
									Page {currentPage} of{' '}
									{Math.ceil(merchants.length / pageSize) || 1}
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										<ChevronLeft size={18} />
										Previous
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setCurrentPage((p) => p + 1)}
										disabled={
											currentPage >= Math.ceil(merchants.length / pageSize)
										}
									>
										Next
										<ChevronRight size={18} />
									</Button>
								</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
