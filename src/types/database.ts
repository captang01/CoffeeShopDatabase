export type MenuCategory = 'Espresso' | 'Manual Brew' | 'Signature Milk' | 'Non-Coffee' | 'Pastry';

export type InventoryCategory = 'Coffee Beans' | 'Dairy & Alt' | 'Syrup & Sweetener' | 'Tea & Powder' | 'Bakery' | 'Packaging';

export type OrderStatus = 'pending' | 'brewing' | 'ready' | 'completed' | 'cancelled';

export type OrderType = 'dine-in' | 'takeaway';

export type PaymentMethod = 'QRIS' | 'Cash' | 'Debit/Credit';

export type LoyaltyTier = 'Regular' | 'Gold' | 'Roaster Club';

export type TableName = 'menu_items' | 'inventory_items' | 'orders' | 'order_items' | 'customers';

export interface RecipeIngredient {
  inventoryId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  sku: string;
  name: string;
  category: MenuCategory;
  price: number;
  available: boolean;
  description: string;
  prepTimeMin: number;
  recipe: RecipeIngredient[];
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  stock: number;
  minStock: number;
  unit: 'g' | 'ml' | 'pcs';
  costPerUnit: number;
  supplier: string;
  lastRestocked: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: LoyaltyTier;
  points: number;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  orderType: OrderType;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  barista: string;
}

export interface CoffeeDatabaseState {
  menuItems: MenuItem[];
  inventoryItems: InventoryItem[];
  customers: Customer[];
  orders: Order[];
  orderItems: OrderItem[];
}

export interface ApiLogEntry {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: number;
  timestamp: string;
  summary: string;
}
