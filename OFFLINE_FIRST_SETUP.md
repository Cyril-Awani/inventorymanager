# Offline-First POS System Setup Guide

## Overview

Your PORES POS app now supports full offline functionality like Square POS:

- ✅ Make sales completely offline
- ✅ Worker authentication works offline
- ✅ Automatic sync when back online
- ✅ Transactions queue locally and sync when connected
- ❌ Signup requires internet (first-time setup only)

## What Changed

### New Files Created

1. **`lib/network.ts`** - Network detection and offline state management
2. **`lib/sync-manager.ts`** - Handles syncing data when back online
3. **`lib/offline-worker-auth.ts`** - Worker authentication that works offline
4. **`hooks/use-network-status.ts`** - React hook for network status in components
5. **`components/NetworkStatusIndicator.tsx`** - Shows sync/offline status in UI

### Updated Files

1. **`lib/db.ts`** - Added worker storage to Dexie (IndexedDB)
2. **`lib/keeper-auth.ts`** - Added offline mode tracking
3. **`components/PinDialog.tsx`** - Updated to validate workers offline
4. **`components/KeeperGate.tsx`** - Syncs workers when keeper unlocks
5. **`components/ReceiptModal.tsx`** - Shows "Saved Offline" badge
6. **`hooks/use-store-auth.ts`** - Auto-syncs workers on login
7. **`app/sales/page.tsx`** - Full offline transaction support with automatic fallback

## How It Works

### Login & Setup

1. User logs in online (requires internet for first login)
2. `use-store-auth` automatically syncs worker data to local storage
3. Products are cached from the last online sync
4. Ready to work offline!

### Making Sales Offline

1. User selects products and enters amount paid
2. App tries to submit to server
3. **If offline:** Sale is saved to Dexie database and receipt shows "Saved Offline" badge
4. **If online:** Sale goes to server normally
5. Worker PIN validation uses:
   - Server validation if online
   - Offline database lookup if offline

### Automatic Sync When Online

- When device reconnects to internet:
  - Offline sales are synced to server
  - Offline credits are synced
  - Network status indicator updates
  - User sees "Synced" message

## Security Notes ⚠️

### Current Implementation

The system currently stores worker PINs **in plain text** in IndexedDB. This is fine for:

- Development and testing
- Offline-first POS (like Square's local-only mode)
- Single-user devices

### For Production

You should:

1. **Hash PINs** - Don't store plain text PINs

   ```typescript
   // In sync-manager.ts, when syncing workers:
   import bcrypt from 'bcryptjs';
   const hashedPin = await bcrypt.hash(worker.pin, 10);
   // Store hashedPin instead of plain pin
   ```

2. **Hash on server** - Update the `/api/workers` endpoint:

   ```typescript
   // In app/api/workers/route.ts
   const hashedPin = await bcrypt.hash(pin, 10);
   await prisma.worker.create({ pin: hashedPin });
   ```

3. **Encrypt IndexedDB** - Consider using encrypted storage for sensitive data

4. **Device security** - Ensure device PIN/biometric locks the phone

## Configuration

### Sync on Network Change

The system automatically syncs when detecting network changes. To customize:

```typescript
// In lib/network.ts
window.addEventListener('online', () => {
	// Custom sync logic
	performFullSync();
});
```

### Sync Frequency

By default, sync happens when:

- Network comes online
- User logs in
- Keeper unlocks
- Manual sync (if you add a button)

To add manual sync button:

```tsx
const { manualSync } = useNetworkStatus();

<button onClick={manualSync}>Sync Now</button>;
```

### Data Retention

Offline data is stored in IndexedDB:

- **Sales**: Cleared after sync
- **Products**: Kept for future offline use
- **Workers**: Updated on each Keeper unlock
- **Credits**: Cleared after sync

## API Endpoint Updates Needed

### 1. Update `/api/workers` to include PIN in response

```typescript
// apps/merchant/app/api/workers/route.ts
export async function GET(request: NextRequest) {
	// Only authenticated store owners should get this
	const token = request.headers.get('authorization');

	const workers = await prisma.worker.findMany({
		where: { storeId },
		select: {
			id: true,
			name: true,
			pin: true, // ADD THIS
		},
	});

	return NextResponse.json(workers);
}
```

### 2. Create `/api/workers/validate` endpoint (optional)

If you want explicit server-side validation:

```typescript
// POST /api/workers/validate
export async function POST(request: NextRequest) {
	const { pin } = await request.json();
	const storeId = request.headers.get('x-store-id');

	const worker = await prisma.worker.findFirst({
		where: { storeId, pin }, // Or use bcrypt comparison
	});

	if (!worker) {
		return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
	}

	return NextResponse.json({ id: worker.id, name: worker.name });
}
```

## Testing Offline Functionality

### 1. Test with DevTools

```javascript
// In browser console
// Disable network
Network.disable();

// Make a sale - should save offline
// Then enable network
Network.enable();
// Should auto-sync
```

### 2. Test with Chrome DevTools

1. Open DevTools > Network tab
2. Check "Offline" checkbox
3. Make a sale - receipt shows "Saved Offline"
4. Uncheck "Offline"
5. Check Console - should see sync logs

### 3. Check IndexedDB

1. DevTools > Application > IndexedDB
2. Expand "PuresDB (v2)"
3. View tables:
   - `sales` - unsynced sales
   - `products` - cached products
   - `workers` - cached worker PINs
   - `credits` - unsynced credits

## Troubleshooting

### Workers not syncing

- Check: Is user logged in?
- Check: Is device online?
- Check: Does `/api/workers` return PIN field?
- Check: Are workers in the database?

### Sales not saving offline

- Check: Is IndexedDB available? (DevTools > Application > Storage)
- Check: Are there any JS errors? (Console tab)
- Check: Does sale have all required fields?

### Sync happening too often

- Adjust timeout in `sync-manager.ts`:
  ```typescript
  scheduleSyncWhenOnline(30000); // 30 seconds
  ```

## Database Schema Changes

The Dexie schema was updated to version 2:

```typescript
this.version(2).stores({
	sales: '++id, timestamp, synced',
	credits: '++id, timestamp, synced, customerName',
	products: '++id, productId, lastUpdated',
	workers: '++id, workerId', // NEW TABLE
});
```

If you get migration errors, clear IndexedDB:

```javascript
// In console
await indexedDB.databases().forEach((db) => {
	indexedDB.deleteDatabase(db.name);
});
```

## Monitoring

### Sync Status in Components

```tsx
import { useNetworkStatus } from '@/hooks/use-network-status';

export function MyComponent() {
	const { isOnline, syncStatus, manualSync } = useNetworkStatus();

	return (
		<div>
			<p>Online: {isOnline ? 'Yes' : 'No'}</p>
			<p>Pending sales: {syncStatus.pendingSales}</p>
			<p>Last sync: {new Date(syncStatus.lastSyncTime).toLocaleString()}</p>
			{syncStatus.lastError && <p>Error: {syncStatus.lastError}</p>}
			<button onClick={manualSync}>Sync Now</button>
		</div>
	);
}
```

### Console Logs

The system logs all sync activity:

```
✓ Back online - syncing data...
Starting offline sync...
✓ Sync complete { unsyncedSales: 0, unsyncedCredits: 0 }
✓ Synced 5 workers to offline storage
```

## Next Steps

1. **Test offline mode** - Disable network and make a sale
2. **Update `/api/workers`** - Return PIN field for syncing
3. **Optionally hash PINs** - For better security
4. **Monitor IndexedDB** - Verify data is persisting
5. **Train staff** - Show them "Saved Offline" badge and sync behavior

## Performance Tips

- **Minimize sync data** - Only sync what's needed (workers, products, sales)
- **Batch operations** - Sync multiple items together
- **Compress data** - Consider zipping large responses
- **Index wisely** - Dexie indexes are in `db.ts`
- **Clean up old data** - Periodically clear synced transactions

## Support

If you have issues:

1. Check browser console for errors
2. Check Application > IndexedDB for data
3. Check Network tab for failed requests
4. Enable detailed logging in `network.ts`
