import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import React, { useState, useMemo } from 'react';
import type { GroceryItem, PredefinedGroceries } from '../types';
import { XIcon } from './icons/XIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface AddItemModalProps {
    onClose: () => void;
    onAddItem: (item: Omit<GroceryItem, 'id' | 'addedBy' | 'dateAdded' | 'purchased'>) => void;
    category: string;
    predefinedGroceries: PredefinedGroceries;
    onGoBack: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onAddItem, category, predefinedGroceries, onGoBack }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('kg');

    const isTask = useMemo(() => category === 'Other Tasks', [category]);
    const itemsForCategory = useMemo(() => predefinedGroceries[category] || [], [predefinedGroceries, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddItem({ 
                name: name.trim(), 
                quantity: isTask ? 1 : quantity, 
                unit: isTask ? '' : unit.trim(), 
                category: category 
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                <button onClick={onGoBack} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 z-10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Add New Item</h2>
                    <p className="text-sm font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full mb-6 inline-block">
                        {category}
                    </p>
                </div>
                
                {itemsForCategory.length > 0 && !isTask && (
                     <div className="mb-4">
                        <p className="block text-sm font-medium text-slate-700 mb-2">Quick Add</p>
                        <div className="flex flex-wrap gap-2">
                           {itemsForCategory.map(item => (
                               <button
                                   key={item}
                                   type="button"
                                   onClick={async () => {
  setName(item);

  if (!itemQuantity || !itemUnit || !selectedCategory || !selectedUser) {
    console.log("Missing fields — not saving");
    return;
  }

  await addDoc(collection(db, 'groceryItems'), {
    name: item,
    quantity: itemQuantity,
    unit: itemUnit,
    category: selectedCategory,
    user: selectedUser,
    dateAdded: Timestamp.now()
  });

  console.log("Item saved to Firestore:", item);
}}

                                   className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                       name === item
                                           ? 'bg-blue-600 text-white'
                                           : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                   }`}
                               >
                                   {item}
                               </button>
                           ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="item-name" className="block text-sm font-medium text-slate-700">{isTask ? 'Task Name' : 'Item Name'}</label>
                        <input
                            type="text"
                            id="item-name"
                            list="predefined-items-for-category"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder={isTask ? 'e.g., Pay Bills' : 'Type or select an item'}
                            required
                        />
                        <datalist id="predefined-items-for-category">
                            {itemsForCategory.map(item => <option key={item} value={item} />)}
                        </datalist>
                    </div>

                    {!isTask && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Quantity</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(0.1, Number(e.target.value)))}
                                    min="0.1"
                                    step="0.1"
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-slate-700">Unit</label>
                                <input
                                    type="text"
                                    id="unit"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    list="common-units"
                                    required
                                />
                                <datalist id="common-units">
                                    <option value="kg" />
                                    <option value="g" />
                                    <option value="L" />
                                    <option value="ml" />
                                    <option value="pcs" />
                                    <option value="dozen" />
                                    <option value="pack" />
                                </datalist>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                            Add to List
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};