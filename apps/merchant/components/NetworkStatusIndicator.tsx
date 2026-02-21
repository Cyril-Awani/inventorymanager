import React from 'react';
import {
	AlertTriangle,
	AlertCircle,
	CheckCircle2,
	Loader2,
	Wifi,
	WifiOff,
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function NetworkStatusIndicator() {
	const { isOnline, syncStatus } = useNetworkStatus();

	const timeAgo = (timestamp: number) => {
		if (!timestamp) return 'Never';
		const seconds = Math.floor((Date.now() - timestamp) / 1000);
		if (seconds < 60) return 'Just now';
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	};

	if (
		isOnline &&
		!syncStatus.lastError &&
		syncStatus.pendingSales === 0 &&
		syncStatus.pendingCredits === 0
	) {
		// Everything synced and online - show minimal indicator
		return (
			<div className="flex items-center gap-2 text-xs text-green-600 px-2 py-1 rounded bg-green-50 border border-green-200">
				<Wifi size={14} />
				<span>Online & synced</span>
			</div>
		);
	}

	if (!isOnline) {
		// Offline
		return (
			<div className="flex items-center gap-2 text-xs text-amber-600 px-2 py-1 rounded bg-amber-50 border border-amber-200">
				<WifiOff size={14} />
				<span>
					Offline
					{(syncStatus.pendingSales > 0 || syncStatus.pendingCredits > 0) && (
						<span>
							{' '}
							· {syncStatus.pendingSales + syncStatus.pendingCredits} pending
						</span>
					)}
				</span>
			</div>
		);
	}

	if (syncStatus.isSyncing) {
		// Currently syncing
		return (
			<div className="flex items-center gap-2 text-xs text-blue-600 px-2 py-1 rounded bg-blue-50 border border-blue-200">
				<Loader2 size={14} className="animate-spin" />
				<span>Syncing...</span>
			</div>
		);
	}

	if (syncStatus.lastError) {
		// Sync error
		return (
			<div className="flex items-center gap-2 text-xs text-red-600 px-2 py-1 rounded bg-red-50 border border-red-200">
				<AlertCircle size={14} />
				<span>Sync error · {timeAgo(syncStatus.lastSyncTime)}</span>
			</div>
		);
	}

	if (syncStatus.pendingSales > 0 || syncStatus.pendingCredits > 0) {
		// Pending items
		return (
			<div className="flex items-center gap-2 text-xs text-amber-600 px-2 py-1 rounded bg-amber-50 border border-amber-200">
				<AlertTriangle size={14} />
				<span>
					{syncStatus.pendingSales + syncStatus.pendingCredits} pending ·{' '}
					{timeAgo(syncStatus.lastSyncTime)}
				</span>
			</div>
		);
	}

	// Default online and synced
	return (
		<div className="flex items-center gap-2 text-xs text-green-600 px-2 py-1 rounded bg-green-50 border border-green-200">
			<CheckCircle2 size={14} />
			<span>Synced {timeAgo(syncStatus.lastSyncTime)}</span>
		</div>
	);
}
