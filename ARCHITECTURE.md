# Offline-First POS Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PORES POS Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐                                       │
│  │   UI Components  │                                       │
│  ├──────────────────┤                                       │
│  │ - SalesPage      │         ┌────────────────────┐       │
│  │ - PinDialog      │────────>│ useNetworkStatus   │       │
│  │ - ReceiptModal   │         │    (React Hook)    │       │
│  │ - KeeperGate     │         └────────────────────┘       │
│  └──────────────────┘                  │                   │
│                                         ▼                   │
│                          ┌────────────────────────┐         │
│                          │  useStoreAuth          │         │
│                          │  (Auth Management)     │         │
│                          └────────────────────────┘         │
│                                         │                   │
│                                         ▼                   │
│  ┌────────────────────────────────────────────┐            │
│  │        Offline-First Service Layer         │            │
│  ├────────────────────────────────────────────┤            │
│  │                                            │            │
│  │  ┌─────────────┐  ┌────────────────────┐ │            │
│  │  │lib/network  │  │lib/sync-manager    │ │            │
│  │  ├─────────────┤  ├────────────────────┤ │            │
│  │  │ - Detect    │  │ - performFullSync()│ │            │
│  │  │   online/   │  │ - syncWorkerData() │ │            │
│  │  │   offline   │  │ - Auto-retry       │ │            │
│  │  │ - Listeners │  │ - Status tracking  │ │            │
│  │  └─────────────┘  └────────────────────┘ │            │
│  │                                            │            │
│  │  ┌──────────────────────┐                 │            │
│  │  │lib/offline-worker    │                 │            │
│  │  ├──────────────────────┤                 │            │
│  │  │ - validateWorker()   │                 │            │
│  │  │ - Offline fallback   │                 │            │
│  │  │ - Online priority    │                 │            │
│  │  └──────────────────────┘                 │            │
│  │                                            │            │
│  └────────────────────────────────────────────┘            │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ localStorage│  │IndexedDB   │  │  Network   │
    │  (Tokens)   │  │  (Dexie)   │  │ (API Calls)│
    ├────────────┤  ├────────────┤  ├────────────┤
    │ - Auth     │  │ - products │  │ - GET      │
    │ - Keeper   │  │ - workers  │  │ - POST     │
    │   session  │  │ - sales    │  │ - Fetch    │
    │            │  │ - credits  │  │   w/retry  │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │ Backend Server │
                    ├────────────────┤
                    │ /api/sales     │
                    │ /api/credits   │
                    │ /api/workers   │
                    │ /api/products  │
                    │ /api/auth/*    │
                    └────────────────┘
                           │
                           ▼
                      PostgreSQL DB
```

## Data Flow During Offline Transaction

```
┌──────────────────────────────────────────────────────────────┐
│              User Makes Sale Offline                         │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Checkout Cart   │
                  │ (App UI)        │
                  └────────┬────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │ Worker PIN Authentication           │
         ├─────────────────────────────────────┤
         │ • Is online?                        │
         │   YES: Try server first             │
         │   NO: Use offline validation        │
         └────────┬────────────────────────────┘
                  │
                  ▼
         ┌─────────────────────────────────────┐
         │ Submit Sale Transaction             │
         ├─────────────────────────────────────┤
         │ Try: fetch('/api/sales')            │
         │ Catch: Network error?               │
         └────────┬────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
        ▼                    ▼
    SUCCESS             NETWORK ERROR
        │                    │
        │                    ▼
        │            ┌──────────────────────┐
        │            │ Save to IndexedDB    │
        │            │ db.sales.add({...})  │
        │            │ synced: false        │
        │            └──────┬───────────────┘
        │                   │
        ┌───────────────────┘
        │
        ▼
    ┌──────────────────────┐
    │ Show Receipt         │
    │ (with status badge)  │
    │ "Saved Offline" OR   │
    │ "Success"            │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Clear Cart           │
    │ Return to Sales Page │
    │ Ready for next trans │
    └──────────────────────┘
```

## Auto-Sync Flow When Online

```
┌─────────────────────────────────────┐
│ Network Comes Online                │
│ (window 'online' event)             │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Notify Listeners   │
    │ → onNetworkChange()│
    └────────┬───────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ performFullSync()          │
    │ (from sync-manager.ts)     │
    └────────┬───────────────────┘
             │
      ┌──────┴──────┬─────────┐
      │             │         │
      ▼             ▼         ▼
   SYNC SALES  SYNC CREDITS  SYNC WORKERS
   (iterates) (iterates)    (bulk replace)
      │            │         │
      ▼            ▼         ▼
   fetch(       fetch(        fetch(
   /api/     /api/credits  /api/workers
   /sales)     )             )
      │            │         │
      │ ┌──────────┘         │
      │ │                    │
      ▼ ▼                    │
   Update DB            ✅ Stored locally
   Mark: synced: true
      │
      ▼
   ┌────────────────────────┐
   │ Update UI              │
   │ • Remove "pending"     │
   │ • Show "Synced"        │
   │ • Clear pending count  │
   └────────────────────────┘
```

## Component Dependency Graph

```
┌──────────────────────────────────┐
│      SalesPage                   │
│ (Main transaction interface)     │
└────┬─────────────────┬──────────┘
     │                 │
  ┌──▼──────┐    ┌────▼────────────┐
  │useNetwork   │useStoreAuth      │
  │Status() │    │(authentication)  │
  └──┬──────┘    └────┬────────────┘
     │                │
  ┌──▼────────────────▼─────────────┐
  │         PinDialog               │
  │ (Worker authentication)         │
  │ Uses: offline-worker-auth.ts    │
  └────────────────────────────────┘

┌──────────────────────────────────┐
│      KeeperGate                  │
│ (Store keeper unlock)            │
└────┬──────────────────┬──────────┘
     │                  │
  ┌──▼──────┐   ┌──────▼──────┐
  │keeper    │   │sync-manager │
  │auth.ts   │   │(on unlock)  │
  └──────────┘   └─────────────┘

┌──────────────────────────────────┐
│ CheckoutCart + ReceiptModal      │
│ (Transaction display)            │
│ Shows: isOffline badge           │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ NetworkStatusIndicator           │
│ (Header status display)          │
│ Uses: useNetworkStatus           │
└──────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────┐
│         Firefox/Chrome Browser      │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ localStorage                 │  │
│  ├──────────────────────────────┤  │
│  │ • pores_store_auth           │  │
│  │ • pores_keeper_token         │  │
│  │ • pores_sync_state           │  │
│  │ • cartItems                  │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ sessionStorage               │  │
│  ├──────────────────────────────┤  │
│  │ • pures_keeper_token         │  │
│  │ • pures_keeper_store_id      │  │
│  │ • pures_keeper_offline       │  │
│  │ • pures_keeper_expiry        │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ IndexedDB (Dexie)            │  │
│  ├──────────────────────────────┤  │
│  │ Database: PuresDB (v2)       │  │
│  ├──────────────────────────────┤  │
│  │ Tables:                      │  │
│  │ • products                   │  │
│  │   ├─ id, productId           │  │
│  │   ├─ name, price, qty        │  │
│  │   └─ lastUpdated             │  │
│  │                              │  │
│  │ • workers                    │  │
│  │   ├─ id, workerId            │  │
│  │   ├─ name, pin               │  │
│  │   └─ lastSynced              │  │
│  │                              │  │
│  │ • sales                      │  │
│  │   ├─ id, saleId              │  │
│  │   ├─ items, workerId         │  │
│  │   ├─ amountPaid, timestamp   │  │
│  │   └─ synced (bool)           │  │
│  │                              │  │
│  │ • credits                    │  │
│  │   ├─ id, creditId            │  │
│  │   ├─ customer, amount        │  │
│  │   └─ synced (bool)           │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ In-Memory State              │  │
│  ├──────────────────────────────┤  │
│  │ React Hooks & Contexts:      │  │
│  │ • auth (from useStoreAuth)   │  │
│  │ • isOnline (from network)    │  │
│  │ • syncStatus (sync state)    │  │
│  │ • cartItems                  │  │
│  │ • products                   │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## Sync Strategy

### Pull-based Sync (What we use)

```
Client              Server
  │                  │
  ├─ Online? ────────>
  │                  │
  │ <─ YES ──────────┤
  │                  │
  ├─ GET /workers ──>
  │                  │
  │ <─ [workers] ────┤
  │                  │
  ├─ POST /sales ───>
  │                  │
  │ <─ Success ──────┤
  │                  │
  Saves to IndexedDB
  Removes 'synced: false'
```

### Push-based (Offline First)

```
When offline:
┌──────────────┐
│ Collect data │
│ in IndexedDB │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Re-connect   │
│ to network   │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Push all     │
│ pending data │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Mark synced  │
└──────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────┐
│ Network Request         │
└────┬────────────────────┘
     │
     ├─ Try: fetch()
     │
     └─ Catch:
        │
        ├─ Network Error?
        │  └─> Save to IndexedDB
        │  └─> Retry on reconnect
        │
        ├─ HTTP 400/401?
        │  └─> Show error to user
        │  └─> Don't retry
        │
        ├─ HTTP 500?
        │  └─> Retry with backoff
        │  └─> Save state for later
        │
        └─ Timeout?
           └─> Treat as offline
           └─> Fall back to local
```

## Security Boundaries

```
┌─────────────────────────────────────┐
│         Client (Browser)             │
├──────────────┬──────────────────────┤
│              │                      │
│ ✓ Safe:      │ ✗ Unsafe:           │
│ • UI state   │ • Plain text PINs*   │
│ • Auth token │ • Unhashed data*     │
│ • Caching    │ • No encryption*     │
│ • Validation │                      │
│              │                      │
│ (* For demo/dev only)               │
└──────────────┬──────────────────────┘
               │
        [HTTPS Gateway]
               │
┌──────────────▼──────────────────────┐
│      Backend (Server)                │
├─────────────────────────────────────┤
│                                     │
│ ✓ Secure:                          │
│ • Hash PINs (bcrypt)               │
│ • Verify tokens                    │
│ • Validate permissions             │
│ • Encrypt sensitive data           │
│ • Audit logs                       │
│                                     │
│ Database:                          │
│ • PostgreSQL with encryption       │
│ • Backup & recovery                │
│ • Access controls                  │
│                                     │
└─────────────────────────────────────┘
```

## Network Resilience

```
┌──────────────┐
│ Good Network │
│ (3G, WiFi)   │
└──────┬───────┘
       │
       ├─ Online detection: Instant
       ├─ Requests: <3s
       ├─ Sync: <5s
       └─ UX: Seamless

┌──────────────┐
│ Slow Network │
│ (LTE, busy)  │
└──────┬───────┘
       │
       ├─ Online detection: 10s timeout
       ├─ Requests: 30s timeout
       ├─ Sync: Retry every 5s
       └─ UX: Shows "Offline" if timeout

┌──────────────┐
│ No Network   │
│ (Airplane)   │
└──────┬───────┘
       │
       ├─ Falls back immediately
       ├─ Saves locally
       ├─ Retries on reconnect
       └─ UX: "Offline • 5 pending"
```

---

This architecture ensures **zero data loss** and **seamless offline operation** while maintaining clean separation of concerns.
