
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GroceryList } from './components/GroceryList';
import { AddItemModal } from './components/AddItemModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { ProgressBar } from './components/ProgressBar';
import { PlusIcon } from './components/icons/PlusIcon';
import type { GroceryItem } from './types';
import { PREDEFINED_GROCERIES } from './constants';
import { fetchItems, deleteAllItemsFromFirestore, addItemToFirestore } from './firebase';

type ModalState = {
  step: 'closed' | 'selectCategory' | 'addItem';
  category?: string;
};

export default function App(): React.ReactNode {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isInitialSyncing, setIsInitialSyncing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ step: 'closed' });

  useEffect(() => {
    setIsInitialSyncing(true);
    // Fetch items from Firestore once on initial load
    fetchItems()
      .then((cloudItems) => {
        setItems(cloudItems);
      })
      .catch((error) => {
        console.error("Failed to fetch items:", error);
        alert(`Could not load your list from the cloud. Please check your internet connection.\nError: ${error.message}`);
      })
      .finally(() => {
        setIsInitialSyncing(false);
      });
  }, []);

  const addItem = (
    newItem: Omit<GroceryItem, 'id' | 'dateAdded' | 'purchased'>
  ) => {
    const newItemWithId: GroceryItem = {
      ...newItem,
      id: `${new Date().getTime()}-${Math.random()}`,
      dateAdded: new Date().toISOString(),
      purchased: false,
    };
    // Update local state only
    setItems(prevItems => [...prevItems, newItemWithId]);
    setModalState({ step: 'closed' });
  };

  const toggleItemPurchased = (itemName: string) => {
    const itemsToUpdate = items.filter(i => i.name === itemName);
    if (itemsToUpdate.length === 0) return;

    const areAllCurrentlyPurchased = itemsToUpdate.every(i => i.purchased);
    const newPurchasedStatus = !areAllCurrentlyPurchased;

    // Update local state only
    setItems(currentItems =>
      currentItems.map(item =>
        item.name === itemName
          ? { ...item, purchased: newPurchasedStatus }
          : item
      )
    );
  };

  const handleSaveList = async () => {
    setIsSyncing(true);
    try {
      // Clear the remote list and upload the current local list
      await deleteAllItemsFromFirestore();
      const addPromises = items.map(item => addItemToFirestore(item));
      await Promise.all(addPromises);
      
      alert('List saved successfully!');
    } catch (error: any) {
      console.error("Failed to save list:", error);
      let alertMessage = `Failed to save the list. Please check your connection and Firebase setup.\nError: ${error.message}`;
      if (error?.code === 'permission-denied') {
        alertMessage = 'Error: Permission Denied.\n\nPlease check your Firestore security rules in the Firebase console. They need to allow write operations to the "items" collection for the app to work correctly.';
      }
      alert(alertMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteList = async () => {
    if (window.confirm('Are you sure you want to delete the entire list? This action cannot be undone.')) {
      setIsSyncing(true);
      try {
        await deleteAllItemsFromFirestore();
        setItems([]); // Clear local state
        alert('List deleted successfully!');
      } catch (error: any) {
        console.error("Failed to delete list:", error);
        let alertMessage = `Failed to delete the list. Please check your connection and Firebase setup.\nError: ${error.message}`;
        if (error?.code === 'permission-denied') {
            alertMessage = 'Error: Permission Denied.\n\nPlease check your Firestore security rules in the Firebase console. They need to allow write operations to the "items" collection for the app to work correctly.';
        }
        alert(alertMessage);
      } finally {
        setIsSyncing(false);
      }
    }
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
    <div className="min-h-screen bg-black/10 flex flex-col">
      <Header isSyncing={isInitialSyncing} />
       {isInitialSyncing && items.length === 0 ? (
            <main className="flex-grow container mx-auto p-4 max-w-2xl flex items-center justify-center">
                <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-10">
                    <p className="text-slate-600 text-lg font-semibold">Loading your list...</p>
                    <p className="text-slate-400 text-sm mt-2">Connecting to the cloud ✨</p>
                </div>
            </main>
        ) : (
          <main className="flex-grow container mx-auto p-4 max-w-2xl">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <ProgressBar progress={progress} />
               <div className="flex justify-center gap-4 my-4 border-b border-t border-slate-200 py-4">
                <button 
                    onClick={handleSaveList} 
                    disabled={isSyncing}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-green-300 disabled:cursor-not-allowed shadow-md">
                    {isSyncing ? 'Saving...' : 'Save List'}
                </button>
                <button 
                    onClick={handleDeleteList} 
                    disabled={isSyncing || items.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-red-300 disabled:cursor-not-allowed shadow-md">
                    {isSyncing ? 'Deleting...' : 'Delete List'}
                </button>
            </div>
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