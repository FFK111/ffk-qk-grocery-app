import React, { useState } from 'react';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PencilIcon } from './icons/PencilIcon';

interface FloatingActionButtonsProps {
    onManualAdd: () => void;
    onSmartAdd: () => void;
}

const ActionButton: React.FC<{
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    isOpen: boolean;
    transitionDelay: string;
}> = ({ onClick, label, children, isOpen, transitionDelay }) => (
    <div
        className={`flex items-center justify-end gap-3 transition-all duration-300 ${
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
        }`}
        style={{ transitionDelay: isOpen ? transitionDelay : '0ms' }}
    >
        <span className="bg-white/90 text-slate-700 font-semibold px-3 py-1.5 rounded-lg shadow-md">
            {label}
        </span>
        <button
            onClick={onClick}
            className="h-12 w-12 bg-white/90 text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 transition-transform transform hover:scale-110"
            aria-label={label}
        >
            {children}
        </button>
    </div>
);

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ onManualAdd, onSmartAdd }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
            <div className="flex flex-col items-end gap-3">
                <ActionButton
                    onClick={() => { onSmartAdd(); setIsOpen(false); }}
                    label="Smart Add (AI)"
                    isOpen={isOpen}
                    transitionDelay="100ms"
                >
                    <SparklesIcon className="w-6 h-6" />
                </ActionButton>
                <ActionButton
                    onClick={() => { onManualAdd(); setIsOpen(false); }}
                    label="Manual Add"
                    isOpen={isOpen}
                    transitionDelay="50ms"
                >
                    <PencilIcon className="w-6 h-6" />
                </ActionButton>
            </div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="h-16 w-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-110"
                aria-label={isOpen ? "Close add options" : "Open add options"}
                aria-expanded={isOpen}
            >
                <div className="transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>
                   <PlusIcon className="w-8 h-8"/>
                </div>
            </button>
        </div>
    );
};
