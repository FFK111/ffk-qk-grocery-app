
import React, { useState, useEffect, useMemo } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface AggregatedItem {
    name: string;
    totalQuantity: number;
    unit: string;
    purchased: boolean;
    category: string;
}

interface GroceryListProps {
    categorizedItems: [string, AggregatedItem[]][];
    onToggleItem: (itemName: string) => void;
}

const GroceryListItem: React.FC<{ item: AggregatedItem; onToggleItem: (itemName: string) => void }> = ({ item, onToggleItem }) => {
    const isTask = item.category === 'Other Tasks';
    
    return (
        <li
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ease-in-out ${
                item.purchased ? 'bg-green-100/70 text-gray-500' : 'bg-white'
            }`}
        >
            <div className="flex items-center min-w-0">
                <button
                    onClick={() => onToggleItem(item.name)}
                    className={`w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 mr-4 ${
                        item.purchased
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 bg-slate-50 hover:border-blue-500'
                    }`}
                    aria-label={`Mark ${item.name} as ${item.purchased ? 'not purchased' : 'purchased'}`}
                >
                    {item.purchased && <CheckIcon className="w-4 h-4 text-white" />}
                </button>
                <span className={`font-medium truncate ${item.purchased ? 'line-through' : ''}`}>
                    {item.name}
                </span>
            </div>
            {!isTask && (
                 <span className="text-sm flex-shrink-0 font-semibold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full ml-2">
                    {item.totalQuantity} {item.unit}
                </span>
            )}
        </li>
    );
};

export const GroceryList: React.FC<GroceryListProps> = ({ categorizedItems, onToggleItem }) => {
    const categoryNames = useMemo(() => categorizedItems.map(([name]) => name), [categorizedItems]);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
        categoryNames.reduce((acc, name) => ({ ...acc, [name]: true }), {})
    );

    useEffect(() => {
        setOpenCategories(prevOpen => {
            const newOpen = { ...prevOpen };
            for (const name of categoryNames) {
                if (!(name in newOpen)) {
                    newOpen[name] = true; // Default new categories to open
                }
            }
            return newOpen;
        });
    }, [categoryNames]);

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({...prev, [category]: !prev[category]}));
    };


    if (categorizedItems.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-slate-50/50 rounded-lg flex flex-col items-center justify-center">
                <svg className="w-24 h-24 text-slate-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-700">Your list is ready for action!</h3>
                <p className="text-slate-500 text-base mt-2 max-w-xs mx-auto">
                    Tap the big blue '+' button at the bottom right to start adding groceries and tasks.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {categorizedItems.map(([category, items]) => (
                <div key={category} className="bg-slate-100/50 rounded-xl overflow-hidden shadow-sm">
                    <button 
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center p-3 bg-white/50 hover:bg-slate-200/50 transition-colors"
                        aria-expanded={openCategories[category]}
                        aria-controls={`category-panel-${category}`}
                    >
                        <h2 className="text-xl font-bold text-slate-700">{category}</h2>
                        <ChevronDownIcon className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${openCategories[category] ? 'rotate-180' : ''}`} />
                    </button>
                    {openCategories[category] && (
                        <ul className="space-y-2 p-3" id={`category-panel-${category}`}>
                            {items.map(item => (
                                <GroceryListItem key={item.name} item={item} onToggleItem={onToggleItem} />
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
};