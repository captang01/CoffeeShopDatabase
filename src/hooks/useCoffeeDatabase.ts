import { useCallback, useEffect, useState } from 'react';
import { INITIAL_SEED_DATA } from '../data/seedData';
import {
  ApiLogEntry,
  CoffeeDatabaseState,
  Customer,
  InventoryItem,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from '../types/database';

const STORAGE_KEY = 'kopinusa_db_v1';

function loadInitialState(): CoffeeDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SEED_DATA;
    const parsed = JSON.parse(raw) as CoffeeDatabaseState;
    if (parsed && Array.isArray(parsed.menuItems) && Array.isArray(parsed.orders)) {
      return parsed;
    }
  } catch {
    // ignore storage read error
  }
  return INITIAL_SEED_DATA;
}

export function useCoffeeDatabase() {
  const [db, setDb] = useState<CoffeeDatabaseState>(loadInitialState);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([
    {
      id: 'log_init',
      method: 'GET',
      endpoint: '/api/v1/bootstrap?tables=all',
      status: 200,
      timestamp: new Date().toISOString(),
      summary: 'Loaded relational coffee shop state',
    },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore storage write error
    }
  }, [db]);

  const pushLog = useCallback((method: ApiLogEntry['method'], endpoint: string, status: number, summary: string) => {
    setApiLogs((prev) => [
      {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        method,
        endpoint,
        status,
        timestamp: new Date().toISOString(),
        summary,
      },
      ...prev.slice(0, 24),
    ]);
  }, []);

  // Menu CRUD
  const upsertMenuItem = useCallback(
    (item: Omit<MenuItem, 'id' | 'updatedAt'> & { id?: string }) => {
      const now = new Date().toISOString();
      const isEdit = Boolean(item.id);
      const finalId = item.id ?? `mnu_${Date.now().toString().slice(-4)}`;
      setDb((prev) => {
        const nextItem: MenuItem = { ...item, id: finalId, updatedAt: now };
        const exists = prev.menuItems.some((m) => m.id === finalId);
        return {
          ...prev,
          menuItems: exists
            ? prev.menuItems.map((m) => (m.id === finalId ? nextItem : m))
            : [nextItem, ...prev.menuItems],
        };
      });
      pushLog(isEdit ? 'PATCH' : 'POST', `/api/v1/menu_items${isEdit ? `/${finalId}` : ''}`, isEdit ? 200 : 201, `${isEdit ? 'Updated' : 'Created'} menu "${item.name}"`);
    },
    [pushLog],
  );

  const toggleMenuAvailability = useCallback(
    (id: string) => {
      setDb((prev) => ({
        ...prev,
        menuItems: prev.menuItems.map((m) =>
          m.id === id ? { ...m, available: !m.available, updatedAt: new Date().toISOString() } : m,
        ),
      }));
      pushLog('PATCH', `/api/v1/menu_items/${id}`, 200, 'Toggled menu availability');
    },
    [pushLog],
  );

  const deleteMenuItem = useCallback(
    (id: string) => {
      setDb((prev) => ({
        ...prev,
        menuItems: prev.menuItems.filter((m) => m.id !== id),
      }));
      pushLog('DELETE', `/api/v1/menu_items/${id}`, 200, 'Deleted menu record');
    },
    [pushLog],
  );

  // Inventory CRUD & Stock Adjustment
  const upsertInventoryItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'lastRestocked'> & { id?: string }) => {
      const now = new Date().toISOString();
      const isEdit = Boolean(item.id);
      const finalId = item.id ?? `inv_${Date.now().toString().slice(-4)}`;
      setDb((prev) => {
        const nextItem: InventoryItem = { ...item, id: finalId, lastRestocked: now };
        const exists = prev.inventoryItems.some((i) => i.id === finalId);
        return {
          ...prev,
          inventoryItems: exists
            ? prev.inventoryItems.map((i) => (i.id === finalId ? nextItem : i))
            : [nextItem, ...prev.inventoryItems],
        };
      });
      pushLog(isEdit ? 'PATCH' : 'POST', `/api/v1/inventory_items${isEdit ? `/${finalId}` : ''}`, isEdit ? 200 : 201, `${isEdit ? 'Updated' : 'Added'} stock "${item.name}"`);
    },
    [pushLog],
  );

  const adjustInventoryStock = useCallback(
    (id: string, delta: number) => {
      setDb((prev) => ({
        ...prev,
        inventoryItems: prev.inventoryItems.map((item) =>
          item.id === id
            ? {
                ...item,
                stock: Math.max(0, item.stock + delta),
                lastRestocked: delta > 0 ? new Date().toISOString() : item.lastRestocked,
              }
            : item,
        ),
      }));
      pushLog('PATCH', `/api/v1/inventory_items/${id}/stock`, 200, `Adjusted stock by ${delta > 0 ? `+${delta}` : delta}`);
    },
    [pushLog],
  );

  // Customer CRUD
  const upsertCustomer = useCallback(
    (customer: Omit<Customer, 'id' | 'joinedAt' | 'totalOrders' | 'totalSpent'> & { id?: string }) => {
      const isEdit = Boolean(customer.id);
      const finalId = customer.id ?? `cus_${Date.now().toString().slice(-4)}`;
      setDb((prev) => {
        const existing = prev.customers.find((c) => c.id === finalId);
        const nextCustomer: Customer = {
          ...customer,
          id: finalId,
          joinedAt: existing?.joinedAt ?? new Date().toISOString().slice(0, 10),
          totalOrders: existing?.totalOrders ?? 0,
          totalSpent: existing?.totalSpent ?? 0,
        };
        return {
          ...prev,
          customers: existing
            ? prev.customers.map((c) => (c.id === finalId ? nextCustomer : c))
            : [nextCustomer, ...prev.customers],
        };
      });
      pushLog(isEdit ? 'PATCH' : 'POST', `/api/v1/customers${isEdit ? `/${finalId}` : ''}`, isEdit ? 200 : 201, `${isEdit ? 'Updated' : 'Registered'} customer "${customer.name}"`);
    },
    [pushLog],
  );

  // Create Order (Relational transaction: inserts order + order_items, deducts inventory via recipes, updates customer loyalty)
  const createOrder = useCallback(
    (payload: {
      customerId: string | null;
      orderType: OrderType;
      tableNumber?: string;
      paymentMethod: PaymentMethod;
      barista: string;
      cart: { menuItemId: string; quantity: number; notes?: string }[];
    }) => {
      if (payload.cart.length === 0) return;
      const orderId = `ord_${Date.now().toString().slice(-5)}`;
      const orderNum = `#KN-${Math.floor(1043 + Math.random() * 8900)}`;

      setDb((prev) => {
        const customer = payload.customerId
          ? prev.customers.find((c) => c.id === payload.customerId) ?? null
          : null;

        const newOrderItems: OrderItem[] = [];
        const inventoryDeductions: Record<string, number> = {};
        let totalAmount = 0;

        payload.cart.forEach((line, idx) => {
          const menu = prev.menuItems.find((m) => m.id === line.menuItemId);
          if (!menu) return;
          const subtotal = menu.price * line.quantity;
          totalAmount += subtotal;

          newOrderItems.push({
            id: `oi_${Date.now().toString().slice(-4)}_${idx}`,
            orderId,
            menuItemId: menu.id,
            menuItemName: menu.name,
            quantity: line.quantity,
            unitPrice: menu.price,
            subtotal,
            notes: line.notes,
          });

          menu.recipe.forEach((ing) => {
            inventoryDeductions[ing.inventoryId] =
              (inventoryDeductions[ing.inventoryId] ?? 0) + ing.quantity * line.quantity;
          });
        });

        const newOrder: Order = {
          id: orderId,
          orderNumber: orderNum,
          customerId: customer?.id ?? null,
          customerName: customer?.name ?? 'Walk-in Guest',
          orderType: payload.orderType,
          tableNumber: payload.orderType === 'dine-in' ? payload.tableNumber || 'Meja 01' : undefined,
          paymentMethod: payload.paymentMethod,
          status: 'pending',
          totalAmount,
          createdAt: new Date().toISOString(),
          barista: payload.barista,
        };

        const updatedInventory = prev.inventoryItems.map((inv) => {
          const used = inventoryDeductions[inv.id] ?? 0;
          return used > 0 ? { ...inv, stock: Math.max(0, inv.stock - used) } : inv;
        });

        const earnedPoints = Math.floor(totalAmount / 1000);
        const updatedCustomers = customer
          ? prev.customers.map((c) =>
              c.id === customer.id
                ? {
                    ...c,
                    points: c.points + earnedPoints,
                    totalOrders: c.totalOrders + 1,
                    totalSpent: c.totalSpent + totalAmount,
                  }
                : c,
            )
          : prev.customers;

        return {
          ...prev,
          orders: [newOrder, ...prev.orders],
          orderItems: [...newOrderItems, ...prev.orderItems],
          inventoryItems: updatedInventory,
          customers: updatedCustomers,
        };
      });

      pushLog('POST', '/api/v1/orders (TX)', 201, `Created order ${orderNum} + deducted recipe inventory`);
    },
    [pushLog],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setDb((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
      }));
      pushLog('PATCH', `/api/v1/orders/${orderId}`, 200, `Updated order status → ${status}`);
    },
    [pushLog],
  );

  const resetDatabase = useCallback(() => {
    setDb(INITIAL_SEED_DATA);
    localStorage.removeItem(STORAGE_KEY);
    pushLog('POST', '/api/v1/admin/reset-seed', 200, 'Reset all tables to initial seed data');
  }, [pushLog]);

  return {
    db,
    apiLogs,
    upsertMenuItem,
    toggleMenuAvailability,
    deleteMenuItem,
    upsertInventoryItem,
    adjustInventoryStock,
    upsertCustomer,
    createOrder,
    updateOrderStatus,
    resetDatabase,
  };
}
