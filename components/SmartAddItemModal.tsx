import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { NewGroceryItem } from '../types';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface SmartAddItemModalProps {
    onClose: () => void;
    onAddItems: (items: NewGroceryItem[]) => void;
    categories: string[];
}

const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

export const SmartAddItemModal: React.FC<SmartAddItemModalProps> = ({ onClose, onAddItems, categories }) => {
    const [view, setView] = useState<'input' | 'confirm'>('input');
    const [inputText, setInputText] = useState('');
    const [parsedItems, setParsedItems] = useState<NewGroceryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleParse = async () => {
        if (!inputText.trim()) {
            setError('Please enter a list of items.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `Parse the following grocery list into a JSON array of objects. Each object should have "name" (string), "quantity" (number), "unit" (string), and "category" (string). Use the following categories: ${categories.join(', ')}. If a category is not obvious, use "Other Tasks". If quantity or unit is not specified, make a reasonable guess (e.g., quantity 1, unit 'pcs'). The item name should be capitalized. Text to parse: \n\n${inputText}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                unit: { type: Type.STRING },
                                category: { type: Type.STRING },
                            },
                            required: ['name', 'quantity', 'unit', 'category'],
                        },
                    },
                },
            });
            
            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText) as NewGroceryItem[];
            
            // Validate that the parsed categories exist in our predefined list.
            const validatedResult = result.map(item => ({
                ...item,
                category: categories.includes(item.category) ? item.category : 'Other Tasks',
            }));

            setParsedItems(validatedResult);
            setView('confirm');
        } catch (err: any) {
            console.error("AI Parsing Error:", err);
            setError(`Failed to parse list. Please check your input or API setup. Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleItemChange = (index: number, field: keyof NewGroceryItem, value: string | number) => {
        const updatedItems = [...parsedItems];
        (updatedItems[index] as any)[field] = value;
        setParsedItems(updatedItems);
    };

    const handleDeleteItem = (index: number) => {
        setParsedItems(parsedItems.filter((_, i) => i !== index));
    };

    const handleConfirmAndAdd = () => {
        onAddItems(parsedItems);
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                {view === 'confirm' && (
                    <button onClick={() => setView('input')} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 z-10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                )}

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Smart Add with AI</h2>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center mb-4">{error}</p>}
                
                {view === 'input' && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-center">
                            Type or paste your grocery list below. The AI will automatically parse it for you.
                        </p>
                        <textarea
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            rows={8}
                            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., 2 liters of milk, a dozen eggs, bread, and pay the electricity bill"
                        />
                        <button onClick={handleParse} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300">
                           {isLoading ? <Spinner /> : 'Parse with AI'}
                        </button>
                    </div>
                )}

                {view === 'confirm' && (
                    <div className="space-y-4">
                        <p className="text-slate-600 text-center">Review the items below and make any changes before adding.</p>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 -mr-2">
                           {parsedItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg">
                                    <input type="text" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} className="col-span-4 p-2 border rounded-md text-sm" />
                                    <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} className="col-span-2 p-2 border rounded-md text-sm" />
                                    <input type="text" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className="col-span-2 p-2 border rounded-md text-sm" />
                                    <select value={item.category} onChange={e => handleItemChange(index, 'category', e.target.value)} className="col-span-3 p-2 border rounded-md text-sm bg-white">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button onClick={() => handleDeleteItem(index)} className="col-span-1 text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5 mx-auto" /></button>
                                </div>
                            ))}
                        </div>
                         <button onClick={handleConfirmAndAdd} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                            {`Add ${parsedItems.length} Item(s) to List`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};