import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UserSelector } from './components/UserSelector';
import { GroceryList } from './components/GroceryList';
import { AddItemModal } from './components/AddItemModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { ProgressBar } from './components/ProgressBar';
import { PlusIcon } from './components/icons/PlusIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { User, GroceryItem, AppData } from './types';
import { PREDEFINED_GROCERIES } from './constants';
import { fetchItems } from './firebase';

const APP_STORAGE_KEY = 'faisalGudiyaGroceryData';

type ModalState = {
  step: 'closed' | 'selectCategory' | 'addItem';
  category?: string;
};

export default function App(): React.ReactNode {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [storedData, setStoredData] = useLocalStorage<AppData | null>(APP_STORAGE_KEY, null);
  const [currentUser, setCurrentUser] = useState<User>('Faisal');
  const [modalState, setModalState] = useState<ModalState>({ step: 'closed' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    const loadData = async () => {
      const cloudItems = await fetchItems();
      if (cloudItems.length > 0) {
        setItems(cloudItems);
      } else if (storedData) {
        const oneMonthAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        if (storedData.lastSaved > oneMonthAgo) {
          setItems(storedData.items);
          setCurrentUser(storedData.lastUser || 'Faisal');
        } else {
          setStoredData(null);
        }
      }
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    const dataToSave: AppData = {
      items,
      lastUser: currentUser,
      lastSaved: new Date().getTime(),
    };
    setStoredData(dataToSave);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }, 500);
  }, [items, currentUser, setStoredData, saveStatus]);

  const addItem = (newItem: Omit<GroceryItem, 'id' | 'addedBy' | 'dateAdded' | 'purchased'>) => {
    setItems(prevItems => [
      ...prevItems,
      {
        ...newItem,
        id: `${new Date().getTime()}-${Math.random()}`,
        addedBy: currentUser,
        dateAdded: new Date().toISOString(),
        purchased: false,
      },
    ]);
    setModalState({ step: 'closed' });
  };

  const toggleItemPurchased = (itemName: string) => {
    setItems(prevItems => {
      const areAllPurchased = prevItems.filter(i => i.name === itemName).every(i => i.purchased);
      return prevItems.map(item =>
        item.name === itemName ? { ...item, purchased: !areAllPurchased } : item
      );
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
      <main className="flex-grow container mx-auto p-4 max-w-2xl">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <UserSelector currentUser={currentUser} setCurrentUser={setCurrentUser} />
          <ProgressBar progress={progress} />
          <GroceryList categorizedItems={categorizedItems} onToggleItem={toggleItemPurchased} />
        </div>
      </main>
      <Footer />
      <button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="fixed bottom-20 right-5 h-14 w-auto px-5 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 ease-in-out z-50 flex items-center justify-center space-x-2 disabled:opacity-75"
      >
        {saveStatus === 'idle' && <span>Save List</span>}
        {saveStatus === 'saving' && <span>Saving...</span>}
        {saveStatus === 'saved' && (
          <>
            <CheckIcon className="w-5 h-5" /> <span>Saved!</span>
          </>
        )}
      </button>
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
