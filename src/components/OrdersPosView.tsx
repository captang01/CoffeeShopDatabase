import { Minus, Plus, Receipt, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CoffeeDatabaseState, OrderStatus, OrderType, PaymentMethod } from '../types/database';
import { formatIDR, formatTimeAgo } from '../utils/format';

interface OrdersPosViewProps {
  db: CoffeeDatabaseState;
  onCreateOrder: (payload: {
    customerId: string | null;
    orderType: OrderType;
    tableNumber?: string;
    paymentMethod: PaymentMethod;
    barista: string;
    cart: { menuItemId: string; quantity: number; notes?: string }[];
  }) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  brewing: 'bg-orange-50 text-orange-800 border-orange-200',
  ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-stone-100 text-stone-700 border-stone-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function OrdersPosView({ db, onCreateOrder, onUpdateOrderStatus }: OrdersPosViewProps) {
  const [cart, setCart] = useState<{ menuItemId: string; quantity: number }[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState('Meja 01');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [barista, setBarista] = useState('Arif');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const addToCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === menuItemId);
      if (existing) {
        return prev.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { menuItemId, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((sum, line) => {
    const menu = db.menuItems.find((m) => m.id === line.menuItemId);
    return sum + (menu?.price ?? 0) * line.quantity;
  }, 0);

  const handleSubmitOrder = () => {
    if (cart.length === 0) return;
    onCreateOrder({
      customerId: customerId || null,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      paymentMethod,
      barista,
      cart,
    });
    setCart([]);
  };

  const filteredOrders =
    statusFilter === 'all' ? db.orders : db.orders.filter((o) => o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
          Transaksi & Antrean Barista
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
          Point of Sale & Tabel Orders
        </h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: POS Builder */}
        <div className="xl:col-span-5 bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[#1F1916] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#C26D3A]" />
                Buat Pesanan Baru
              </h3>
              <span className="text-[11px] font-mono text-[#6B5E55]">Auto-deduct stok resep</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {db.menuItems
                .filter((m) => m.available)
                .map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => addToCart(menu.id)}
                    className="text-left p-3 rounded-xl border border-[#E8DFD5] hover:border-[#C26D3A] hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div className="text-xs font-semibold text-[#1F1916] line-clamp-1">{menu.name}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-[#8C7E74]">{menu.category}</span>
                      <span className="font-mono text-xs font-semibold text-[#C26D3A]">
                        {formatIDR(menu.price)}
                      </span>
                    </div>
                  </button>
                ))}
            </div>

            {/* Cart Items */}
            <div className="border-t border-[#F0E8DF] pt-3 space-y-2">
              {cart.length === 0 ? (
                <p className="text-xs text-[#8C7E74] text-center py-4">
                  Pilih menu di atas untuk menambahkan ke keranjang pesanan.
                </p>
              ) : (
                cart.map((line) => {
                  const menu = db.menuItems.find((m) => m.id === line.menuItemId);
                  if (!menu) return null;
                  return (
                    <div
                      key={line.menuItemId}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#FAF7F2]"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#1F1916] truncate">{menu.name}</div>
                        <div className="text-[11px] font-mono text-[#6B5E55]">
                          {formatIDR(menu.price * line.quantity)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(line.menuItemId, -1)}
                          className="w-6 h-6 rounded-md bg-white border border-[#E8DFD5] flex items-center justify-center hover:bg-[#F3ECE4]"
                        >
                          {line.quantity === 1 ? (
                            <Trash2 className="w-3 h-3 text-red-600" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                        </button>
                        <span className="font-mono text-xs w-5 text-center">{line.quantity}</span>
                        <button
                          onClick={() => updateQty(line.menuItemId, 1)}
                          className="w-6 h-6 rounded-md bg-white border border-[#E8DFD5] flex items-center justify-center hover:bg-[#F3ECE4]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Order Metadata */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F0E8DF]">
              <div>
                <label className="block text-[11px] font-medium text-[#6B5E55] mb-1">
                  Pelanggan (FK)
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
                >
                  <option value="">Walk-in Guest</option>
                  {db.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B5E55] mb-1">
                  Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
                >
                  <option value="QRIS">QRIS</option>
                  <option value="Cash">Cash</option>
                  <option value="Debit/Credit">Debit/Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B5E55] mb-1">Tipe</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
                >
                  <option value="dine-in">Dine-in</option>
                  <option value="takeaway">Takeaway</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B5E55] mb-1">
                  {orderType === 'dine-in' ? 'Nomor Meja' : 'Barista'}
                </label>
                {orderType === 'dine-in' ? (
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
                  />
                ) : (
                  <input
                    type="text"
                    value={barista}
                    onChange={(e) => setBarista(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8DFD5] flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-[#6B5E55]">Total Tagihan</div>
              <div className="font-mono text-xl font-semibold text-[#1F1916]">
                {formatIDR(cartTotal)}
              </div>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Simpan Transaksi
            </button>
          </div>
        </div>

        {/* Right: Orders Table */}
        <div className="xl:col-span-7 bg-white rounded-2xl border border-[#E8DFD5] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold text-[#1F1916] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C26D3A]" />
              Riwayat & Antrean Pesanan ({filteredOrders.length})
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'pending', 'brewing', 'ready', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-[#1F1916] text-white'
                      : 'bg-[#FAF7F2] text-[#6B5E55] hover:bg-[#EFE7DD]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const items = db.orderItems.filter((oi) => oi.orderId === order.id);
              return (
                <div
                  key={order.id}
                  className="p-4 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2]/50 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-[#1F1916]">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm font-medium text-[#1F1916]">{order.customerName}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-[#E8DFD5] text-[#6B5E55]">
                        {order.paymentMethod}
                      </span>
                      <span className="text-[11px] text-[#8C7E74]">
                        Barista: {order.barista} · {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer outline-none ${STATUS_BADGE[order.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="brewing">Brewing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B5E55]">
                    <div>
                      {items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(' · ')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-[#1F1916]">
                      {formatIDR(order.totalAmount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
