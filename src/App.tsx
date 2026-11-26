import { useState } from 'react';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { MenuView } from './components/MenuView';
import { OrdersPosView } from './components/OrdersPosView';
import { OverviewView } from './components/OverviewView';
import { SchemaApiView } from './components/SchemaApiView';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { useCoffeeDatabase } from './hooks/useCoffeeDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const {
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
  } = useCoffeeDatabase();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF7F2] text-[#1F1916]">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} db={db} onReset={resetDatabase} />

      <main className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              db={db}
              onNavigate={setActiveTab}
              onUpdateOrderStatus={updateOrderStatus}
            />
          )}
          {activeTab === 'pos' && (
            <OrdersPosView
              db={db}
              onCreateOrder={createOrder}
              onUpdateOrderStatus={updateOrderStatus}
            />
          )}
          {activeTab === 'menu' && (
            <MenuView
              db={db}
              onUpsertMenu={upsertMenuItem}
              onToggleAvailability={toggleMenuAvailability}
              onDeleteMenu={deleteMenuItem}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryView
              db={db}
              onAdjustStock={adjustInventoryStock}
              onUpsertInventory={upsertInventoryItem}
            />
          )}
          {activeTab === 'customers' && (
            <CustomersView db={db} onUpsertCustomer={upsertCustomer} />
          )}
          {activeTab === 'schema' && <SchemaApiView db={db} apiLogs={apiLogs} />}
        </div>
      </main>
    </div>
  );
}
