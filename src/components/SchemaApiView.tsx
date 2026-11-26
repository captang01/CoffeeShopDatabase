import { Check, Code2, Copy, Database, Terminal } from 'lucide-react';
import { useState } from 'react';
import { POSTGRES_SCHEMA_SQL } from '../data/seedData';
import { ApiLogEntry, CoffeeDatabaseState, TableName } from '../types/database';

interface SchemaApiViewProps {
  db: CoffeeDatabaseState;
  apiLogs: ApiLogEntry[];
}

const ERD_TABLES: {
  name: TableName | 'recipes';
  role: string;
  columns: { name: string; type: string; key?: 'PK' | 'FK' }[];
}[] = [
  {
    name: 'menu_items',
    role: 'Katalog produk & harga jual',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', key: 'PK' },
      { name: 'sku', type: 'VARCHAR(40)' },
      { name: 'name', type: 'VARCHAR(140)' },
      { name: 'category', type: 'VARCHAR(48)' },
      { name: 'price', type: 'INTEGER' },
      { name: 'available', type: 'BOOLEAN' },
    ],
  },
  {
    name: 'recipes',
    role: 'Relasi M:N Menu ↔ Bahan Baku',
    columns: [
      { name: 'menu_item_id', type: 'VARCHAR(32)', key: 'FK' },
      { name: 'inventory_id', type: 'VARCHAR(32)', key: 'FK' },
      { name: 'quantity', type: 'INTEGER' },
    ],
  },
  {
    name: 'inventory_items',
    role: 'Stok biji kopi, susu & bahan',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', key: 'PK' },
      { name: 'sku', type: 'VARCHAR(40)' },
      { name: 'name', type: 'VARCHAR(140)' },
      { name: 'stock', type: 'INTEGER' },
      { name: 'min_stock', type: 'INTEGER' },
      { name: 'unit', type: 'VARCHAR(12)' },
    ],
  },
  {
    name: 'orders',
    role: 'Header transaksi POS',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', key: 'PK' },
      { name: 'order_number', type: 'VARCHAR(24)' },
      { name: 'customer_id', type: 'VARCHAR(32)', key: 'FK' },
      { name: 'status', type: 'VARCHAR(24)' },
      { name: 'total_amount', type: 'INTEGER' },
      { name: 'payment_method', type: 'VARCHAR(24)' },
    ],
  },
  {
    name: 'order_items',
    role: 'Detail item per pesanan',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', key: 'PK' },
      { name: 'order_id', type: 'VARCHAR(32)', key: 'FK' },
      { name: 'menu_item_id', type: 'VARCHAR(32)', key: 'FK' },
      { name: 'quantity', type: 'INTEGER' },
      { name: 'subtotal', type: 'INTEGER' },
    ],
  },
  {
    name: 'customers',
    role: 'Member & poin loyalitas',
    columns: [
      { name: 'id', type: 'VARCHAR(32)', key: 'PK' },
      { name: 'name', type: 'VARCHAR(120)' },
      { name: 'email', type: 'VARCHAR(160)' },
      { name: 'tier', type: 'VARCHAR(24)' },
      { name: 'points', type: 'INTEGER' },
      { name: 'total_spent', type: 'INTEGER' },
    ],
  },
];

export function SchemaApiView({ db, apiLogs }: SchemaApiViewProps) {
  const [selectedTable, setSelectedTable] = useState<TableName>('menu_items');
  const [copied, setCopied] = useState(false);

  const tableDataMap: Record<TableName, unknown> = {
    menu_items: db.menuItems,
    inventory_items: db.inventoryItems,
    orders: db.orders,
    order_items: db.orderItems,
    customers: db.customers,
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(POSTGRES_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-[#C26D3A] font-semibold">
          Arsitektur Database Relasional
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1F1916] mt-0.5">
          Skema ERD, PostgreSQL DDL & API Inspector
        </h2>
      </div>

      {/* ERD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ERD_TABLES.map((table) => (
          <div
            key={table.name}
            className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs"
          >
            <div className="px-4 py-3 bg-[#1F1916] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-[#F4B692]" />
                <span className="font-mono text-xs font-semibold">{table.name}</span>
              </div>
              <span className="text-[10px] text-[#C8BBB0]">{table.role}</span>
            </div>
            <div className="divide-y divide-[#F0E8DF] px-4 py-1.5">
              {table.columns.map((col) => (
                <div key={col.name} className="py-1.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {col.key && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          col.key === 'PK'
                            ? 'bg-[#C26D3A]/15 text-[#9A4E22]'
                            : 'bg-sky-50 text-sky-700'
                        }`}
                      >
                        {col.key}
                      </span>
                    )}
                    <span className="font-mono text-[#1F1916]">{col.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#8C7E74]">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PostgreSQL DDL */}
        <div className="bg-[#1F1916] text-[#F5EFE6] rounded-2xl border border-[#332924] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#332924] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Code2 className="w-4 h-4 text-[#F4B692]" />
              schema.sql (PostgreSQL)
            </div>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2C2420] hover:bg-[#3B302A] text-xs font-mono text-[#E8DFD5]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Tersalin' : 'Salin SQL'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 text-[#E8DFD5]">
            {POSTGRES_SCHEMA_SQL}
          </pre>
        </div>

        {/* Live JSON & API Mutation Logs */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8DFD5] overflow-hidden shadow-xs">
            <div className="px-4 py-3 border-b border-[#E8DFD5] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-[#1F1916]">
                Live JSON Inspector
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  ['menu_items', 'inventory_items', 'orders', 'order_items', 'customers'] as TableName[]
                ).map((tbl) => (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                      selectedTable === tbl
                        ? 'bg-[#C26D3A] text-white'
                        : 'bg-white border border-[#E8DFD5] text-[#6B5E55]'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>
            <pre className="p-4 text-[11px] font-mono bg-[#FAF7F2]/40 text-[#1F1916] overflow-auto max-h-56">
              {JSON.stringify(tableDataMap[selectedTable], null, 2)}
            </pre>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DFD5] p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#1F1916]">
              <Terminal className="w-4 h-4 text-[#C26D3A]" />
              API Transaction Log
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {apiLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 text-[11px] font-mono py-1 px-2 rounded-lg bg-[#FAF7F2]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        log.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.method === 'PATCH'
                            ? 'bg-amber-100 text-amber-800'
                            : log.method === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {log.method}
                    </span>
                    <span className="text-[#1F1916] truncate">{log.endpoint}</span>
                  </div>
                  <span className="text-[#6B5E55] shrink-0 truncate max-w-44">{log.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
