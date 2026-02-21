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
	LineChart,
	Line,
	ResponsiveContainer,
} from 'recharts';
import {
	Search,
	TrendingUp,
	Calendar,
	DollarSign,
	AlertCircle,
	CheckCircle,
} from 'lucide-react';

interface Payout {
	id: string;
	merchant: string;
	amount: number;
	fees: number;
	net: number;
	status: string;
	payoutMethod: string;
	scheduledDate: string;
	completedDate?: string;
}

export default function PayoutsPage() {
	const [payouts, setPayouts] = useState<Payout[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');

	// Mock chart data
	const revenueData = [
		{ date: 'Mon', revenue: 2400000, fees: 60000 },
		{ date: 'Tue', revenue: 2210000, fees: 55250 },
		{ date: 'Wed', revenue: 2290000, fees: 57250 },
		{ date: 'Thu', revenue: 2000000, fees: 50000 },
		{ date: 'Fri', revenue: 2181000, fees: 54525 },
		{ date: 'Sat', revenue: 2500000, fees: 62500 },
		{ date: 'Sun', revenue: 2100000, fees: 52500 },
	];

	const payoutScheduleData = [
		{ date: 'Today', pending: 4200000, scheduled: 0, completed: 15600000 },
		{ date: '+1 day', pending: 3100000, scheduled: 5400000, completed: 0 },
		{ date: '+2 day', pending: 0, scheduled: 8900000, completed: 0 },
		{ date: '+3 day', pending: 0, scheduled: 2100000, completed: 0 },
	];

	useEffect(() => {
		// Mock payout data
		const mockPayouts: Payout[] = [
			{
				id: 'PAYOUT_001',
				merchant: 'ABC Electronics Store',
				amount: 5000000,
				fees: 125000,
				net: 4875000,
				status: 'completed',
				payoutMethod: 'Bank Transfer',
				scheduledDate: '2024-01-15',
				completedDate: '2024-01-15',
			},
			{
				id: 'PAYOUT_002',
				merchant: 'XYZ Fashion',
				amount: 3500000,
				fees: 87500,
				net: 3412500,
				status: 'scheduled',
				payoutMethod: 'Bank Transfer',
				scheduledDate: '2024-01-16',
			},
			{
				id: 'PAYOUT_003',
				merchant: 'Tech Solutions Ltd',
				amount: 7200000,
				fees: 180000,
				net: 7020000,
				status: 'pending',
				payoutMethod: 'Bank Transfer',
				scheduledDate: '2024-01-16',
			},
			{
				id: 'PAYOUT_004',
				merchant: 'Food Court Market',
				amount: 2100000,
				fees: 52500,
				net: 2047500,
				status: 'pending',
				payoutMethod: 'Mobile Money',
				scheduledDate: '2024-01-17',
			},
			{
				id: 'PAYOUT_005',
				merchant: 'Beauty & Wellness',
				amount: 4300000,
				fees: 107500,
				net: 4192500,
				status: 'completed',
				payoutMethod: 'Bank Transfer',
				scheduledDate: '2024-01-14',
				completedDate: '2024-01-14',
			},
		];

		setPayouts(mockPayouts);
		setLoading(false);
	}, []);

	const filteredPayouts = payouts.filter((payout) => {
		let match = true;

		if (searchTerm) {
			match =
				match &&
				(payout.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
					payout.id.toLowerCase().includes(searchTerm.toLowerCase()));
		}

		if (filterStatus !== 'all') {
			match = match && payout.status === filterStatus;
		}

		return match;
	});

	// Calculate metrics
	const totalPending = payouts
		.filter((p) => p.status === 'pending')
		.reduce((sum, p) => sum + p.net, 0);
	const totalScheduled = payouts
		.filter((p) => p.status === 'scheduled')
		.reduce((sum, p) => sum + p.net, 0);
	const totalCompleted = payouts
		.filter((p) => p.status === 'completed')
		.reduce((sum, p) => sum + p.net, 0);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'completed':
				return (
					<Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
						<CheckCircle size={14} /> Completed
					</Badge>
				);
			case 'scheduled':
				return (
					<Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
						<Calendar size={14} /> Scheduled
					</Badge>
				);
			case 'pending':
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
						<AlertCircle size={14} /> Pending
					</Badge>
				);
			default:
				return <Badge className="w-fit">{status}</Badge>;
		}
	};

	return (
		<div className="p-8 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-4xl font-bold text-gray-900">Payouts & Revenue</h1>
				<p className="text-gray-600 mt-2">
					Track merchant payouts, settlement schedules, and platform revenue
				</p>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Pending Payouts</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-600">
							₦{(totalPending / 1000000).toFixed(2)}M
						</div>
						<p className="text-xs text-gray-500 mt-1">
							{payouts.filter((p) => p.status === 'pending').length} merchants
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Scheduled</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							₦{(totalScheduled / 1000000).toFixed(2)}M
						</div>
						<p className="text-xs text-gray-500 mt-1">
							{payouts.filter((p) => p.status === 'scheduled').length} merchants
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Completed (30d)</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							₦{(totalCompleted / 1000000).toFixed(2)}M
						</div>
						<p className="text-xs text-gray-500 mt-1">
							{payouts.filter((p) => p.status === 'completed').length} merchant
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Platform Revenue</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-purple-600">
							₦{(16400000 / 1000000).toFixed(2)}M
						</div>
						<p className="text-xs text-gray-500 mt-1">
							2.5% of all transactions
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Revenue vs Fees */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp size={20} />
							Weekly Revenue & Fees
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={revenueData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip
									formatter={(value) => `₦${(value / 1000000).toFixed(2)}M`}
								/>
								<Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
								<Bar dataKey="fees" fill="#ef4444" name="Fees" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Payout Schedule */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar size={20} />
							Payout Schedule (Next 4 Days)
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={payoutScheduleData} layout="vertical">
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis type="number" />
								<YAxis dataKey="date" type="category" />
								<Tooltip
									formatter={(value) => `₦${(value / 1000000).toFixed(2)}M`}
								/>
								<Bar dataKey="pending" fill="#fbbf24" name="Pending" />
								<Bar dataKey="scheduled" fill="#60a5fa" name="Scheduled" />
								<Bar dataKey="completed" fill="#34d399" name="Completed" />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* Payout List */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Payouts</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4 mb-6">
						<div className="flex-1 relative">
							<Search
								className="absolute left-3 top-3 text-gray-400"
								size={18}
							/>
							<Input
								placeholder="Search by merchant name or payout ID..."
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
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="scheduled">Scheduled</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
							</SelectContent>
						</Select>

						<Button>Initiate Payout</Button>
					</div>

					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Payout ID</TableHead>
									<TableHead>Merchant</TableHead>
									<TableHead>Gross Amount</TableHead>
									<TableHead>Fees (2.5%)</TableHead>
									<TableHead>Net Payout</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Scheduled Date</TableHead>
									<TableHead>Method</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPayouts.length > 0 ? (
									filteredPayouts.map((payout) => (
										<TableRow key={payout.id}>
											<TableCell className="font-mono text-xs">
												{payout.id}
											</TableCell>
											<TableCell className="font-semibold">
												{payout.merchant}
											</TableCell>
											<TableCell className="text-right">
												₦
												{(payout.amount / 1000).toLocaleString('en-NG', {
													minimumFractionDigits: 0,
												})}
											</TableCell>
											<TableCell className="text-right text-red-600">
												₦
												{(payout.fees / 1000).toLocaleString('en-NG', {
													minimumFractionDigits: 0,
												})}
											</TableCell>
											<TableCell className="text-right font-semibold text-green-600">
												₦
												{(payout.net / 1000).toLocaleString('en-NG', {
													minimumFractionDigits: 0,
												})}
											</TableCell>
											<TableCell>{getStatusBadge(payout.status)}</TableCell>
											<TableCell>{payout.scheduledDate}</TableCell>
											<TableCell>{payout.payoutMethod}</TableCell>
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
											colSpan={9}
											className="text-center py-8 text-gray-500"
										>
											No payouts found
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Fee Breakdown Info */}
			<Card className="bg-purple-50 border-purple-200">
				<CardHeader>
					<CardTitle className="text-purple-900 flex items-center gap-2">
						<DollarSign size={24} />
						Platform Revenue Breakdown
					</CardTitle>
				</CardHeader>
				<CardContent className="text-purple-800 space-y-3">
					<div className="grid grid-cols-3 gap-4">
						<div>
							<p className="font-semibold">Processing Fee</p>
							<p className="text-2xl">2.5%</p>
							<p className="text-xs">Per transaction</p>
						</div>
						<div>
							<p className="font-semibold">Settlement Period</p>
							<p className="text-2xl">T+2</p>
							<p className="text-xs">2 business days</p>
						</div>
						<div>
							<p className="font-semibold">Weekly Revenue</p>
							<p className="text-2xl">₦416.5K</p>
							<p className="text-xs">Average week</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
