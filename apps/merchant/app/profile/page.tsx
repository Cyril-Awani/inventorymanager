'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useStoreAuth } from '@/hooks/use-store-auth';
import { useRouter } from 'next/navigation';
import {
	getSessionConfig,
	setSessionConfig,
	getRemainingSessionTime,
} from '@/lib/keeper-session-timeout';
import {
	Settings,
	LogOut,
	Clock,
	Store,
	User,
	Mail,
	Phone,
	Coins,
	Edit3,
	Check,
	X,
	Shield,
	Timer,
	AlertCircle,
	ChevronDown,
	ChevronUp,
} from 'lucide-react';

export default function ProfilePage() {
	const { auth, logout, isLoading, updateStore } = useStoreAuth();
	const router = useRouter();
	const [timeoutMinutes, setTimeoutMinutes] = useState(30);
	const [remainingTime, setRemainingTime] = useState(0);
	const [saved, setSaved] = useState(false);
	const [fullName, setFullName] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [phone, setPhone] = useState('');
	const [editingPhone, setEditingPhone] = useState(false);
	const [phoneSaved, setPhoneSaved] = useState(false);
	const [showKycForm, setShowKycForm] = useState(false);
	const [gender, setGender] = useState('');
	const [dob, setDob] = useState('');
	const [kycSaved, setKycSaved] = useState(false);

	useEffect(() => {
		if (!isLoading && !auth) {
			router.push('/auth');
			return;
		}

		const config = getSessionConfig();
		setTimeoutMinutes(config.timeoutMinutes);

		const interval = setInterval(() => {
			const remaining = getRemainingSessionTime();
			setRemainingTime(Math.ceil(remaining / 1000));
		}, 1000);

		return () => clearInterval(interval);
	}, [auth, isLoading, router]);

	useEffect(() => {
		if (!auth) return;
		const owner = (auth.store as any).ownerFullName || '';
		setFullName(owner);
		const [f = '', ...rest] = owner.trim().split(' ');
		setFirstName(f);
		setLastName(rest.join(' '));
		setPhone((auth.store as any).phone || '');
		setGender((auth.store as any).gender || '');
		setDob((auth.store as any).dob || '');
	}, [auth]);

	const handleSaveSettings = (e: React.FormEvent) => {
		e.preventDefault();
		if (timeoutMinutes < 1) {
			alert('Timeout must be at least 1 minute');
			return;
		}
		setSessionConfig(timeoutMinutes);
		setSaved(true);
		setTimeout(() => setSaved(false), 3000);
	};

	const handleLogout = async () => {
		if (confirm('Are you sure you want to logout?')) {
			await logout();
			router.push('/auth');
		}
	};

	const savePhone = async () => {
		try {
			updateStore?.({ ...(auth?.store ?? {}), phone } as any);
			setPhoneSaved(true);
			setEditingPhone(false);
			setTimeout(() => setPhoneSaved(false), 3000);
		} catch (err) {
			console.error('Failed to save phone', err);
			alert('Failed to save phone');
		}
	};

	const goToManageStore = () => router.push('/manage-store');

	const saveKyc = async () => {
		try {
			const ownerFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
			updateStore?.({
				...(auth?.store ?? {}),
				phone,
				gender,
				dob,
				ownerFullName,
			} as any);
			setFullName(ownerFullName);
			setKycSaved(true);
			setShowKycForm(false);
			setTimeout(() => setKycSaved(false), 3000);
		} catch (err) {
			console.error('Failed to save KYC', err);
			alert('Failed to save KYC information');
		}
	};

	if (isLoading) {
		return (
			<Layout headerHeight="11vh">
				<div className="min-h-screen flex items-center justify-center">
					<div className="animate-pulse flex flex-col items-center gap-4">
						<div className="w-12 h-12 bg-gray-200 rounded-full"></div>
						<p className="text-gray-500 font-medium">Loading profile...</p>
					</div>
				</div>
			</Layout>
		);
	}

	if (!auth) {
		return null;
	}

	const minutes = Math.floor(remainingTime / 60);
	const seconds = remainingTime % 60;

	const InfoRow = ({
		icon: Icon,
		label,
		value,
		action,
	}: {
		icon: any;
		label: string;
		value: React.ReactNode;
		action?: React.ReactNode;
	}) => (
		<div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
			<div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
				<Icon size={18} className="text-gray-500" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
					{label}
				</p>
				<div className="flex items-center justify-between gap-2 mt-1">
					<div className="flex-1 min-w-0">
						<p className="text-base font-semibold text-gray-900 truncate">
							{value}
						</p>
					</div>
					{action && <div className="flex-shrink-0">{action}</div>}
				</div>
			</div>
		</div>
	);

	return (
		<Layout headerHeight="11vh">
			<div className="min-h-screen bg-gray-50/50">
				{/* Header Section */}
				<div className="bg-white border-b border-gray-200">
					<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
									<Settings size={24} className="text-white" />
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
										Profile & Settings
									</h1>
									<p className="text-sm text-gray-500 mt-0.5">
										Manage your store and account preferences
									</p>
								</div>
							</div>
							<Button
								onClick={handleLogout}
								variant="danger"
								className="flex items-center justify-center gap-2 self-start sm:self-auto"
							>
								<LogOut size={18} />
								<span className="hidden sm:inline">Logout</span>
							</Button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Left Column - Store Info */}
						<div className="lg:col-span-2 space-y-6">
							{/* Store Information Card */}
							<Card className="overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
									<div className="flex items-center gap-2">
										<Store size={20} className="text-blue-600" />
										<h2 className="text-lg font-bold text-gray-900">
											Store Information
										</h2>
									</div>
								</CardHeader>
								<CardBody className="p-0">
									<InfoRow
										icon={Store}
										label="Business Name"
										value={auth.store.businessName}
									/>
									<InfoRow
										icon={User}
										label="Owner Full Name"
										value={fullName || 'Not set'}
									/>
									<InfoRow
										icon={Mail}
										label="Email Address"
										value={auth.store.email}
									/>
									<div className="px-4 py-3 border-b border-gray-100">
										{editingPhone ? (
											<div className="flex flex-col sm:flex-row gap-3">
												<div className="flex-1">
													<Input
														type="tel"
														value={phone}
														onChange={(e) => setPhone(e.target.value)}
														placeholder="Enter phone number"
														className="w-full"
													/>
												</div>
												<div className="flex gap-2">
													<Button
														onClick={savePhone}
														variant="primary"
														size="sm"
														className="flex items-center gap-1"
													>
														<Check size={16} />
														Save
													</Button>
													<Button
														onClick={() => {
															setPhone((auth.store as any).phone || '');
															setEditingPhone(false);
														}}
														variant="ghost"
														size="sm"
														className="flex items-center gap-1"
													>
														<X size={16} />
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<InfoRow
												icon={Phone}
												label="Phone Number"
												value={phone || 'Not set'}
												action={
													<Button
														onClick={() => setEditingPhone(true)}
														variant="secondary"
														size="sm"
														className="flex items-center gap-1"
													>
														<Edit3 size={14} />
														Edit
													</Button>
												}
											/>
										)}
										{phoneSaved && (
											<div className="px-4 pb-3">
												<div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
													<Check size={16} />
													Phone number saved successfully
												</div>
											</div>
										)}
									</div>
									<InfoRow
										icon={Coins}
										label="Currency"
										value={auth.store.currency}
									/>
									<div className="p-4 bg-gray-50/50">
										<Button
											onClick={goToManageStore}
											variant="primary"
											className="w-full sm:w-auto flex items-center justify-center gap-2"
										>
											<Store size={18} />
											Manage Store Details
										</Button>
									</div>
								</CardBody>
							</Card>

							{/* KYC Verification Card */}
							<Card className="overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Shield size={20} className="text-green-600" />
											<h2 className="text-lg font-bold text-gray-900">
												KYC Verification
											</h2>
										</div>
										<button
											onClick={() => setShowKycForm(!showKycForm)}
											className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
										>
											{showKycForm ? (
												<>
													<ChevronUp size={18} />
													Hide
												</>
											) : (
												<>
													<ChevronDown size={18} />
													Edit KYC
												</>
											)}
										</button>
									</div>
								</CardHeader>
								<CardBody className="p-0">
									{!showKycForm ? (
										<div className="p-4">
											<div className="flex items-center gap-3">
												<div
													className={`w-10 h-10 rounded-full flex items-center justify-center ${
														fullName && phone && gender && dob
															? 'bg-green-100'
															: 'bg-yellow-100'
													}`}
												>
													{fullName && phone && gender && dob ? (
														<Check size={20} className="text-green-600" />
													) : (
														<AlertCircle
															size={20}
															className="text-yellow-600"
														/>
													)}
												</div>
												<div>
													<p className="font-medium text-gray-900">
														{fullName && phone && gender && dob
															? 'KYC Complete'
															: 'KYC Incomplete'}
													</p>
													<p className="text-sm text-gray-500">
														{fullName && phone && gender && dob
															? 'All verification details provided'
															: 'Please complete your KYC information'}
													</p>
												</div>
											</div>
										</div>
									) : (
										<div className="p-4 space-y-4">
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
														First Name
													</label>
													<Input
														value={firstName}
														onChange={(e) => setFirstName(e.target.value)}
														placeholder="Enter first name"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
														Last Name
													</label>
													<Input
														value={lastName}
														onChange={(e) => setLastName(e.target.value)}
														placeholder="Enter last name"
													/>
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-1.5">
													Phone Number
												</label>
												<Input
													type="tel"
													value={phone}
													onChange={(e) => setPhone(e.target.value)}
													placeholder="Enter phone number"
												/>
											</div>
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
														Gender
													</label>
													<select
														value={gender}
														onChange={(e) => setGender(e.target.value)}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
													>
														<option value="">Select gender</option>
														<option value="male">Male</option>
														<option value="female">Female</option>
														<option value="other">Other</option>
													</select>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
														Date of Birth
													</label>
													<Input
														type="date"
														value={dob}
														onChange={(e) => setDob(e.target.value)}
													/>
												</div>
											</div>
											<div className="flex flex-col sm:flex-row gap-3 pt-2">
												<Button
													onClick={saveKyc}
													variant="primary"
													className="flex items-center justify-center gap-2"
												>
													<Check size={18} />
													Save KYC Information
												</Button>
												<Button
													onClick={() => setShowKycForm(false)}
													variant="ghost"
													className="flex items-center justify-center gap-2"
												>
													<X size={18} />
													Cancel
												</Button>
											</div>
											{kycSaved && (
												<div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
													<Check size={16} />
													KYC information saved successfully
												</div>
											)}
										</div>
									)}
								</CardBody>
							</Card>
						</div>

						{/* Right Column - Session Settings */}
						<div className="space-y-6">
							{/* Session Security Card */}
							<Card className="overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 px-6 py-4">
									<div className="flex items-center gap-2">
										<Clock size={20} className="text-blue-600" />
										<h2 className="text-lg font-bold text-gray-900">
											Session Security
										</h2>
									</div>
								</CardHeader>
								<CardBody className="p-4 space-y-4">
									<div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
										<div className="flex items-center gap-3 mb-3">
											<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
												<Timer size={20} className="text-blue-600" />
											</div>
											<div>
												<p className="text-sm text-blue-600 font-medium">
													Session Expires In
												</p>
												<p className="text-2xl font-bold text-blue-900">
													{minutes}m {seconds}s
												</p>
											</div>
										</div>
										<p className="text-xs text-blue-700">
											After expiration, you&apos;ll need to re-enter your
											password to access protected pages.
										</p>
									</div>

									<form onSubmit={handleSaveSettings} className="space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1.5">
												Password Timeout (minutes)
											</label>
											<p className="text-xs text-gray-500 mb-2">
												Set how long before requiring password re-entry
											</p>
											<div className="flex gap-2">
												<Input
													type="number"
													min="1"
													max="1440"
													value={timeoutMinutes}
													onChange={(e) =>
														setTimeoutMinutes(
															Math.max(1, parseInt(e.target.value) || 1),
														)
													}
													className="flex-1"
												/>
												<Button type="submit" variant="primary" size="sm">
													Save
												</Button>
											</div>
										</div>
										{saved && (
											<div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
												<Check size={16} />
												Settings saved successfully
											</div>
										)}
									</form>
								</CardBody>
							</Card>

							{/* Quick Actions Card */}
							<Card className="overflow-hidden">
								<CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-6 py-4">
									<h2 className="text-lg font-bold text-gray-900">
										Quick Actions
									</h2>
								</CardHeader>
								<CardBody className="p-4 space-y-2">
									<Button
										onClick={goToManageStore}
										variant="secondary"
										className="w-full flex items-center justify-center gap-2"
									>
										<Store size={18} />
										Manage Store
									</Button>
									<Button
										onClick={handleLogout}
										variant="danger"
										className="w-full flex items-center justify-center gap-2"
									>
										<LogOut size={18} />
										Logout
									</Button>
								</CardBody>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
