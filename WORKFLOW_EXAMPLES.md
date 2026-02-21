# Offline-First POS Workflow Examples

## Scenario 1: Store Opens, Server is Down (No Internet)

### Timeline: 8:00 AM - Server/ISP Down

```
TIME: 8:00 AM
STATUS: ✗ Offline (Red status indicator)

WHAT HAPPENS:
1. Manager arrives, opens POS app
2. App loads, checks network → detects offline
3. Network status shows: "🔴 Offline • Synced" (grey background)
4. App loads last cached products from IndexedDB
5. Manager can see inventory, everything works

WHAT'S VISIBLE TO STORE MANAGER:
- Sales page loads normally (products are cached)
- Red "Offline" badge in top-right corner
- Can proceed with operations
```

### Worker Authentication (Offline)

```
TIME: 8:15 AM
CONTEXT: A worker (Sarah, PIN: 1234) comes to start shift

STEPS:
1. Sarah taps PinDialog → "Enter Worker PIN"
2. Types PIN: 1234
3. System:
   ① Detects offline mode
   ② Looks in IndexedDB for cached workers
   ③ Finds Sarah's PIN (from last sync yesterday)
   ✓ PIN matches! Creates session token
4. Sarah's session active, can make sales
5. Displays: "⚠ Working offline - PIN from cache" badge

IMPORTANT: 
- This ONLY works if workers were synced BEFORE
- If a NEW worker was added yesterday, they can't log in
- Worker list won't be fresh, but existing workers work fine
```

### Processing a Sale (Offline)

```
TIME: 8:30 AM
CONTEXT: Customer buys 2x Rice, 1x Oil = 15,000 UGX

STEPS:
1. Sarah clicks "Add to cart"
   ✓ Items added to local cart in browser
2. Enters customer info
3. Clicks "Complete Sale"
4. System tries to send to server:
   ① Attempts POST /api/sales
   ② Network timeout (10 seconds)
   ③ ✗ Request fails (no response)
5. Fallback triggers:
   ① Saves sale to IndexedDB with synced: false
   ② Gets saleId from IndexedDB
   ③ Shows receipt with AMBER banner:
      "⚠️ SAVED OFFLINE
       This transaction will sync to the server 
       when you're back online"
6. Cart clears, ready for next customer
7. Header updates: "🔴 Offline • 1 pending"

WHAT SARAH SEES:
✓ Sale completed
✓ Receipt printed/shown
✓ But with "OFFLINE" warning badge
✗ Sale not yet on server

DATABASE STATE:
LocalStorage: cartItems cleared
IndexedDB:   sales table has 1 row with synced: false
Server:      No new sale yet
```

### Second Sale (Still Offline)

```
TIME: 8:45 AM
CONTEXT: Another customer buys items

SAME PROCESS:
1. Sarah adds items to cart
2. Clicks complete sale
3. Network fails again
4. Sale saved to IndexedDB with synced: false
5. Shows offline badge
6. Header updates: "🔴 Offline • 2 pending"
```

### Multiple Sales Queue Building

```
TIME: 9:00 AM
CONTEXT: Store running for 1 hour, 47 sales made offline

VISIBLE IN UI:
- Header badge: "🔴 Offline • 47 pending"
- Each receipt shows: "SAVED OFFLINE" amber banner
- MobileCheckout page shows sales history (all local)
- Products working from cache
- Workers authenticated from cache
- No errors, store running smoothly

DATABASE STATE:
IndexedDB:
├── sales: 47 rows with synced: false
├── workers: Cached from yesterday
├── products: Cached from last load
└── credits: 0 rows

Server: 
├── No new sales
├── No new transactions
└── Unaware of offline activity
```

---

## Scenario 2: Internet Comes Back (Reconnection)

### Timeline: 9:45 AM - ISP/Server Back Online

```
TIME: 9:45 AM
EVENT: Network reconnects

AUTOMATIC TRIGGERS:
1. Browser detects 'online' event
2. Network.ts notifies sync listeners
3. useNetworkStatus hook updates
4. Components re-render

UI CHANGES:
- Header status: 🟡 "Syncing..." (spinner)
- Header background: Amber/yellow
- Sales page disabled temporarily
```

### Auto-Sync Begins

```
TIME: 9:45 AM (second 1)
PROCESS: performFullSync() executes

STEP BY STEP:
1. Check network status → ONLINE ✓
2. Check if already syncing → NO ✓
3. Set flag: isSyncing = true
4. Get sync state

SALE SYNC:
5. Query: db.sales.filter(s => !s.synced)
   Result: 47 sales found
6. For each sale:
   ① Build payload with all sale details
   ② POST /api/sales
   ③ Server validates and stores
   ④ Update sale.synced = true in IndexedDB
   ⑤ Log result
7. Repeat for next sale...

CREDIT SYNC:
8. Query: db.credits.filter(c => !c.synced)
   Result: 0 credits found (no pending)
9. Skip (no data to sync)

WORKER SYNC:
10. Optional: Can manual sync workers with syncWorkers()
    Or automatic on keeper unlock
```

### Sync In Progress

```
TIME: 9:45 - 9:47 AM (Syncing ~47 sales)

USER SEES:
- Header: 🔄 "Syncing..." spinner
- Indicator color: Amber/yellow rotating
- Sales page: Clickable but shows "Currently syncing"
- Console logs:
  ✓ Starting offline sync...
  ✓ Syncing sale 1/47...
  ✓ Syncing sale 2/47...
  ...
  ✓ Syncing sale 47/47...
  ✓ Sync complete {unsyncedSales: 0, unsyncedCredits: 0}
```

### Sync Complete

```
TIME: 9:47 AM
STATUS: ✅ Synced

UI UPDATES:
- Header: 🟢 "Online & synced"
- Background: Green
- Status disappears after 3 seconds (can be pinned)
- Sales page fully enabled
- Last sync time: "9:47 AM"

DATABASE STATE:
IndexedDB:
├── sales: 47 rows with synced: true (all updated)
├── workers: Same as before
├── products: Same as before
└── credits: Same as before

Server:
├── sales table: 47 new sales inserted
├── All transactions recorded with correct timestamps
├── All products linked properly
└── Data now available in reports/analytics
```

### What Happened to the Data

```
BEFORE (Offline):
- 47 sales in phone/browser only
- Server had NO idea about sales
- No revenue recorded
- No inventory updates
- No reports generated

AFTER (Synced):
- Same 47 sales now on server
- Dashboard updated with new revenue
- Inventory updated (quantities reduced)
- Reports show all transactions
- Analytics include all sales
- Everything synced with correct timestamps
- ZERO data loss
```

---

## Scenario 3: New Request While Offline→Online Transition

```
TIME: 9:46 AM (During sync)
EVENT: Sarah tries to complete another sale while syncing

WHAT HAPPENS:
1. Sarah inputs sale data, clicks "Complete Sale"
2. System checking: isOnline = true
3. Attempts POST /api/sales → SUCCEEDS (server back online)
4. Sale goes directly to server
5. Shows success receipt (no "OFFLINE" badge)
6. Database: IndexedDB sale.synced = true immediately
7. Server processes in real-time

RESULT:
- This sale counts immediately on server
- Mixed with the 47 synced sales
- All 48 now on server
- Total: 47 offline + 1 online = 48 sales
```

---

## Scenario 4: Server is Up But Intermittent Network

```
TIME: 10:00 AM
CONTEXT: WiFi is flaky - dropouts every few minutes

EXAMPLE:
1. Sarah completes sale → Network good → Goes to server ✓
2. Sarah completes sale → Network drops → Saved offline ✓
3. Sarah completes sale → Network back → Goes to server ✓
4. Sarah completes sale → Network timeout → Saved offline ✓
5. Sarah completes sale → Network good → Goes to server ✓

RESULT:
After 5 sales: 3 on server, 2 in IndexedDB pending

Pending: "🟡 Offline • 2 pending"

When network stabilizes next:
- Auto-sync triggers
- 2 pending sales sync
- Back to "🟢 Online & synced"
```

---

## Scenario 5: Server is Down for Extended Period (8+ hours)

```
TIME: 8:00 AM to 4:00 PM
CONTEXT: Server maintenance, 8 hours offline

STORE IMPACT: NONE ✓

✅ What Works All 8 Hours:
- All sales processed normally
- All receipts generated
- All workers authenticated
- All inventory visible
- All reports available locally
- App performs identically to online

📊 Offline Accumulation:
- Morning: 47 sales offline
- Lunch rush: +200 sales
- Afternoon: +150 sales
- Total: ~400 sales pending sync

VISIBLE TO STORE:
- Header: "🔴 Offline • 400 pending"
- App continues working
- Staff doesn't stop selling
- Zero customer impact

SERVER RESUMPTION (4:00 PM):
1. Server comes back online
2. Browser detects 'online' event
3. performFullSync() triggers
4. All 400 sales sync from IndexedDB
5. Takes ~2-3 minutes
6. Status: 🟢 "Online & synced"
7. Server has complete sales history
8. Reports updated with all 8 hours of data
9. No missing transactions

DATA INTEGRITY:
- All timestamps preserved (saved when transactions made)
- All product data intact
- All customer info intact
- All worker associations correct
- Zero data loss
```

---

## Scenario 6: Worker Added, Server Down

```
TIME: 8:00 AM
CONTEXT: Server is down, manager wants to add Sarah

WHAT HAPPENS:
1. Manager goes to /workers page
2. Tries to create worker
3. Request to POST /api/workers fails (server down)
4. Error shown: "Cannot add worker while offline"
5. Manager sees message: "Come back online to add new staff"

WHY:
- New workers must sync with server
- Can't work offline without initial sync
- Security: No way to sync new workers if offline

WORKAROUND:
1. Wait for server to come back online
2. Then add new worker
3. Sync immediately (auto-happens)
4. Now available for offline auth
```

---

## Scenario 7: Worker Deleted Before Login Sync

```
TIME: Yesterday 5 PM
EVENT: Manager deletes worker "Bob" from system

TIME: 8:00 AM (Next Day)
CONTEXT: Server is down, Bob tries to login

WHAT HAPPENS:
1. Bob enters PIN (which worked yesterday)
2. System checks IndexedDB (offline cache)
3. Finds Bob in cached workers
4. PIN matches!
5. Bob logs in successfully

FOR HOW LONG:
- Until next online sync of workers
- Could be hours or days
- Eventually Bob removed from cache
- Then can't login anymore

BEST PRACTICE:
- Always sync workers when coming online
- Or sync on keeper unlock
- Ensures staff list stays current
```

---

## Scenario 8: Browser Cache Cleared While Offline

```
TIME: 8:00 AM
CONTEXT: Worker accidentally clears browser cache
STATUS: Server still down (offline)

WHAT'S LOST:
❌ IndexedDB data (all pending sales gone)
❌ localStorage (cart, auth token, sync state)
❌ Products cache (can't see inventory)
❌ Worker list (can't login)

IMPACT: 
- Cannot proceed with sales
- Cannot authenticate workers  
- Cannot even load products

RECOVERY:
1. Pray server comes back online
2. Once online, app re-syncs data
3. Products load from server
4. Workers load from server
5. Back to normal

PREVENTION:
- IndexedDB stored in browser profile (harder to clear)
- But browser "Clear all data" will nuke it
- Best: Teach staff not to clear browser cache
- Or: Pin browser window to prevent accidents
```

---

## Scenario 9: Multiple Devices in Same Store

```
SETUP:
- Device A: iPad at register 1
- Device B: iPad at register 2
- Both logged into same store
- Server down

8:00 AM - Store Opens:
Device A: Processes 25 sales offline
Device B: Processes 22 sales offline

BOTH DEVICES INDEPENDENTLY:
- Have separate IndexedDB databases
- Unknown to each other
- Cache separate product lists
- Cache separate worker lists
- No sync between devices

Server Online (10 AM):
Device A: Syncs 25 sales to server
Device B: Syncs 22 sales to server
Total: 47 sales on server

IMPORTANT:
- Devices don't share local data
- Each syncs independently
- This causes no problems (server merges correctly)
- But product/worker cache might be slightly different between devices

BEST PRACTICE:
- Have one "main" device for syncing
- Or ensure all devices go online together
- Or accept minor cache differences
```

---

## Scenario 10: Fast Flaky Network vs Hard Offline

```
SCENARIO A: Fast Flaky Network
- Network drops for 2-3 seconds
- Then comes back
- Happens multiple times per hour

SYSTEM BEHAVIOR:
1. First request timeout (10 second threshold)
2. Falls back to offline save
3. Next request succeeds
4. Or immediate retry if network comes back
5. By end of hour: Mix of online/offline sales

RESULT: Works fine, some sales offline, some online

---

SCENARIO B: Hard Offline (No Network)
- Network completely gone
- No connection for hours
- Clear "offline" state

SYSTEM BEHAVIOR:
1. Browser detects offline event
2. All requests immediately cached
3. No timeout delays
4. Faster processing
5. Very clear to staff: offline mode active

RESULT: Works fine, all sales clearly accumulated offline
```

---

## Real-World Example: Typical Store Day with Interruptions

```
📅 MONDAY, PURES POS OFFLINE-FIRST WORKFLOW

08:00 - MORNING RUSH (Online)
┌─ Server: ✓ Online and running
├─ Store opens, 3 workers on shift
├─ 50 sales processed
├─ All go live to server
├─ Status: 🟢 Online & synced
└─ Header: "Last synced: 08:00"

10:30 - ISP DROPS (Offline)
┌─ Middle of transaction processing
├─ Network goes out
├─ App detects offline
├─ Status: 🔴 Offline
├─ 47 customers still in store
└─ Sales continue...

10:30 - 11:30 (OFFLINE) 
┌─ One hour offline
├─ Next 60 sales all saved to IndexedDB
├─ Workers authenticate from cache
├─ Products visible from cache
├─ Receipts show "SAVED OFFLINE" badge
├─ Status stays: 🔴 Offline • 60 pending
└─ Staff and customers unaffected

11:30 - NETWORK BACK (Reconnection)
┌─ Browser detects 'online' event
├─ Status: 🟡 Syncing... 60 sales
├─ Auto-sync starts automatically
├─ One by one, sales post to server
├─ Takes ~2 minutes for 60 sales
├─ Unsynced count decreases visibly
└─ Users watch "60 → 45 → 30 → 0"

11:32 - SYNC COMPLETE
┌─ Status: 🟢 Online & synced
├─ 60 offline sales now on server
├─ Inventory counts reflect all sales
├─ Revenue dashboard updated
├─ Total day: 50 + 60 = 110 sales
├─ Last synced: 11:32
└─ Store never stopped

14:00 - AFTERNOON (Online)
┌─ Server continues running
├─ 80 more sales (all live)
├─ Status: 🟢 Online & synced
└─ Each sale instant on server

17:00 - CLOSE OF BUSINESS
┌─ Day complete
├─ Total sales: 50 + 60 + 80 = 190 sales
├─ 50 online (today morning)
├─ 60 offline (10:30-11:30 window)
├─ 80 online (afternoon)
├─ Zero lost transactions
├─ All on server with correct times
└─ All in reports/analytics
```

---

## What Gets Synced vs What Doesn't

```
✅ SYNCS AUTOMATICALLY:
├─ Sales (all items, amounts, taxes, worker ID)
├─ Credits (if process supports offline)
├─ Timestamps (preserved from offline creation)
├─ Product associations (which products sold)
└─ Worker associations (who made the sale)

✅ SYNCS SEMI-AUTOMATICALLY:
├─ Workers (on keeper unlock or manual syncWorkers())
├─ Products (on page load or refresh)
└─ Store settings (when available)

❌ CANNOT WORK OFFLINE:
├─ New worker creation (needs server)
├─ New product addition (needs server)
├─ Settings changes (needs server rules engine)
├─ User signup (needs email verification)
└─ Advanced features (promotions, discounts server-side)

⏸️ PARTIAL OFFLINE:
├─ Reports (show offline data, not live data)
├─ Analytics (calculated from local cache)
├─ Inventory (reflects offline changes once synced)
└─ Revenue tracking (totaled locally, synced to server)
```

---

## Error Handling

```
NETWORK TIMEOUT (No response in 10 seconds)
1. Sale in progress
2. POST request takes >10 seconds
3. System assumes offline
4. Saves to IndexedDB
5. Shows "SAVED OFFLINE" badge
6. No error shown to staff (expected behavior)

SYNC FAILED (Partial failure)
1. 50 sales to sync
2. First 40 succeed
3. Sale 41 returns 400 Bad Request
4. Sync stops (safety measure)
5. Remaining sales not removed (preserved)
6. Error logged: "Invalid product in sale 41"
7. Header shows: "🔴 Sync error: Invalid product"
8. Manual fix needed (or retry once product fixed)
9. Call syncWorkers() or syncSales() manually to retry

DUPLICATE PREVENTION
1. Sale synced, IndexedDB updated: synced=true
2. If sync fails and retries
3. Sale ID already on server
4. Server handles gracefully (upsert or skip)
5. No duplicate sales created
```

---

## Summary: The Perfect Offline-First Flow

```
IDEAL SCENARIO:

1. ✅ OFFLINE PERIOD
   └─ Sales continue without interruption
   └─ Receipts show "saved offline"
   └─ Staff and customers unaffected
   └─ Data queued in IndexedDB

2. ✅ RECONNECTION
   └─ Browser detects online
   └─ Auto-sync triggers automatically
   └─ UI shows "Syncing..." with progress
   └─ No manual intervention needed

3. ✅ SYNC COMPLETE
   └─ All offline sales now on server
   └─ Inventory updated
   └─ Reports current
   └─ Status: "Online & synced"

4. ✅ TRANSPARENCY
   └─ Users know when offline (badge)
   └─ Users know when syncing (spinner)
   └─ No surprises or lost data
   └─ Complete transaction history maintained
```

---

## Testing This Yourself

### Browser DevTools Method:

```javascript
// SIMULATE OFFLINE
1. Open F12 (DevTools)
2. Network tab → Check "Offline"
3. Try to complete sale
4. Sale saves to IndexedDB

// SIMULATE BACK ONLINE
1. Network tab → Uncheck "Offline"
2. Browser fires 'online' event
3. Auto-sync triggers
4. Watch sales disappear from pending count
5. Check server for new sales

// VIEW INDEXED DB
1. DevTools → Application tab
2. IndexedDB → PuresDB → sales
3. See all offline saved sales with synced: false
4. After sync, see synced: true
```

### Real Network Testing:

```javascript
// KILL NETWORK
1. Unplug ethernet or turn off WiFi
2. Use app normally
3. Watch offline behavior

// RESTORE NETWORK
1. Plug back in or WiFi back on
2. Watch auto-sync
3. Check server for sales
```

This is the offline-first POS system in action! 🚀
