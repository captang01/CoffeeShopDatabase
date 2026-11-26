import { Award, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { CoffeeDatabaseState, Customer, LoyaltyTier } from '../types/database';
import { formatIDR } from '../utils/format';

interface CustomersViewProps {
  db: CoffeeDatabaseState;
  onUpsertCustomer: (
    customer: Omit<Customer, 'id' | 'joinedAt' | 'totalOrders' | 'totalSpent'> & { id?: string },
  ) => void;
}

const TIER_BADGE: Record<LoyaltyTier, string> = {
  Regular: 'bg-stone-100 text-stone-700 border-stone-200',
  Gold: 'bg-amber-50 text-amber-800 border-amber-200',
  'Roaster Club': 'bg-[#C26D3A]/15 text-[#9A4E22] border-[#C26D3A]/30',
};

export function CustomersView({ db, onUpsertCustomer }: CustomersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    tier: 'Regular' as LoyaltyTier,
    points: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    onUpsertCustomer(form);
    setForm({ name: '', email: '', phone: '', tier: 'Regular', points: 0 });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
            Tabel customers
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
            Pelanggan & Program Loyalitas
          </h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C26D3A] hover:bg-[#A95B2D] text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Daftar Member Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFD5] bg-[#FAF7F2] text-[11px] font-mono uppercase text-[#6B5E55]">
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Poin</th>
                <th className="py-3 px-4">Total Pesanan</th>
                <th className="py-3 px-4">Total Belanja</th>
                <th className="py-3 px-4">Bergabung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E8DF] text-sm">
              {db.customers.map((cus) => (
                <tr key={cus.id} className="hover:bg-[#FAF7F2]/60">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#1F1916]">{cus.name}</div>
                    <div className="text-[11px] font-mono text-[#8C7E74]">{cus.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-[#1F1916]">{cus.email}</div>
                    <div className="text-[11px] font-mono text-[#6B5E55]">{cus.phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${TIER_BADGE[cus.tier]}`}
                    >
                      <Award className="w-3 h-3" />
                      {cus.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#C26D3A]">
                    {cus.points} pts
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#1F1916]">
                    {cus.totalOrders}×
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#1F1916]">
                    {formatIDR(cus.totalSpent)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#6B5E55]">{cus.joinedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#E8DFD5] w-full max-w-md p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-[#1F1916]">
                Tambah Member Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3ECE4]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B5E55] mb-1">Nama Lengkap</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5E55] mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">No. HP</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0812-xxxx-xxxx"
                  className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B5E55] mb-1">Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value as LoyaltyTier })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E8DFD5] outline-none focus:border-[#C26D3A]"
                >
                  <option value="Regular">Regular</option>
                  <option value="Gold">Gold</option>
                  <option value="Roaster Club">Roaster Club</option>
                </select>
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
                Simpan Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
