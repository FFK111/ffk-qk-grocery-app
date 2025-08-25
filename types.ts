
export type User = 'Faisal' | 'Gudiya';

export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
  addedBy: User;
  dateAdded: string; // ISO string
}

export interface AppData {
    items: GroceryItem[];
    lastUser: User;
    lastSaved: number; // timestamp
}

export type PredefinedGroceries = {
    [category: string]: string[];
}
