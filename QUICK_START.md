# Quick Start: Test Offline-First POS

## 1. Update Worker API Endpoint (Required)

**File:** `apps/merchant/app/api/workers/route.ts`

Change the `select` in the GET handler from:

```typescript
select: {
  id: true,
  name: true,
  createdAt: true,
}
```

To:

```typescript
select: {
  id: true,
  name: true,
  pin: true,  // ADD THIS
  createdAt: true,
}
```

**Why:** The client needs worker PINs to validate them offline.

---

## 2. Start the App

```bash
npm run dev
# or
pnpm dev
```

---

## 3. Test Offline Mode (Browser DevTools)

### Step 1: Login

1. Open http://localhost:3000
2. Log in with a store account
3. ✅ Check: Workers should sync to device automatically

### Step 2: Go Offline

1. Open Chrome DevTools (F12)
2. Go to "Network" tab
3. **Check** the "Offline" checkbox
4. The header should show: "Offline"

### Step 3: Make a Sale

1. Add some products to cart
2. Enter amount paid
3. Click "Checkout"
4. Enter a worker PIN (if you have one set up)
5. Complete the transaction
6. ✅ **Look for:** "Saved Offline" badge on receipt

### Step 4: Go Back Online

1. **Uncheck** "Offline" in DevTools Network tab
2. Header should now show "Syncing..." then "Synced"
3. ✅ Check: No errors in console

### Step 5: Verify Sync

1. DevTools → Application → IndexedDB → PuresDB (v2)
2. Click "sales" table
3. ✅ Should see: Synced sales no longer in the table

---

## 4. Check IndexedDB (Where Data is Stored)

### View Cached Data

1. DevTools → Application tab
2. Left sidebar → IndexedDB → PuresDB (v2)
3. Open each table:

| Table        | What's Stored                                    |
| ------------ | ------------------------------------------------ |
| **products** | Cached product list (for offline browsing)       |
| **workers**  | Worker names & PINs (for offline authentication) |
| **sales**    | Pending/unsynced sales (cleared after sync)      |
| **credits**  | Pending/unsynced credits (cleared after sync)    |

### Clear IndexedDB (if needed)

```javascript
// Run in console:
await indexedDB.databases().forEach((db) => {
	indexedDB.deleteDatabase(db.name);
});
```

---

## 5. Monitor Sync Activity

### Watch Console Logs

1. DevTools → Console tab
2. Make a sale offline
3. Go online
4. ✅ Look for these messages:
   ```
   ✓ Back online - syncing data...
   Starting offline sync...
   ✓ Sync complete { unsyncedSales: 0, unsyncedCredits: 0 }
   ```

### Watch Network Tab

1. DevTools → Network tab
2. Go online after offline transaction
3. You should see POST requests to:
   - `/api/sales` (uploading sales)
   - `/api/credits` (uploading credits)

---

## 6. View Network Status Indicator

In the top-right of the sales page:

- 🟢 **Green** "Online & synced" - Everything good
- 🟡 **Amber** "Offline • 3 pending" - Has queued transactions
- 🔄 **Spinning** "Syncing..." - Active sync
- 🔴 **Red** "Sync error" - Something failed

---

## 7. Test Worker Authentication

### Offline Worker PIN

1. Go offline
2. Click "Checkout"
3. Enter a worker PIN
4. ✅ Should validate using cached data (even offline!)
5. Receipt shows transaction saved

### Online Worker PIN

1. Go online
2. Click "Checkout"
3. Enter a worker PIN
4. ✅ Should validate with server first
5. Falls back to offline if server unavailable

---

## Common Commands

### Start dev server

```bash
pnpm dev
```

### Clear all offline data

```javascript
// In browser console:
Object.keys(localStorage).forEach((key) => {
	if (key.includes('pores')) localStorage.removeItem(key);
});
await db.clear(); // If Dexie exposed
```

### Check sync status

```javascript
// In browser console:
const { db } = await import('@/lib/db.js');
const pending = await db.sales.where('synced').equals(false).count();
console.log('Pending sales:', pending);
```

### Monitor network changes

```javascript
// In browser console:
window.addEventListener('online', () => console.log('✓ Online'));
window.addEventListener('offline', () => console.log('✗ Offline'));
```

---

## Troubleshooting

### "Worker not found" offline

**Issue:** Worker PIN won't validate offline
**Fix:**

1. Check `/api/workers` returns `pin` field
2. Check DevTools → IndexedDB → workers table appears
3. Clear IndexedDB and re-login to re-sync

### Transaction doesn't sync

**Issue:** Sale stays in "pending" after going online
**Fix:**

1. Check console for errors
2. Check `/api/sales` endpoint is working
3. Check store auth token is valid
4. Check IndexedDB has the sale

### "Saved Offline" shows but should be online

**Issue:** App thinks it's offline when it's not
**Fix:**

1. Check DevTools Network tab - "Offline" checkbox unchecked?
2. Refresh page (F5)
3. Check `navigator.onLine` in console
4. Try hard refresh (Ctrl+Shift+R)

### IndexedDB data not showing

**Issue:** Can't see cached data in DevTools
**Fix:**

1. Check "PuresDB" exists (should be v2)
2. Try accessing from a different app (open site in new tab)
3. Check IndexedDB quota: `navigator.storage.estimate()`
4. Clear cache: `Storage → Clear site data`

---

## Success Indicators ✅

After following this guide, you should see:

- [ ] App works completely offline
- [ ] Worker PINs cached and available offline
- [ ] Sales save locally when offline
- [ ] "Saved Offline" badge appears
- [ ] Auto-sync when reconnecting
- [ ] No "Network error" messages
- [ ] Data appears on server after sync
- [ ] Network status indicator updates

---

## Next: Load Testing

Once basic offline works, test with:

1. Multiple offline transactions
2. Switching online/offline repeatedly
3. Large products list (1000+ items)
4. Multiple workers
5. Network throttling (DevTools)

For real testing, use Chrome DevTools network throttling to simulate slow/flaky networks.

---

**Ready?** Go to http://localhost:3000 and hit "Offline" in DevTools Network tab! 🚀
