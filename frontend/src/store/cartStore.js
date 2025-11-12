import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  
  addItem: (product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.product.id === product.id
      );
      
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      
      return {
        items: [...state.items, { product, quantity }],
      };
    });
  },
  
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },
  
  clearCart: () => {
    set({ items: [] });
  },
  
  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  
  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },
  
  getItemsByBusiness: () => {
    const items = get().items;
    const grouped = {};
    
    items.forEach((item) => {
      const businessId = item.product.businessId;
      if (!grouped[businessId]) {
        grouped[businessId] = {
          businessId,
          businessName: item.product.businessName,
          items: [],
        };
      }
      grouped[businessId].items.push(item);
    });
    
    return Object.values(grouped);
  },
}));

export default useCartStore;
