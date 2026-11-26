import {
  Coffee,
  Database,
  LayoutDashboard,
  Package,
  Receipt,
  RotateCcw,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { CoffeeDatabaseState } from '../types/database';

export type ActiveTab = 'overview' | 'pos' | 'menu' | 'inventory' | 'customers' | 'schema';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  db: CoffeeDatabaseState;
  onReset: () => void;
}

export function Sidebar({ activeTab, onSelectTab, db, onReset }: SidebarProps) {
  const lowStockCount = db.inventoryItems.filter((i) => i.stock <= i.minStock).length;
  const activeOrdersCount = db.orders.filter(
    (o) => o.status === 'pending' || o.status === 'brewing' || o.status === 'ready',
  ).length;

  const navItems: {
    id: ActiveTab;
    label: string;
    sublabel: string;
    icon: typeof LayoutDashboard;
    badge?: string | number;
    badgeTone?: 'amber' | 'terracotta' | 'neutral';
  }[] = [
    {
      id: 'overview',
      label: 'Ringkasan',
      sublabel: 'Live Analytics',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'POS & Pesanan',
      sublabel: 'orders · order_items',
      icon: Receipt,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeTone: 'terracotta',
    },
    {
      id: 'menu',
      label: 'Menu & Resep',
      sublabel: 'menu_items · recipes',
      icon: UtensilsCrossed,
      badge: db.menuItems.length,
      badgeTone: 'neutral',
    },
    {
      id: 'inventory',
      label: 'Inventori & Biji',
      sublabel: 'inventory_items',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : db.inventoryItems.length,
      badgeTone: lowStockCount > 0 ? 'amber' : 'neutral',
    },
    {
      id: 'customers',
      label: 'Pelanggan',
      sublabel: 'customers · loyalty',
      icon: Users,
      badge: db.customers.length,
      badgeTone: 'neutral',
    },
    {
      id: 'schema',
      label: 'Skema & API',
      sublabel: 'ERD · SQL · JSON',
      icon: Database,
    },
  ];

  return (
    <aside className="w-full lg:w-68 shrink-0 bg-[#1F1916] text-[#F5EFE6] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#332924]">
      <div>
        <div className="px-5 py-5 border-b border-[#332924] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C26D3A] flex items-center justify-center text-white shadow-sm">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-white leading-tight">
              KopiNusa DB
            </h1>
            <p className="text-[11px] font-mono text-[#B7A99E]">Full-Stack Roastery Console</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                  isActive
                    ? 'bg-[#C26D3A] text-white'
                    : 'text-[#D6CCC2] hover:bg-[#2C2420] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight truncate">{item.label}</div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isActive ? 'text-white/80' : 'text-[#8C7E74]'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeTone === 'amber'
                          ? 'bg-amber-500/20 text-amber-300'
                          : item.badgeTone === 'terracotta'
                            ? 'bg-[#C26D3A]/30 text-[#F4B692]'
                            : 'bg-[#332924] text-[#C8BBB0]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#332924] space-y-3">
        <div className="rounded-xl bg-[#2A221E] p-3 border border-[#3B302A]">
          <div className="flex items-center justify-between text-xs text-[#C8BBB0] mb-1">
            <span className="font-medium">Storage Engine</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-[11px] text-[#8C7E74] leading-relaxed">
            6 tabel relasional tersinkron otomatis di browser.
          </p>
        </div>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#C8BBB0] hover:text-white hover:bg-[#2C2420] border border-[#3B302A] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Data Demo
        </button>
      </div>
    </aside>
  );
}
