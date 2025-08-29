export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
  dateAdded: string; // ISO string
}

export type NewGroceryItem = Omit<GroceryItem, 'id' | 'dateAdded' | 'purchased'>;

export interface UserProfile {
  name: string;
  pinHash: string;
  isAdmin: boolean;
}

export type PredefinedGroceries = {
    [category: string]: string[];
}