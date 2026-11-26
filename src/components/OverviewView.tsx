import { AlertTriangle, ArrowRight, Coffee, CreditCard, TrendingUp, Users } from 'lucide-react';
import { CoffeeDatabaseState, OrderStatus } from '../types/database';
import { formatIDR, formatTimeAgo } from '../utils/format';
import { ActiveTab } from './Sidebar';

interface OverviewViewProps {
  db: CoffeeDatabaseState;
  onNavigate: (tab: ActiveTab) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  brewing: 'bg-orange-50 text-orange-800 border-orange-200',
  ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-stone-100 text-stone-700 border-stone-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function OverviewView({ db, onNavigate, onUpdateOrderStatus }: OverviewViewProps) {
  const totalRevenue = db.orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeOrders = db.orders.filter(
    (o) => o.status === 'pending' || o.status === 'brewing' || o.status === 'ready',
  );

  const lowStockItems = db.inventoryItems.filter((i) => i.stock <= i.minStock);

  // Calculate sales per menu category
  const categoryTotals: Record<string, number> = {};
  db.orderItems.forEach((oi) => {
    const menu = db.menuItems.find((m) => m.id === oi.menuItemId);
    const cat = menu?.category ?? 'Lainnya';
    categoryTotals[cat] = (categoryTotals[cat] ?? 0) + oi.subtotal;
  });
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCategoryRev = Math.max(...categoryEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
            Dashboard Operasional
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
            Ringkasan Kedai & Database
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] text-white text-sm font-medium transition-colors shadow-sm"
          >
            Buat Pesanan Baru
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <div className="flex items-center justify-between text-[#6B5E55] mb-3">
            <span className="text-xs font-medium">Total Pendapatan</span>
            <CreditCard className="w-4 h-4 text-[#C26D3A]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#1F1916]">
            {formatIDR(totalRevenue)}
          </div>
          <p className="text-xs text-[#6B5E55] mt-1">
            Dari {db.orders.filter((o) => o.status !== 'cancelled').length} transaksi tercatat
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <div className="flex items-center justify-between text-[#6B5E55] mb-3">
            <span className="text-xs font-medium">Antrean Barista Aktif</span>
            <Coffee className="w-4 h-4 text-[#C26D3A]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#1F1916]">
            {activeOrders.length} Pesanan
          </div>
          <p className="text-xs text-[#6B5E55] mt-1">
            {db.orders.filter((o) => o.status === 'brewing').length} sedang diseduh
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <div className="flex items-center justify-between text-[#6B5E55] mb-3">
            <span className="text-xs font-medium">Peringatan Stok Minimum</span>
            <AlertTriangle
              className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
            />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#1F1916]">
            {lowStockItems.length} Bahan
          </div>
          <p className="text-xs text-[#6B5E55] mt-1">
            {lowStockItems.length > 0
              ? 'Perlu restock segera'
              : 'Semua stok dalam batas aman'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD5] shadow-xs">
          <div className="flex items-center justify-between text-[#6B5E55] mb-3">
            <span className="text-xs font-medium">Member & Loyalty</span>
            <Users className="w-4 h-4 text-[#C26D3A]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#1F1916]">
            {db.customers.length} Pelanggan
          </div>
          <p className="text-xs text-[#6B5E55] mt-1">
            {db.menuItems.filter((m) => m.available).length} menu aktif tersedia
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Order Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#1F1916]">
                Antrean Pesanan Terbaru
              </h3>
              <p className="text-xs text-[#6B5E55]">
                Tabel <code className="font-mono text-[#C26D3A]">orders</code> &{' '}
                <code className="font-mono text-[#C26D3A]">order_items</code>
              </p>
            </div>
            <button
              onClick={() => onNavigate('pos')}
              className="text-xs font-medium text-[#C26D3A] hover:underline"
            >
              Buka POS Lengkap
            </button>
          </div>

          <div className="divide-y divide-[#F0E8DF]">
            {db.orders.slice(0, 5).map((order) => {
              const items = db.orderItems.filter((oi) => oi.orderId === order.id);
              return (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-[#1F1916]">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm font-medium text-[#1F1916]">
                        {order.customerName}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[#6B5E55]">
                        {order.orderType === 'dine-in'
                          ? order.tableNumber || 'Dine-in'
                          : 'Takeaway'}
                      </span>
                      <span className="text-[11px] text-[#8C7E74]">
                        {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5E55]">
                      {items.map((i) => `${i.quantity}x ${i.menuItemName}`).join(' · ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="font-mono text-sm font-semibold text-[#1F1916]">
                      {formatIDR(order.totalAmount)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer outline-none ${STATUS_STYLES[order.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="brewing">Brewing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown & Low Stock */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-[#1F1916]">
                Penjualan per Kategori
              </h3>
              <TrendingUp className="w-4 h-4 text-[#C26D3A]" />
            </div>
            <div className="space-y-3">
              {categoryEntries.map(([category, amount]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1F1916]">{category}</span>
                    <span className="font-mono text-[#6B5E55]">{formatIDR(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3ECE4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C26D3A]"
                      style={{ width: `${Math.round((amount / maxCategoryRev) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold text-[#1F1916]">
                Stok Perlu Perhatian
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-medium text-[#C26D3A] hover:underline"
              >
                Kelola Stok
              </button>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-[#6B5E55]">Semua bahan baku di atas batas minimum.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#1F1916]">{item.name}</div>
                      <div className="text-[11px] font-mono text-amber-800">
                        Sisa: {item.stock} {item.unit} (Min: {item.minStock} {item.unit})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
