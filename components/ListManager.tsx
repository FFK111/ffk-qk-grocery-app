import React, { useState } from 'react';

interface ListManagerProps {
    onListSelected: (listId: string) => void;
}

const ADJECTIVES = ['Sunny', 'Happy', 'Lucky', 'Brave', 'Clever', 'Golden', 'Vivid', 'Silent', 'Witty', 'Cosmic'];
const NOUNS = ['River', 'Mountain', 'Meadow', 'Star', 'Ocean', 'Forest', 'Valley', 'Pond', 'Desert', 'Planet'];

const generateListId = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${adj.toLowerCase()}-${noun.toLowerCase()}-${num}`;
}

export const ListManager: React.FC<ListManagerProps> = ({ onListSelected }) => {
    const [joinInput, setJoinInput] = useState('');

    const handleCreateList = () => {
        const newListId = generateListId();
        alert(`Your new List ID is: ${newListId}\n\nShare this ID with others so they can join your list!`);
        onListSelected(newListId);
    };

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinInput.trim()) {
            onListSelected(joinInput.trim());
        } else {
            alert('Please enter a valid List ID.');
        }
    };

    return (
        <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Welcome to Grocery Hub & Notes
                </h1>
                <p className="text-slate-200 mt-2 font-semibold">Your shared grocery & notes list.</p>
            </div>
            <div className="w-full max-w-sm bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Create a New List</h2>
                    <button
                        onClick={handleCreateList}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md"
                    >
                        Create & Start
                    </button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white/50 px-2 text-slate-500 font-medium">OR</span>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Join an Existing List</h2>
                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="list-id" className="sr-only">List ID</label>
                            <input
                                type="text"
                                id="list-id"
                                value={joinInput}
                                onChange={(e) => setJoinInput(e.target.value)}
                                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center"
                                placeholder="Enter List ID (e.g., happy-river-123)"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md"
                        >
                            Join List
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};