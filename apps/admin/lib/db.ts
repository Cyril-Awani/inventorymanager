import Dexie, { Table } from 'dexie';

export interface SaleOffline {
  id?: number;
  saleId?: string;
  items: { productId: string; quantity: number; unitPrice: number; costPrice: number }[];
  workerId: string;
  workerName: string;
  totalPrice: number;
  totalCost: number;
  amountPaid: number;
  isPartial: boolean;
  timestamp: number;
  synced: boolean;
}

export interface CreditOffline {
  id?: number;
  creditId?: string;
  customerName: string;
  phoneNumber?: string;
  totalOwed: number;
  amountPaid: number;
  timestamp: number;
  synced: boolean;
}

export interface ProductCache {
  id?: number;
  productId: string;
  name: string;
  brand: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  image?: string;
  unitName?: string;
  unitsPerBulk?: number | null;
  bulkSellingPrice?: number | null;
  bulkUnitName?: string | null;
  lastUpdated: number;
}

export class PuresDB extends Dexie {
  sales!: Table<SaleOffline>;
  credits!: Table<CreditOffline>;
  products!: Table<ProductCache>;

  constructor() {
    super('PuresDB');
    this.version(1).stores({
      sales: '++id, timestamp, synced',
      credits: '++id, timestamp, synced, customerName',
      products: '++id, productId, lastUpdated',
    });
  }
}

export const db = new PuresDB();

// Sync utilities
export async function syncSalesToServer(): Promise<void> {
  const unsynced = await db.sales.where('synced').equals(false).toArray();
  
  for (const sale of unsynced) {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: sale.workerId,
          items: sale.items,
          amountPaid: sale.amountPaid,
          isPartial: sale.isPartial,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await db.sales.update(sale.id!, { synced: true, saleId: result.id });
      }
    } catch (error) {
      console.error('Failed to sync sale:', error);
    }
  }
}

export async function syncCreditsToServer(): Promise<void> {
  const unsynced = await db.credits.where('synced').equals(false).toArray();
  
  for (const credit of unsynced) {
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: credit.customerName,
          phoneNumber: credit.phoneNumber,
          totalOwed: credit.totalOwed,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await db.credits.update(credit.id!, { synced: true, creditId: result.id });
      }
    } catch (error) {
      console.error('Failed to sync credit:', error);
    }
  }
}

export async function cacheProducts(products: ProductCache[]): Promise<void> {
  await db.products.clear();
  await db.products.bulkAdd(products);
}

export async function getCachedProducts(): Promise<ProductCache[]> {
  return db.products.toArray();
}

export async function getProductsBySearch(query: string): Promise<ProductCache[]> {
  const allProducts = await db.products.toArray();
  const lowerQuery = query.toLowerCase();
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.brand.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
  );
}
