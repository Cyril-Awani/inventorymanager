# Pures Web POS - Mini Supermarket Management System

A professional, offline-first Point of Sale (POS) system built for Nigerian mini-supermarkets using Next.js, Prisma, PostgreSQL, and Tailwind CSS.

## Features

### Core Features
- **Point of Sale (Sales Page)**: Fast, intuitive product search and checkout with quantity selectors
- **Inventory Management**: Add, edit, delete products with cost tracking and low-stock alerts
- **Credit & Partial Payments**: Track customer credits, record partial payments, and manage outstanding balances
- **Reports & Analytics**: Daily, weekly, monthly sales reports with profit calculations and worker performance metrics
- **Offline-First**: Complete transactions offline with automatic syncing when internet returns using Dexie.js
- **Receipt Generation**: Generate PDF or image receipts, shareable via WhatsApp or email

### Technical Highlights
- Custom UI components using only Tailwind CSS and Lucide icons (no external UI libraries)
- PostgreSQL with Prisma ORM for robust data management
- Server-side API routes for secure operations
- Client-side offline storage with Dexie IndexedDB
- Worker PIN verification for transaction accountability
- Real-time inventory management

## Project Structure

```
├── app/
│   ├── page.tsx                 # Dashboard/Home page
│   ├── sales/page.tsx           # Point of Sale page
│   ├── inventory/page.tsx       # Inventory management
│   ├── credits/page.tsx         # Credits & payments tracking
│   ├── reports/page.tsx         # Analytics & reports
│   ├── api/
│   │   ├── products/            # Product CRUD endpoints
│   │   ├── sales/               # Sales endpoints
│   │   ├── workers/             # Worker management
│   │   ├── credits/             # Credit management
│   │   ├── restocks/            # Restock tracking
│   │   └── reports/             # Report generation
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── Button.tsx               # Custom button component
│   ├── Input.tsx                # Custom input component
│   ├── Card.tsx                 # Card wrapper components
│   ├── Modal.tsx                # Modal component
│   ├── ProductTile.tsx          # Product display tile
│   ├── ProductForm.tsx          # Product form modal
│   ├── CheckoutCart.tsx         # Shopping cart sidebar
│   ├── PinDialog.tsx            # Worker PIN verification
│   └── ReceiptModal.tsx         # Receipt display & download
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── db.ts                    # Dexie offline DB setup
│   ├── transaction.ts           # Transaction utilities
│   └── receipt.ts               # Receipt generation utilities
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Initial data seeding
└── package.json                 # Project dependencies
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL 12+ running locally or remotely
- Git (for version control)

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Database Setup

#### Step 1: Create PostgreSQL Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pures_pos_db;

# Exit psql
\q
```

#### Step 2: Configure Environment
Copy the example env file and set your database URL:
```bash
cp .env.example .env.local
```
Edit `.env.local` and set `DATABASE_URL` with your PostgreSQL username and password:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pures_pos_db"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```
Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

#### Step 3: Run Migrations
```bash
pnpm prisma migrate deploy
```

#### Step 4: Seed Initial Data
```bash
pnpm prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Core Workflow Examples

### Example 1: Complete a Sale with Worker PIN

1. Navigate to **Point of Sale** page
2. Search for products (e.g., "Indomie Noodles")
3. Add 2 units to cart by clicking the tile
4. Enter quantity and click "Add to Cart"
5. In checkout sidebar, enter amount paid
6. Click "Complete Sale"
7. Enter worker PIN (default: "1234" for Chukwu)
8. System creates sale, updates inventory, and shows receipt

### Example 2: Restock Products

1. Go to **Inventory Management**
2. Find low-stock item
3. Click "+" icon or "Restock" button
4. Enter quantity to restock
5. System updates inventory and records restock history

### Example 3: Track Customer Credit

1. Navigate to **Credits & Payments**
2. Click "New Credit"
3. Enter customer name, phone, total owed
4. Click "Create Credit"
5. To record payment: Click "Pay" button, enter amount, confirm
6. System updates remaining balance and payment status

### Example 4: View Sales Report

1. Go to **Reports & Analytics**
2. Select period (Daily/Weekly/Monthly)
3. Choose date range
4. View:
   - Total revenue and profit
   - Worker performance metrics
   - Low-stock products
   - Detailed sales list

## Database Schema Overview

### Key Tables

**Store**: Multi-store support
- id, name, logo

**Product**: Inventory items
- id, name, brand, category, costPrice, sellingPrice, quantity, image

**Sale**: Completed transactions
- id, transactionId, workerId, totalPrice, totalCost, amountPaid, remainingBalance, paymentStatus

**SaleItem**: Individual items in a sale
- id, saleId, productId, quantity, unitPrice, costPrice

**Credit**: Customer credits
- id, customerName, phoneNumber, totalOwed, totalPaid, remainingBalance, paymentStatus

**Worker**: Staff members
- id, name, pin, storeId

**Restock**: Inventory restocking records
- id, productId, quantity, costPrice, totalCost

## API Endpoints

### Products
- `GET /api/products` - List all products (non-zero stock)
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - List sales (with date filtering)
- `GET /api/sales/[id]` - Get sale details

### Credits
- `POST /api/credits` - Create credit
- `GET /api/credits` - List credits (filterable by status)
- `POST /api/credits/[id]/payment` - Record credit payment

### Restocks
- `POST /api/restocks` - Create restock record
- `GET /api/restocks` - List restocks (with date filtering)

### Reports
- `GET /api/reports` - Generate report (daily/weekly/monthly)

### Workers
- `GET /api/workers` - List workers
- `POST /api/workers` - Create worker

## Offline-First Architecture

The app uses **Dexie.js** for client-side IndexedDB storage:

1. **Product Cache**: Synced products stored locally
2. **Sale Queue**: Offline sales stored, synced when online
3. **Credit Queue**: Offline credits, synced automatically
4. **Auto-Sync**: When internet returns, queued items sync to server

## Default Test Data

**Store**: "Pures Mini Supermarket"

**Workers**:
- Name: Chukwu, PIN: 1234
- Name: Amara, PIN: 5678

**Products**:
- Indomie Noodles (₦100 cost, ₦150 selling price)
- Maggi Seasoning (₦50 cost, ₦75 selling price)
- Eggs (₦120 cost, ₦150 selling price)
- Palm Oil (₦800 cost, ₦1000 selling price)
- Rice 10kg (₦3500 cost, ₦4500 selling price)

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
4. Deploy

Note: For production, use a managed PostgreSQL service (Neon, Supabase, Railway, etc.)

## Performance Optimization

- Product tiles optimized for rush-hour traffic
- Instant search with client-side filtering
- Offline-first ensures no delays during high load
- Lazy-loaded components for faster initial load
- Minimal CSS with Tailwind utility classes

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Database Connection Error
If you see **"Authentication failed... the provided database credentials for postgres are not valid"**:

1. **Copy env**: `cp .env.example .env.local` and edit `.env.local`.
2. **Set the correct password** for your PostgreSQL user in `DATABASE_URL`.
3. **Ensure PostgreSQL is running** (e.g. Windows: Services → postgresql; Linux: `sudo service postgresql status`).
4. **Create the database** if needed: `psql -U postgres -c "CREATE DATABASE pures_pos_db;"`

Format for `DATABASE_URL`: `postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME`

### Migration Issues
```bash
# Reset database (caution: removes all data)
pnpm prisma migrate reset

# Verify schema
pnpm prisma studio
```

### Offline Storage Not Working
- Check browser's IndexedDB settings (not disabled)
- Clear IndexedDB: DevTools → Application → IndexedDB
- Restart the app

## Future Enhancements

- Multi-user dashboard with role-based access
- Customer database and loyalty program
- Barcode scanner integration
- WhatsApp order notifications
- Advanced inventory forecasting
- Multi-branch management
- Tax calculation automation
- Supplier management system

## Support & Documentation

For issues or questions:
1. Check the README sections above
2. Review the code comments in components and API routes
3. Check browser console for error messages
4. Verify all environment variables are set correctly

## License

Built for Pures Mini Supermarket - All rights reserved 2024
