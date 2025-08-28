export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
  dateAdded: string; // ISO string
  addedBy?: string;
}

export type PredefinedGroceries = {
    [category: string]: string[];
}

// FIX: Exported User type to resolve missing export error in components/UserSelector.tsx
export type User = string;