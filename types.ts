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

export interface GroceryListInfo {
  id: string;
  name: string;
  date: string; // Stored as 'YYYY-MM-DD'
}

export type PredefinedGroceries = {
    [category: string]: string[];
}