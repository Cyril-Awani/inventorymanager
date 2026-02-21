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
	PieChart,
	Pie,
	Cell,
	Legend,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from 'recharts';
import {
	Search,
	AlertTriangle,
	CheckCircle,
	Clock,
	FileText,
	Shield,
} from 'lucide-react';

interface KYCRecord {
	id: string;
	merchant: string;
	email: string;
	kycStatus: string;
	riskScore: number;
	riskTier: string;
	verificationDate?: string;
	expiryDate?: string;
	documents: {
		businessRegistration: boolean;
		ownerID: boolean;
		bankStatement: boolean;
		addressProof: boolean;
	};
	flags: string[];
}

export default function CompliancePage() {
	const [kycRecords, setKYCRecords] = useState<KYCRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterRisk, setFilterRisk] = useState('all');

	// Chart data
	const verificationStatusData = [
		{ name: 'Verified', value: 42, fill: '#10b981' },
		{ name: 'Pending', value: 18, fill: '#f59e0b' },
		{ name: 'Rejected', value: 5, fill: '#ef4444' },
	];

	const riskDistributionData = [
		{ risk: 'Low', count: 38 },
		{ risk: 'Medium', count: 20 },
		{ risk: 'High', count: 9 },
	];

	useEffect(() => {
		const mockKYCData: KYCRecord[] = [
			{
				id: 'KYC_001',
				merchant: 'ABC Electronics Store',
				email: 'contact@abcelectronics.com',
				kycStatus: 'verified',
				riskScore: 15,
				riskTier: 'low',
				verificationDate: '2024-01-10',
				expiryDate: '2025-01-10',
				documents: {
					businessRegistration: true,
					ownerID: true,
					bankStatement: true,
					addressProof: true,
				},
				flags: [],
			},
			{
				id: 'KYC_002',
				merchant: 'XYZ Fashion',
				email: 'info@xyzfashion.com',
				kycStatus: 'pending',
				riskScore: 62,
				riskTier: 'medium',
				documents: {
					businessRegistration: true,
					ownerID: true,
					bankStatement: false,
					addressProof: true,
				},
				flags: ['Missing bank statement', 'Unusual transaction pattern'],
			},
			{
				id: 'KYC_003',
				merchant: 'Tech Solutions Ltd',
				email: 'support@techsolutions.com',
				kycStatus: 'verified',
				riskScore: 22,
				riskTier: 'low',
				verificationDate: '2023-12-15',
				expiryDate: '2024-12-15',
				documents: {
					businessRegistration: true,
					ownerID: true,
					bankStatement: true,
					addressProof: true,
				},
				flags: [],
			},
			{
				id: 'KYC_004',
				merchant: 'Food Court Market',
				email: 'business@foodcourt.com',
				kycStatus: 'pending',
				riskScore: 78,
				riskTier: 'high',
				documents: {
					businessRegistration: false,
					ownerID: true,
					bankStatement: false,
					addressProof: false,
				},
				flags: [
					'Missing critical documents',
					'High chargeback rate',
					'New merchant',
				],
			},
			{
				id: 'KYC_005',
				merchant: 'Beauty & Wellness',
				email: 'hello@beautywell.com',
				kycStatus: 'verified',
				riskScore: 28,
				riskTier: 'low',
				verificationDate: '2024-01-05',
				expiryDate: '2025-01-05',
				documents: {
					businessRegistration: true,
					ownerID: true,
					bankStatement: true,
					addressProof: true,
				},
				flags: [],
			},
		];

		setKYCRecords(mockKYCData);
		setLoading(false);
	}, []);

	const filteredRecords = kycRecords.filter((record) => {
		let match = true;

		if (searchTerm) {
			match =
				match &&
				(record.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
					record.email.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		if (filterStatus !== 'all') {
			match = match && record.kycStatus === filterStatus;
		}

		if (filterRisk !== 'all') {
			match = match && record.riskTier === filterRisk;
		}

		return match;
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'verified':
				return (
					<Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
						<CheckCircle size={14} /> Verified
					</Badge>
				);
			case 'pending':
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
						<Clock size={14} /> Pending
					</Badge>
				);
			case 'rejected':
				return (
					<Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
						<AlertTriangle size={14} /> Rejected
					</Badge>
				);
			default:
				return <Badge className="w-fit">{status}</Badge>;
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

	const getRiskScoreColor = (score: number) => {
		if (score < 40) return 'text-green-600';
		if (score < 70) return 'text-yellow-600';
		return 'text-red-600';
	};

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">Compliance & KYC</h1>
				<p className="text-gray-600 mt-2">
					Manage merchant verification status, risk assessment, and compliance
				</p>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Total Merchants</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{kycRecords.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Verified</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{kycRecords.filter((k) => k.kycStatus === 'verified').length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Pending Review</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							{kycRecords.filter((k) => k.kycStatus === 'pending').length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">High Risk</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{kycRecords.filter((k) => k.riskTier === 'high').length}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Compliance %</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{Math.round(
								(kycRecords.filter((k) => k.kycStatus === 'verified').length /
									kycRecords.length) *
									100,
							)}
							%
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Verification Status */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle size={20} />
							Verification Status Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={verificationStatusData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={100}
									dataKey="value"
									label
								>
									{verificationStatusData.map((entry) => (
										<Cell key={`cell-${entry.name}`} fill={entry.fill} />
									))}
								</Pie>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Risk Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield size={20} />
							Risk Tier Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={riskDistributionData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="risk" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="count" fill="#3b82f6" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* Search & Filter */}
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
								placeholder="Search by merchant name or email..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
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
								<SelectItem value="rejected">Rejected</SelectItem>
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

			{/* KYC Records Table */}
			<Card>
				<CardHeader>
					<CardTitle>KYC Records</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Merchant</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>KYC Status</TableHead>
									<TableHead>Risk Score</TableHead>
									<TableHead>Risk Tier</TableHead>
									<TableHead>Documents</TableHead>
									<TableHead>Verification Date</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredRecords.length > 0 ? (
									filteredRecords.map((record) => (
										<TableRow key={record.id}>
											<TableCell className="font-semibold">
												{record.merchant}
											</TableCell>
											<TableCell className="text-sm">{record.email}</TableCell>
											<TableCell>{getStatusBadge(record.kycStatus)}</TableCell>
											<TableCell>
												<span className={getRiskScoreColor(record.riskScore)}>
													{record.riskScore}
												</span>
											</TableCell>
											<TableCell>{getRiskBadge(record.riskTier)}</TableCell>
											<TableCell>
												<div className="flex gap-1">
													{record.documents.businessRegistration && (
														<span
															title="Business Registration"
															className="text-xs bg-green-100 px-2 py-1 rounded"
														>
															BR ✓
														</span>
													)}
													{record.documents.ownerID && (
														<span
															title="Owner ID"
															className="text-xs bg-green-100 px-2 py-1 rounded"
														>
															ID ✓
														</span>
													)}
													{record.documents.bankStatement && (
														<span
															title="Bank Statement"
															className="text-xs bg-green-100 px-2 py-1 rounded"
														>
															BS ✓
														</span>
													)}
													{record.documents.addressProof && (
														<span
															title="Address Proof"
															className="text-xs bg-green-100 px-2 py-1 rounded"
														>
															AP ✓
														</span>
													)}
												</div>
											</TableCell>
											<TableCell className="text-sm">
												{record.verificationDate || 'N/A'}
											</TableCell>
											<TableCell>
												<Button size="sm" variant="outline">
													Review
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
											No records found
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Risk Flags Display */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertTriangle size={20} className="text-red-600" />
						Pending Risk Flags
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{kycRecords
							.filter((r) => r.flags.length > 0)
							.map((record) => (
								<div
									key={record.id}
									className="p-4 bg-red-50 border border-red-200 rounded-lg"
								>
									<p className="font-semibold text-red-900">
										{record.merchant} ({record.id})
									</p>
									<div className="mt-2 space-y-1">
										{record.flags.map((flag, idx) => (
											<p key={idx} className="text-sm text-red-700">
												• {flag}
											</p>
										))}
									</div>
									<Button size="sm" className="mt-3" variant="outline">
										Report Suspicious Activity
									</Button>
								</div>
							))}
					</div>
				</CardContent>
			</Card>

			{/* Compliance Info */}
			<Card className="bg-blue-50 border-blue-200">
				<CardHeader>
					<CardTitle className="text-blue-900 flex items-center gap-2">
						<FileText size={24} />
						Compliance Requirements
					</CardTitle>
				</CardHeader>
				<CardContent className="text-blue-800 space-y-2">
					<p>
						<strong>Required Documents:</strong> Business Registration, Owner
						ID, Bank Statement (last 3 months), Address Proof
					</p>
					<p>
						<strong>Risk Scoring:</strong> Automated scoring based on
						transaction patterns, chargeback rates, and document verification
					</p>
					<p>
						<strong>Re-verification:</strong> Annual KYC re-verification
						required for all merchants
					</p>
					<p>
						<strong>Compliance Review:</strong> 72-hour SLA for KYC
						approval/rejection
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
