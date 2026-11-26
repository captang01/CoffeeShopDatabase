import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { CoffeeDatabaseState, MenuCategory, MenuItem } from '../types/database';
import { formatIDR } from '../utils/format';

interface MenuViewProps {
  db: CoffeeDatabaseState;
  onUpsertMenu: (item: Omit<MenuItem, 'id' | 'updatedAt'> & { id?: string }) => void;
  onToggleAvailability: (id: string) => void;
  onDeleteMenu: (id: string) => void;
}

const CATEGORIES: MenuCategory[] = ['Espresso', 'Manual Brew', 'Signature Milk', 'Non-Coffee', 'Pastry'];

export function MenuView({ db, onUpsertMenu, onToggleAvailability, onDeleteMenu }: MenuViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | 'All'>('All');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    sku: '',
    name: '',
    category: 'Espresso' as MenuCategory,
    price: 30000,
    prepTimeMin: 3,
    description: '',
    available: true,
  });

  const openCreateModal = () => {
    setEditing(null);
    setForm({
      sku: `MNU-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      category: 'Espresso',
      price: 30000,
      prepTimeMin: 3,
      description: '',
      available: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditing(item);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: item.price,
      prepTimeMin: item.prepTimeMin,
      description: item.description,
      available: item.available,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onUpsertMenu({
      id: editing?.id,
      ...form,
      recipe: editing?.recipe ?? [{ inventoryId: db.inventoryItems[0]?.id ?? 'inv_01', quantity: 18 }],
    });
    setIsModalOpen(false);
  };

  const computeHpp = (item: MenuItem) =>
    item.recipe.reduce((sum, ing) => {
      const inv = db.inventoryItems.find((i) => i.id === ing.inventoryId);
      return sum + (inv ? inv.costPerUnit * ing.quantity : 0);
    }, 0);

  const filtered = db.menuItems.filter((m) => {
    const matchesCat = categoryFilter === 'All' || m.category === categoryFilter;
    const matchesQuery =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
            Tabel menu_items & recipes
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
            Katalog Menu & HPP Resep
          </h2>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Menu
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8C7E74] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama menu atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E8DFD5] bg-white outline-none focus:border-[#C26D3A]"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#1F1916] text-white'
                  : 'bg-white border border-[#E8DFD5] text-[#6B5E55] hover:bg-[#F3ECE4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#6B5E55]">
                <th className="py-3 px-4">SKU & Menu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Resep Bahan (FK)</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Est. HPP / Margin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8DF] text-sm">
              {filtered.map((item) => {
                const hpp = computeHpp(item);
                const marginPct = item.price > 0 ? Math.round(((item.price - hpp) / item.price) * 100) : 0;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF7F2]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1F1916]">{item.name}</div>
                      <div className="text-[11px] font-mono text-[#8C7E74]">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#E8DFD5] text-[#6B5E55]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.recipe.map((ing) => {
                          const inv = db.inventoryItems.find((i) => i.id === ing.inventoryId);
                          return (
                            <span
                              key={ing.inventoryId}
                              className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F3ECE4] text-[#5C4E45]"
                            >
                              {inv?.name.split(' ')[0] ?? ing.inventoryId}: {ing.quantity}
                              {inv?.unit ?? ''}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1F1916]">
                      {formatIDR(item.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-[#6B5E55]">{formatIDR(hpp)}</div>
                      <div className="text-[11px] font-mono text-emerald-700">{marginPct}% margin</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onToggleAvailability(item.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          item.available
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {item.available ? 'Tersedia' : 'Habis'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-[#6B5E55] hover:text-[#1F1916] hover:bg-[#F3ECE4]"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteMenu(item.id)}
                          className="p-1.5 rounded-lg text-[#6B5E55] hover:text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
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
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-[#E8DFD5] w-full max-w-md p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#1F1916]">
                {editing ? 'Edit Menu' : 'Tambah Menu Baru'}
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
                  onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B5E55] mb-1">Nama Menu</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Misal: Caramel Macchiato"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Harga (IDR)</label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={500}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Waktu Saji (mnt)</label>
                <input
                  type="number"
                  min={1}
                  value={form.prepTimeMin}
                  onChange={(e) => setForm({ ...form, prepTimeMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B5E55] mb-1">Deskripsi</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
              />
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
                Simpan Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
