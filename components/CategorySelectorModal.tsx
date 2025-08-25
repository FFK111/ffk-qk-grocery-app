import React from 'react';
import { XIcon } from './icons/XIcon';
import { PREDEFINED_GROCERIES } from '../constants';

interface CategorySelectorModalProps {
    onClose: () => void;
    onSelectCategory: (category: string) => void;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({ onClose, onSelectCategory }) => {
    const categories = Object.keys(PREDEFINED_GROCERIES);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select a Category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => onSelectCategory(category)}
                            className="p-4 bg-slate-100 hover:bg-blue-100 rounded-lg text-slate-700 font-semibold text-center transition-all duration-200 aspect-square flex items-center justify-center text-sm sm:text-base hover:scale-105"
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};