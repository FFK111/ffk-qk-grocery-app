
import React from 'react';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SmartShopperModalProps {
    isOpen: boolean;
    onClose: () => void;
    tips: string;
    isLoading: boolean;
    error: string | null;
    advisorMode: 'live' | 'demo';
}

const formatTips = (text: string): string => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    let html = '';
    let inList = false;

    lines.forEach(line => {
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
        
        const isListItem = line.startsWith('* ') || line.startsWith('- ') || /^\d+\.\s/.test(line);

        if (isListItem && !inList) {
            html += '<ul class="space-y-2">';
            inList = true;
        } else if (!isListItem && inList) {
            html += '</ul>';
            inList = false;
        }

        if (line.startsWith('### ')) {
            html += `<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">${line.substring(4)}</h3>`;
        } else if (line.startsWith('## ')) {
            html += `<h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">${line.substring(3)}</h2>`;
        } else if (line.startsWith('# ')) {
            html += `<h1 class="text-2xl font-extrabold text-slate-800 mt-4 mb-2">${line.substring(2)}</h1>`;
        } else if (isListItem) {
            const content = line.replace(/^(\* |-\s|\d+\.\s)/, '');
            html += `<li class="flex items-start"><span class="text-green-500 mr-2 mt-1 shrink-0">▸</span><span>${content}</span></li>`;
        } else {
            html += `<p class="text-slate-600 mb-3">${line}</p>`;
        }
    });

    if (inList) {
        html += '</ul>';
    }

    return html;
};

const demoTips = `
## Demo Mode: Example Health Tips

### Milk
*   **Key Health Benefits**: Excellent source of calcium and Vitamin D, crucial for strong bones and teeth. Also provides high-quality protein for muscle repair.
*   **Consumption Tips & Precautions**: Choose whole milk for children under 2. Adults may prefer low-fat options. If lactose intolerant, consider lactose-free or fortified plant-based alternatives.
*   **Optimal Consumption Time**: Great in the morning with cereal or as a post-workout recovery drink.

### Chicken
*   **Key Health Benefits**: A fantastic source of lean protein, which is essential for muscle growth and maintenance. It also contains important nutrients like niacin and selenium.
*   **Consumption Tips & Precautions**: Always cook chicken thoroughly to an internal temperature of 165°F (74°C) to avoid foodborne illness. Grilling or baking is healthier than frying.
*   **Optimal Consumption Time**: Ideal for lunch or dinner as it's filling and helps stabilize blood sugar levels.
`;


export const SmartShopperModal: React.FC<SmartShopperModalProps> = ({ isOpen, onClose, tips, isLoading, error, advisorMode }) => {
    if (!isOpen) return null;

    const renderContent = () => {
        if (advisorMode === 'demo') {
            return (
                <>
                    <div className="text-center p-4 mb-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                        <p className="font-bold">You are in Demo Mode</p>
                        <p className="text-sm">To get personalized tips for your list, please configure the API Key in the application's environment. Showing example tips below.</p>
                    </div>
                    <div className="p-1" dangerouslySetInnerHTML={{ __html: formatTips(demoTips) }} />
                </>
            );
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 font-semibold text-lg">Generating health tips...</p>
                    <p className="text-slate-400 text-sm mt-2">Please wait a moment while AI analyzes your list.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                    <p className="font-bold">Oops! Something went wrong.</p>
                    <p className="text-sm">{error}</p>
                </div>
            );
        }

        return <div className="p-1" dangerouslySetInnerHTML={{ __html: formatTips(tips) }} />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10" aria-label="Close health tips modal">
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="text-center mb-4 flex-shrink-0">
                     <div className="inline-flex items-center justify-center bg-green-100 rounded-full p-3 mb-3">
                        <SparklesIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Health & Wellness Tips</h2>
                    <p className="text-sm text-slate-500">AI-powered insights for your grocery list</p>
                </div>
                
                <div className="overflow-y-auto pr-2 flex-grow text-left">
                   {renderContent()}
                </div>
            </div>
        </div>
    );
};
