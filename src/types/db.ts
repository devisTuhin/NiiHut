export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = 
  | 'pending' 
  | 'pending_confirmation' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  inventory: number;
  is_active: boolean;
  category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  display_order: number;
  created_at: string;
}

export interface ProductCategory {
  product_id: string;
  category_id: string;
}

export interface Cart {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  total_amount: number;
  status: OrderStatus;
  stripe_payment_intent_id?: string | null;
  shipping_address?: Json | null;
  phone_number?: string | null;
  delivery_fee?: number | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  provider: string;
  transaction_id?: string | null;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  changed_by?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface BlockedPhone {
  phone_number: string;
  reason?: string | null;
  created_at: string;
  blocked_by?: string | null;
}
