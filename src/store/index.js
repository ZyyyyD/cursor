import { create } from 'zustand';

// Helper to calculate item status
const calculateStatus = (qty, min) => {
  if (qty === 0) return 'danger';
  if (qty < min) return 'warning';
  return 'success';
};

// Inventory Store - starts empty, user adds items
export const useInventoryStore = create((set, get) => ({
  items: [],
  
  getItem: (id) => get().items.find(item => item.id === id),
  
  getItemByBarcode: (barcode) => get().items.find(item => item.barcode === barcode),
  
  getItemBySku: (sku) => get().items.find(item => item.sku?.toLowerCase() === sku?.toLowerCase()),
  
  addItem: (item) => set((state) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      qty: item.qty || 0,
      min: item.min || 0,
      price: item.price || 0,
      cost: item.cost || 0,
      status: calculateStatus(item.qty || 0, item.min || 0),
      createdAt: new Date().toISOString(),
    };
    return { items: [...state.items, newItem] };
  }),
  
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        updated.status = calculateStatus(updated.qty, updated.min);
        return updated;
      }
      return item;
    })
  })),
  
  adjustStock: (id, quantity, type) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        const newQty = type === 'in' ? item.qty + quantity : item.qty - quantity;
        const finalQty = Math.max(0, newQty);
        return { 
          ...item, 
          qty: finalQty, 
          status: calculateStatus(finalQty, item.min) 
        };
      }
      return item;
    })
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  // Get stats
  getTotalItems: () => get().items.length,
  getTotalStock: () => get().items.reduce((sum, item) => sum + item.qty, 0),
  getTotalValue: () => get().items.reduce((sum, item) => sum + (item.qty * item.price), 0),
  getTotalCost: () => get().items.reduce((sum, item) => sum + (item.qty * item.cost), 0),
  getLowStockItems: () => get().items.filter(item => item.status === 'warning'),
  getOutOfStockItems: () => get().items.filter(item => item.status === 'danger'),
  getCategories: () => [...new Set(get().items.map(item => item.category).filter(Boolean))],
  getByCategory: (category) => get().items.filter(item => item.category === category),
}));

// Cart Store (POS) - always starts empty
export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  
  addToCart: (product) => set((state) => {
    const existing = state.items.find(item => item.id === product.id);
    if (existing) {
      return {
        items: state.items.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      };
    }
    return { items: [...state.items, { ...product, qty: 1 }] };
  }),
  
  removeFromCart: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  updateQuantity: (id, qty) => set((state) => ({
    items: qty <= 0 
      ? state.items.filter(item => item.id !== id)
      : state.items.map(item => item.id === id ? { ...item, qty } : item)
  })),
  
  setCustomer: (customer) => set({ customer }),
  setDiscount: (discount) => set({ discount }),
  
  clearCart: () => set({ items: [], customer: null, discount: 0 }),
  
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.qty * item.price, 0),
  getTax: () => get().getSubtotal() * 0.1,
  getDiscountAmount: () => get().getSubtotal() * (get().discount / 100),
  getTotal: () => get().getSubtotal() + get().getTax() - get().getDiscountAmount(),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.qty, 0),
}));

// Orders Store - starts empty
export const useOrdersStore = create((set, get) => ({
  orders: [],
  nextOrderNumber: 1001,
  
  addOrder: (order) => set((state) => ({
    orders: [{ 
      ...order, 
      id: `PO-${state.nextOrderNumber}`,
      createdAt: new Date().toISOString(),
    }, ...state.orders],
    nextOrderNumber: state.nextOrderNumber + 1,
  })),
  
  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(order =>
      order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order
    )
  })),
  
  getOrderById: (id) => get().orders.find(o => o.id === id),
  getPendingOrders: () => get().orders.filter(o => o.status !== 'success'),
  getReceivedOrders: () => get().orders.filter(o => o.status === 'success'),
  getTotalOrderValue: () => get().orders.reduce((sum, o) => sum + o.total, 0),
}));

// Sales/Transactions Store - starts empty
export const useSalesStore = create((set, get) => ({
  transactions: [],
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [
      { 
        ...transaction, 
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
      },
      ...state.transactions
    ]
  })),
  
  getTodaySales: () => {
    const today = new Date().toDateString();
    return get().transactions
      .filter(t => new Date(t.date).toDateString() === today)
      .reduce((sum, t) => sum + t.total, 0);
  },
  
  getTodayTransactions: () => {
    const today = new Date().toDateString();
    return get().transactions.filter(t => new Date(t.date).toDateString() === today);
  },
  
  getTotalSales: () => get().transactions.reduce((sum, t) => sum + t.total, 0),
  getTotalProfit: () => get().transactions.reduce((sum, t) => sum + (t.total - (t.cost || 0)), 0),
  getTransactionCount: () => get().transactions.length,
  
  getSalesByCategory: () => {
    const sales = {};
    get().transactions.forEach(t => {
      t.items?.forEach(item => {
        const cat = item.category || 'Other';
        sales[cat] = (sales[cat] || 0) + (item.qty * item.price);
      });
    });
    return sales;
  },
}));

// Alerts Store - starts empty, auto-generated from inventory
export const useAlertsStore = create((set, get) => ({
  alerts: [],
  
  addAlert: (alert) => set((state) => ({
    alerts: [{ ...alert, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() }, ...state.alerts]
  })),
  
  markAsRead: (id) => set((state) => ({
    alerts: state.alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    )
  })),
  
  clearAlerts: () => set({ alerts: [] }),
  
  getUnreadCount: () => get().alerts.filter(a => !a.read).length,
}));

// Scan History Store
export const useScanStore = create((set, get) => ({
  lastScanned: null,
  history: [],
  
  setLastScanned: (item) => set((state) => ({
    lastScanned: item,
    history: item ? [{ ...item, scannedAt: new Date().toISOString() }, ...state.history.slice(0, 49)] : state.history
  })),
  
  clearHistory: () => set({ history: [], lastScanned: null }),
}));

// Suppliers Store - starts empty
export const useSuppliersStore = create((set, get) => ({
  suppliers: [],
  
  addSupplier: (supplier) => set((state) => ({
    suppliers: [...state.suppliers, { ...supplier, id: Date.now().toString() }]
  })),
  
  updateSupplier: (id, updates) => set((state) => ({
    suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  deleteSupplier: (id) => set((state) => ({
    suppliers: state.suppliers.filter(s => s.id !== id)
  })),
}));

// Categories Store - starts empty
export const useCategoriesStore = create((set, get) => ({
  categories: [],
  
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, { ...category, id: Date.now().toString() }]
  })),
  
  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id)
  })),
}));
