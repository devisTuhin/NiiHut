import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartState {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
