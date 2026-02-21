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
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import {
	Search,
	AlertTriangle,
	TrendingUp,
	FileText,
	CheckCircle,
	Clock,
	AlertCircle,
} from 'lucide-react';

interface Dispute {
	id: string;
	transactionId: string;
	merchant: string;
	amount: number;
	reason: string;
	status: string;
	priority: string;
	createdDate: string;
	dueDate: string;
	evidence: boolean;
	chargebackCount?: number;
}

export default function DisputesPage() {
	const [disputes, setDisputes] = useState<Dispute[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterPriority, setFilterPriority] = useState('all');

	// Chart data
	const disputesTrendData = [
		{ week: 'Week 1', open: 8, resolved: 5, chargebacks: 2 },
		{ week: 'Week 2', open: 12, resolved: 9, chargebacks: 3 },
		{ week: 'Week 3', open: 15, resolved: 11, chargebacks: 4 },
		{ week: 'Week 4', open: 10, resolved: 14, chargebacks: 2 },
	];

	const disputeReasonsData = [
		{ reason: 'Not Received', count: 18 },
		{ reason: 'Unauthorized', count: 12 },
		{ reason: 'Quality Issue', count: 8 },
		{ reason: 'Duplicate', count: 6 },
		{ reason: 'Amount Mismatch', count: 5 },
	];

	useEffect(() => {
		const mockDisputes: Dispute[] = [
			{
				id: 'DISP_001',
				transactionId: 'TXN_98765',
				merchant: 'ABC Electronics Store',
				amount: 125000,
				reason: 'Not Received',
				status: 'open',
				priority: 'high',
				createdDate: '2024-01-14',
				dueDate: '2024-01-21',
				evidence: false,
				chargebackCount: 1,
			},
			{
				id: 'DISP_002',
				transactionId: 'TXN_98564',
				merchant: 'XYZ Fashion',
				amount: 89500,
				reason: 'Unauthorized',
				status: 'investigating',
				priority: 'high',
				createdDate: '2024-01-13',
				dueDate: '2024-01-20',
				evidence: true,
				chargebackCount: 0,
			},
			{
				id: 'DISP_003',
				transactionId: 'TXN_98123',
				merchant: 'Tech Solutions Ltd',
				amount: 45000,
				reason: 'Quality Issue',
				status: 'resolved',
				priority: 'medium',
				createdDate: '2024-01-10',
				dueDate: '2024-01-17',
				evidence: true,
				chargebackCount: 0,
			},
			{
				id: 'DISP_004',
				transactionId: 'TXN_97890',
				merchant: 'Food Court Market',
				amount: 67750,
				reason: 'Duplicate',
				status: 'open',
				priority: 'medium',
				createdDate: '2024-01-12',
				dueDate: '2024-01-19',
				evidence: false,
				chargebackCount: 2,
			},
			{
				id: 'DISP_005',
				transactionId: 'TXN_97654',
				merchant: 'Beauty & Wellness',
				amount: 34500,
				reason: 'Amount Mismatch',
				status: 'reviewing',
				priority: 'low',
				createdDate: '2024-01-15',
				dueDate: '2024-01-22',
				evidence: true,
				chargebackCount: 0,
			},
			{
				id: 'DISP_006',
				transactionId: 'TXN_97432',
				merchant: 'ABC Electronics Store',
				amount: 250000,
				reason: 'Not Received',
				status: 'open',
				priority: 'high',
				createdDate: '2024-01-15',
				dueDate: '2024-01-22',
				evidence: false,
				chargebackCount: 3,
			},
		];

		setDisputes(mockDisputes);
		setLoading(false);
	}, []);

	const filteredDisputes = disputes.filter((dispute) => {
		let match = true;

		if (searchTerm) {
			match =
				match &&
				(dispute.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
					dispute.transactionId
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					dispute.id.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		if (filterStatus !== 'all') {
			match = match && dispute.status === filterStatus;
		}

		if (filterPriority !== 'all') {
			match = match && dispute.priority === filterPriority;
		}

		return match;
	});

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'open':
				return (
					<Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
						<AlertCircle size={14} /> Open
					</Badge>
				);
			case 'investigating':
				return (
					<Badge className="bg-purple-100 text-purple-800 flex items-center gap-1 w-fit">
						<Clock size={14} /> Investigating
					</Badge>
				);
			case 'reviewing':
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
						<Clock size={14} /> Reviewing
					</Badge>
				);
			case 'resolved':
				return (
					<Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
						<CheckCircle size={14} /> Resolved
					</Badge>
				);
			default:
				return <Badge className="w-fit">{status}</Badge>;
		}
	};

	const getPriorityBadge = (priority: string) => {
		const colorMap: Record<string, string> = {
			low: 'bg-gray-100 text-gray-800',
			medium: 'bg-yellow-100 text-yellow-800',
			high: 'bg-red-100 text-red-800',
		};

		return (
			<Badge className={colorMap[priority]}>{priority.toUpperCase()}</Badge>
		);
	};

	const openDisputes = disputes.filter((d) => d.status === 'open').length;
	const investigatingDisputes = disputes.filter(
		(d) => d.status === 'investigating',
	).length;
	const chargebacksTotal = disputes.reduce(
		(sum, d) => sum + (d.chargebackCount || 0),
		0,
	);
	const totalAmount = filteredDisputes.reduce((sum, d) => sum + d.amount, 0);

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">
					Disputes & Chargebacks
				</h1>
				<p className="text-gray-600 mt-2">
					Manage customer disputes, chargebacks, and resolution workflows
				</p>
			</div>

			{/* Overview Cards */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Total Disputes</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{disputes.length}</div>
						<p className="text-xs text-gray-500 mt-1">All time</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Open Cases</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{openDisputes}
						</div>
						<p className="text-xs text-gray-500 mt-1">Require action</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Investigating</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							{investigatingDisputes}
						</div>
						<p className="text-xs text-gray-500 mt-1">In progress</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Chargebacks</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-orange-600">
							{chargebacksTotal}
						</div>
						<p className="text-xs text-gray-500 mt-1">At risk</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Amount at Risk</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							₦{(totalAmount / 1000000).toFixed(2)}M
						</div>
						<p className="text-xs text-gray-500 mt-1">Pending resolution</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Disputes Trend */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp size={20} />
							Disputes Trend (4 Weeks)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={disputesTrendData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="week" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="open" fill="#ef4444" name="Open" />
								<Bar dataKey="resolved" fill="#10b981" name="Resolved" />
								<Bar dataKey="chargebacks" fill="#f97316" name="Chargebacks" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Top Dispute Reasons */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle size={20} />
							Top Dispute Reasons
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={disputeReasonsData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis type="number" />
								<YAxis dataKey="reason" type="category" width={100} />
								<Tooltip />
								<Bar dataKey="count" fill="#f59e0b" />
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
								placeholder="Search by merchant, transaction ID, or dispute ID..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>

						<Select value={filterStatus} onValueChange={setFilterStatus}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="investigating">Investigating</SelectItem>
								<SelectItem value="reviewing">Reviewing</SelectItem>
								<SelectItem value="resolved">Resolved</SelectItem>
							</SelectContent>
						</Select>

						<Select value={filterPriority} onValueChange={setFilterPriority}>
							<SelectTrigger className="w-full md:w-48">
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Priorities</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="low">Low</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Disputes Table */}
			<Card>
				<CardHeader>
					<CardTitle>Disputes List</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="text-center py-8">Loading disputes...</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Dispute ID</TableHead>
										<TableHead>Transaction ID</TableHead>
										<TableHead>Merchant</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Reason</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Created</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Evidence</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredDisputes.length > 0 ? (
										filteredDisputes.map((dispute) => (
											<TableRow
												key={dispute.id}
												className={dispute.status === 'open' ? 'bg-red-50' : ''}
											>
												<TableCell className="font-mono font-semibold">
													{dispute.id}
												</TableCell>
												<TableCell className="font-mono text-xs">
													{dispute.transactionId}
												</TableCell>
												<TableCell className="font-semibold">
													{dispute.merchant}
												</TableCell>
												<TableCell className="text-right font-semibold">
													₦
													{(dispute.amount / 1000).toLocaleString('en-NG', {
														minimumFractionDigits: 0,
													})}
												</TableCell>
												<TableCell>{dispute.reason}</TableCell>
												<TableCell>{getStatusBadge(dispute.status)}</TableCell>
												<TableCell>
													{getPriorityBadge(dispute.priority)}
												</TableCell>
												<TableCell className="text-sm">
													{dispute.createdDate}
												</TableCell>
												<TableCell className="text-sm">
													{dispute.dueDate}
												</TableCell>
												<TableCell>
													{dispute.evidence ? (
														<Badge className="bg-green-100 text-green-800">
															✓ Provided
														</Badge>
													) : (
														<Badge variant="outline">Missing</Badge>
													)}
												</TableCell>
												<TableCell>
													<Button size="sm" variant="outline">
														Manage
													</Button>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={11}
												className="text-center py-8 text-gray-500"
											>
												No disputes found
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* High-Risk Merchants */}
			<Card className="bg-orange-50 border-orange-200">
				<CardHeader>
					<CardTitle className="text-orange-900 flex items-center gap-2">
						<AlertTriangle size={24} />
						High-Risk Merchants (High Chargeback Rate)
					</CardTitle>
				</CardHeader>
				<CardContent className="text-orange-800">
					<div className="space-y-2">
						{disputes
							.filter((d) => (d.chargebackCount || 0) >= 2)
							.map((dispute) => (
								<div
									key={dispute.id}
									className="flex items-center justify-between p-3 bg-white rounded border border-orange-200"
								>
									<div>
										<p className="font-semibold">{dispute.merchant}</p>
										<p className="text-sm">
											{dispute.chargebackCount} chargebacks - ₦
											{(dispute.amount / 1000).toLocaleString('en-NG', {
												minimumFractionDigits: 0,
											})}
										</p>
									</div>
									<Button size="sm" variant="outline">
										Review Account
									</Button>
								</div>
							))}
					</div>
				</CardContent>
			</Card>

			{/* Resolution SLA Info */}
			<Card className="bg-blue-50 border-blue-200">
				<CardHeader>
					<CardTitle className="text-blue-900 flex items-center gap-2">
						<FileText size={24} />
						Dispute Resolution SLAs
					</CardTitle>
				</CardHeader>
				<CardContent className="text-blue-800 space-y-2">
					<p>
						<strong>High Priority:</strong> 24 hours - Cases with chargebacks or
						significant amounts
					</p>
					<p>
						<strong>Medium Priority:</strong> 72 hours - Standard disputes
					</p>
					<p>
						<strong>Low Priority:</strong> 5 business days - Minor disputes
					</p>
					<p>
						<strong>Evidence Required:</strong> Merchant must provide proof of
						delivery, communication logs, or transaction records
					</p>
					<p>
						<strong>Chargeback Rate Limit:</strong> Merchants exceeding 1.5%
						chargeback rate will be flagged for account review
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
