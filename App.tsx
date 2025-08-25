import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserSelector } from './components/UserSelector';
import { GroceryList } from './components/GroceryList';
import { AddItemModal } from './components/AddItemModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { ProgressBar } from './components/ProgressBar';
import { PlusIcon } from './components/icons/PlusIcon';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { User, GroceryItem } from './types';
import { PREDEFINED_GROCERIES } from './constants';
import { listenToItems, addItemToFirestore, updateItemPurchasedStatus } from './firebase';

const USER_STORAGE_KEY = 'faisalGudiyaGroceryUser';

type ModalState = {
  step: 'closed' | 'selectCategory' | 'addItem';
  category?: string;
};

export default function App(): React.ReactNode {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useLocalStorage<User>(USER_STORAGE_KEY, 'Faisal');
  const [modalState, setModalState] = useState<ModalState>({ step: 'closed' });

  useEffect(() => {
    setLoading(true);
    // Subscribe to real-time updates from Firestore
    const unsubscribe = listenToItems((cloudItems) => {
      setItems(cloudItems);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const addItem = async (
    newItem: Omit<GroceryItem, 'id' | 'addedBy' | 'dateAdded' | 'purchased'>
  ) => {
    const newItemWithId: GroceryItem = {
      ...newItem,
      id: `${new Date().getTime()}-${Math.random()}`,
      addedBy: currentUser,
      dateAdded: new Date().toISOString(),
      purchased: false,
    };
    
    // The real-time listener will update the state automatically.
    // This avoids potential race conditions or double-renders.
    try {
      await addItemToFirestore(newItemWithId);
      setModalState({ step: 'closed' });
    } catch (error) {
      console.error("Failed to add item:", error);
      // You could add user-facing error handling here
    }
  };

  const toggleItemPurchased = (itemName: string) => {
    const itemsToUpdate = items.filter(i => i.name === itemName);
    if (itemsToUpdate.length === 0) return;

    // Decide the new state based on the current state of all items with that name
    const areAllCurrentlyPurchased = itemsToUpdate.every(i => i.purchased);
    const newPurchasedStatus = !areAllCurrentlyPurchased;

    // Fire off all the updates to Firestore; the listener will handle the UI change.
    const updatePromises = itemsToUpdate.map(item => 
        updateItemPurchasedStatus(item.id, newPurchasedStatus)
    );

    Promise.all(updatePromises).catch(error => {
        console.error("Failed to update item status:", error);
         // You could add user-facing error handling here
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex flex-col">
      <Header />
       {loading ? (
            <main className="flex-grow container mx-auto p-4 max-w-2xl flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 text-lg font-semibold">Loading your list...</p>
                    <p className="text-slate-400 text-sm mt-2">Syncing with the cloud ✨</p>
                </div>
            </main>
        ) : (
          <main className="flex-grow container mx-auto p-4 max-w-2xl">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <UserSelector currentUser={currentUser} setCurrentUser={setCurrentUser} />
              <ProgressBar progress={progress} />
              <GroceryList categorizedItems={categorizedItems} onToggleItem={toggleItemPurchased} />
            </div>
          </main>
        )}
      <Footer />
      
      <button
        onClick={() => setModalState({ step: 'selectCategory' })}
        className="fixed bottom-5 right-5 h-14 w-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-110 z-50"
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
