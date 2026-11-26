import { AlertTriangle, CheckCircle2, Minus, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { CoffeeDatabaseState, InventoryCategory, InventoryItem } from '../types/database';
import { formatIDR } from '../utils/format';

interface InventoryViewProps {
  db: CoffeeDatabaseState;
  onAdjustStock: (id: string, delta: number) => void;
  onUpsertInventory: (item: Omit<InventoryItem, 'id' | 'lastRestocked'> & { id?: string }) => void;
}

const INV_CATEGORIES: InventoryCategory[] = [
  'Coffee Beans',
  'Dairy & Alt',
  'Syrup & Sweetener',
  'Tea & Powder',
  'Bakery',
  'Packaging',
];

export function InventoryView({ db, onAdjustStock, onUpsertInventory }: InventoryViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    sku: `INV-${Math.floor(100 + Math.random() * 899)}`,
    name: '',
    category: 'Coffee Beans' as InventoryCategory,
    stock: 2000,
    minStock: 1000,
    unit: 'g' as 'g' | 'ml' | 'pcs',
    costPerUnit: 300,
    supplier: '',
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onUpsertInventory(form);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
            Tabel inventory_items
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
            Inventori Bahan & Biji Kopi
          </h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Bahan Baku
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#6B5E55]">
                <th className="py-3 px-4">SKU & Bahan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4">Harga / Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Penyesuaian Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8DF] text-sm">
              {db.inventoryItems.map((item) => {
                const isLow = item.stock <= item.minStock;
                const restockStep = item.unit === 'pcs' ? 20 : 500;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1F1916]">{item.name}</div>
                      <div className="text-[11px] font-mono text-[#8C7E74]">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#6B5E55]">{item.category}</td>
                    <td className="py-3.5 px-4 text-xs text-[#6B5E55]">{item.supplier}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-[#1F1916]">
                        {item.stock.toLocaleString('id-ID')} {item.unit}
                      </div>
                      <div className="text-[11px] font-mono text-[#8C7E74]">
                        Min: {item.minStock.toLocaleString('id-ID')} {item.unit}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6B5E55]">
                      {formatIDR(item.costPerUnit)}/{item.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          Stok Rendah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onAdjustStock(item.id, -restockStep)}
                          className="px-2 py-1 rounded-lg border border-[#E8DFD5] bg-white hover:bg-[#F3ECE4] text-xs font-mono inline-flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          {restockStep}
                        </button>
                        <button
                          onClick={() => onAdjustStock(item.id, restockStep)}
                          className="px-2.5 py-1 rounded-lg bg-[#1F1916] hover:bg-[#332924] text-white text-xs font-mono inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {restockStep}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl border border-[#E8DFD5] w-full max-w-md p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#1F1916]">
                Tambah Bahan Baku
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3ECE4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">SKU</label>
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as InventoryCategory })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                >
                  {INV_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B5E55] mb-1">Nama Bahan</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Arabica Kintamani Natural"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Stok Awal</label>
                <input
                  type="number"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Min. Stok</label>
                <input
                  type="number"
                  required
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Satuan</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value as 'g' | 'ml' | 'pcs' })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">
                  Harga / Unit (IDR)
                </label>
                <input
                  type="number"
                  required
                  value={form.costPerUnit}
                  onChange={(e) => setForm({ ...form, costPerUnit: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Supplier</label>
                <input
                  required
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Nama supplier"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-[#6B5E55] hover:bg-[#F3ECE4]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] text-white text-sm font-medium"
              >
                Simpan Bahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
