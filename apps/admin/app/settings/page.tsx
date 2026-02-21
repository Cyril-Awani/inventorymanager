'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

export default function SettingsPage() {
	const [settings, setSettings] = useState({
		siteName: 'PORES POS',
		adminEmail: 'admin@pores.com',
		maintenanceMode: false,
		enableNotifications: true,
		autoBackup: true,
		maxLoginAttempts: 5,
	});

	const handleChange = (field: string, value: any) => {
		setSettings({ ...settings, [field]: value });
	};

	const handleSave = () => {
		// Save logic would go here
		console.log('Settings saved:', settings);
	};

	return (
		<div className="p-8">
			<Link href="/">
				<Button variant="outline" className="mb-6">
					← Back
				</Button>
			</Link>

			<h2 className="text-3xl font-bold text-gray-800 mb-8">Settings</h2>

			<div className="space-y-6">
				{/* General Settings */}
				<Card>
					<CardHeader>
						<CardTitle>General Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="siteName">Site Name</Label>
							<Input
								id="siteName"
								value={settings.siteName}
								onChange={(e) => handleChange('siteName', e.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="adminEmail">Admin Email</Label>
							<Input
								id="adminEmail"
								type="email"
								value={settings.adminEmail}
								onChange={(e) => handleChange('adminEmail', e.target.value)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Security Settings */}
				<Card>
					<CardHeader>
						<CardTitle>Security Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>Maintenance Mode</Label>
							<Switch
								checked={settings.maintenanceMode}
								onCheckedChange={(value) =>
									handleChange('maintenanceMode', value)
								}
							/>
						</div>
						<div>
							<Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
							<Input
								id="maxLoginAttempts"
								type="number"
								value={settings.maxLoginAttempts}
								onChange={(e) =>
									handleChange('maxLoginAttempts', parseInt(e.target.value))
								}
							/>
						</div>
					</CardContent>
				</Card>

				{/* System Settings */}
				<Card>
					<CardHeader>
						<CardTitle>System Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>Enable Notifications</Label>
							<Switch
								checked={settings.enableNotifications}
								onCheckedChange={(value) =>
									handleChange('enableNotifications', value)
								}
							/>
						</div>
						<div className="flex items-center justify-between">
							<Label>Auto Backup</Label>
							<Switch
								checked={settings.autoBackup}
								onCheckedChange={(value) => handleChange('autoBackup', value)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Danger Zone */}
				<Card className="border-red-200">
					<CardHeader>
						<CardTitle className="text-red-600">Danger Zone</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button variant="destructive" className="w-full">
							Delete All Logs
						</Button>
						<Button variant="destructive" className="w-full">
							Factory Reset
						</Button>
					</CardContent>
				</Card>

				<div className="flex gap-4">
					<Button onClick={handleSave}>Save Changes</Button>
					<Button variant="outline">Reset to Default</Button>
				</div>
			</div>
		</div>
	);
}
