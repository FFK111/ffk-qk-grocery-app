import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GroceryList } from './components/GroceryList';
import { AddItemModal } from './components/AddItemModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { ProgressBar } from './components/ProgressBar';
import { PlusIcon } from './components/icons/PlusIcon';
import type { GroceryItem, NewGroceryItem } from './types';
import { PREDEFINED_GROCERIES } from './constants';
import {
  subscribeToItems,
  addItemToFirestore,
  togglePurchasedByName,
  deleteItemsByName,
  deletePurchasedItems,
} from './firebase';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ListManager } from './components/ListManager';
import { useEffect, useMemo } from 'react';

type ModalState = {
  step: 'closed' | 'selectCategory' | 'addItem';
  category?: string;
};

export default function App(): React.ReactNode {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [modalState, setModalState] = useState<ModalState>({ step: 'closed' });
  const [currentListId, setCurrentListId] = useLocalStorage<string | null>('currentListId', null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    if (!currentListId) return;

    setIsInitialSyncing(true);
    const unsubscribe = subscribeToItems(currentListId, (cloudItems) => {
        setItems(cloudItems);
        setIsInitialSyncing(false);
    }, (error) => {
        console.error("Failed to subscribe to items:", error);
        alert(`Could not load your list. Please check your internet connection.\nError: ${error.message}`);
        setIsInitialSyncing(false);
    });

    return () => unsubscribe();
  }, [currentListId]);

  const addItem = async (newItem: NewGroceryItem) => {
    if (!currentListId) return;
    const newItemWithId: GroceryItem = {
      ...newItem,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`,
      dateAdded: new Date().toISOString(),
      purchased: false,
    };
    try {
        await addItemToFirestore(newItemWithId, currentListId);
        setModalState({ step: 'closed' });
    } catch (error) {
        console.error("Failed to add item:", error);
        alert("Could not add the item. Please check your connection.");
    }
  };

  const toggleItemPurchased = async (itemName: string) => {
    if (!currentListId) return;
    const itemsToUpdate = items.filter(i => i.name === itemName);
    if (itemsToUpdate.length === 0) return;

    const areAllCurrentlyPurchased = itemsToUpdate.every(i => i.purchased);
    const newPurchasedStatus = !areAllCurrentlyPurchased;

    try {
        if (navigator.vibrate) navigator.vibrate(50);
        await togglePurchasedByName(currentListId, itemName, newPurchasedStatus);
    } catch (error) {
        console.error("Error updating item status:", error);
        alert("Could not update item status. Please check your connection.");
    }
  };
  
  const handleDeleteItem = async (itemName: string) => {
     if (!currentListId) return;
     if (window.confirm(`Are you sure you want to delete all "${itemName}" items from the list?`)) {
        try {
            await deleteItemsByName(currentListId, itemName);
        } catch (error) {
             console.error("Error deleting item:", error);
             alert("Could not delete item. Please check your connection.");
        }
     }
  }

  const handleClearCompleted = async () => {
    if (!currentListId) return;
    const purchasedCount = items.filter(i => i.purchased).length;
    if (purchasedCount === 0) {
        alert("There are no completed items to clear.");
        return;
    }
    if (window.confirm(`Are you sure you want to remove all ${purchasedCount} completed items from the list?`)) {
      try {
        await deletePurchasedItems(currentListId);
      } catch (error: any) {
        console.error("Failed to clear completed items:", error);
        alert(`Failed to clear completed items. Error: ${error.message}`);
      }
    }
  };
  
  const handleSwitchList = () => {
    setCurrentListId(null);
    setItems([]); // Clear items from previous list
  };

  const aggregatedItems = useMemo(() => {
    const grouped: {
      [key: string]: {
        totalQuantity: number;
        unit: string;
        purchased: boolean;
        category: string;
      };
    } = {};

    items.forEach(item => {
      if (!grouped[item.name]) {
        grouped[item.name] = {
          totalQuantity: 0,
          unit: item.unit,
          purchased: true,
          category: item.category,
        };
      }
      grouped[item.name].totalQuantity += item.quantity;
      if (!item.purchased) {
        grouped[item.name].purchased = false;
      }
    });

    return Object.entries(grouped).map(([name, data]) => ({ name, ...data }));
  }, [items]);

  const categorizedItems = useMemo(() => {
    const categories: { [key: string]: typeof aggregatedItems } = {};
    aggregatedItems.forEach(item => {
      const category = item.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(item);
    });
    return Object.entries(categories).sort(([a], [b]) => a.localeCompare(b));
  }, [aggregatedItems]);

  const progress = useMemo(() => {
    const total = aggregatedItems.length;
    if (total === 0) return 0;
    const purchased = aggregatedItems.filter(item => item.purchased).length;
    return (purchased / total) * 100;
  }, [aggregatedItems]);

  if (!currentListId) {
    return <ListManager 
      onListSelected={setCurrentListId} 
      isAdmin={isAdminLoggedIn}
      onAdminLoginSuccess={() => setIsAdminLoggedIn(true)}
      onAdminLogout={() => setIsAdminLoggedIn(false)}
    />;
  }

  return (
    <div className="min-h-screen bg-black/10 flex flex-col">
      <Header listId={currentListId} onSwitchList={handleSwitchList} />
       {isInitialSyncing ? (
            <main className="flex-grow container mx-auto p-4 max-w-2xl flex items-center justify-center">
                <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-10">
                    <p className="text-slate-600 text-lg font-semibold">Connecting to list: {currentListId}...</p>
                    <p className="text-slate-400 text-sm mt-4 animate-pulse">Syncing from the cloud ✨</p>
                </div>
            </main>
        ) : (
          <main className="flex-grow container mx-auto p-4 max-w-2xl overflow-y-auto">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <ProgressBar progress={progress} />
               <div className="flex justify-center gap-4 my-4 border-b border-t border-slate-200 py-4">
                <button 
                    onClick={handleClearCompleted} 
                    disabled={items.filter(i => i.purchased).length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed shadow-md">
                    Clear Completed
                </button>
            </div>
              <GroceryList categorizedItems={categorizedItems} onToggleItem={toggleItemPurchased} onDeleteItem={handleDeleteItem} />
            </div>
          </main>
        )}
      <Footer />
      
      <button
        onClick={() => setModalState({ step: 'selectCategory' })}
        className="fixed bottom-5 right-5 h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-110 z-50"
        aria-label="Add new item"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

      {modalState.step === 'selectCategory' && (
        <CategorySelectorModal
          onClose={() => setModalState({ step: 'closed' })}
          onSelectCategory={category => setModalState({ step: 'addItem', category })}
        />
      )}

      {modalState.step === 'addItem' && modalState.category && (
        <AddItemModal
          onClose={() => setModalState({ step: 'closed' })}
          onAddItem={addItem}
          category={modalState.category}
          predefinedGroceries={PREDEFINED_GROCERIES}
          onGoBack={() => setModalState({ step: 'selectCategory' })}
        />
      )}
    </div>
  );
}