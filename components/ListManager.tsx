import React, { useState, useEffect } from 'react';
import { 
    getPublicLists, 
    createList, 
    verifyListPin, 
    deleteList, 
    checkAdminExists, 
    createAdmin, 
    verifyAdminLogin 
} from '../firebase';
import type { GroceryListInfo } from '../types';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ListManagerProps {
    onListSelected: (listId: string) => void;
    isAdmin: boolean;
    onAdminLoginSuccess: () => void;
    onAdminLogout: () => void;
}

export const ListManager: React.FC<ListManagerProps> = ({ onListSelected, isAdmin, onAdminLoginSuccess, onAdminLogout }) => {
    const [lists, setLists] = useState<GroceryListInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isPinModalOpen, setPinModalOpen] = useState(false);
    const [isAdminModalOpen, setAdminModalOpen] = useState(false);
    
    const [listToJoin, setListToJoin] = useState<GroceryListInfo | null>(null);

    // Form inputs
    const [newListName, setNewListName] = useState('');
    const [newListPin, setNewListPin] = useState('');
    const [newListDate, setNewListDate] = useState(new Date().toISOString().split('T')[0]);
    const [pinInput, setPinInput] = useState('');
    
    // Admin form inputs
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassInput, setAdminPassInput] = useState('');
    const [adminExists, setAdminExists] = useState(true);

    const fetchLists = () => {
        setIsLoading(true);
        getPublicLists()
            .then(fetchedLists => {
                // Sort by date, newest first
                fetchedLists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setLists(fetchedLists);
            })
            .catch(err => setError("Could not load public lists."))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchLists();
        checkAdminExists().then(setAdminExists);
    }, []);

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newListName.trim() || !newListPin.trim() || !newListDate) {
            setError('All fields are required.');
            return;
        }
        if (newListPin.length !== 4) {
            setError('PIN must be exactly 4 digits.');
            return;
        }

        setIsLoading(true);
        try {
            const newListId = await createList(newListName, newListPin, newListDate);
            setCreateModalOpen(false);
            onListSelected(newListId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleJoinList = (list: GroceryListInfo) => {
        setListToJoin(list);
        setPinModalOpen(true);
        setError('');
        setPinInput('');
    };

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!listToJoin || !pinInput) return;
        setIsLoading(true);
        setError('');
        try {
            const isCorrect = await verifyListPin(listToJoin.id, pinInput);
            if (isCorrect) {
                setPinModalOpen(false);
                onListSelected(listToJoin.id);
            } else {
                setError('Incorrect PIN. Please try again.');
                setPinInput('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (adminExists) {
                const isLoggedIn = await verifyAdminLogin(adminUsername, adminPassInput);
                if (isLoggedIn) {
                    onAdminLoginSuccess();
                    setAdminModalOpen(false);
                } else {
                    setError("Incorrect username or password.");
                }
            } else {
                if (adminUsername.trim().length < 4 || adminPassInput.length < 6) {
                    setError("Username must be at least 4 characters and password at least 6.");
                    setIsLoading(false);
                    return;
                }
                await createAdmin(adminUsername, adminPassInput);
                setAdminExists(true);
                onAdminLoginSuccess();
                setAdminModalOpen(false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteList = async (listId: string) => {
        if (window.confirm(`Are you sure you want to permanently delete the list "${listId}"? This cannot be undone.`)) {
            try {
                await deleteList(listId);
                fetchLists(); // Refresh the list after deletion
            } catch (err) {
                alert("Failed to delete list.");
            }
        }
    };

    const openAdminModal = () => {
        setError('');
        setAdminUsername('');
        setAdminPassInput('');
        setAdminModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Welcome to Grocery Hub & Notes
                </h1>
                <p className="text-slate-200 mt-2 font-semibold">Create, join, and manage your shared lists.</p>
            </div>
            <div className="w-full max-w-md bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Available Lists</h2>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Create New List
                    </button>
                </div>

                {isLoading && <p className="text-center text-slate-600">Loading lists...</p>}
                
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                    {!isLoading && lists.length === 0 && (
                        <p className="text-center text-slate-500 py-8">No lists found. Be the first to create one!</p>
                    )}
                    {lists.map(list => (
                        <div key={list.id} className="flex items-center gap-2 group">
                             <button
                                onClick={() => handleJoinList(list)}
                                className="flex-1 text-left bg-white/80 p-3 rounded-lg hover:bg-blue-100 transition-colors shadow-sm w-full"
                            >
                                <p className="font-bold text-slate-800 capitalize">{list.name}</p>
                                <p className="text-sm text-slate-500">Date: {new Date(list.date + 'T00:00:00').toLocaleDateString()}</p>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteList(list.id)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-full transition-opacity"
                                    aria-label={`Delete list ${list.name}`}
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="text-center mt-6">
                    {isAdmin ? (
                         <button onClick={onAdminLogout} className="text-sm text-red-600 hover:underline">Logout Admin</button>
                    ) : (
                         <button onClick={openAdminModal} className="text-sm text-slate-600 hover:underline">Admin Login</button>
                    )}
                </div>
            </div>

            {/* Create List Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Create New List</h2>
                        <form onSubmit={handleCreateList} className="space-y-4">
                            <input type="text" value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="List Name" required className="w-full p-2 border rounded"/>
                            <input type="password" value={newListPin} onChange={e => setNewListPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="4-Digit PIN" maxLength={4} minLength={4} inputMode="numeric" required className="w-full p-2 border rounded"/>
                            <input type="date" value={newListDate} onChange={e => setNewListDate(e.target.value)} required className="w-full p-2 border rounded"/>
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                                {isLoading ? 'Creating...' : 'Create List'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PIN Entry Modal */}
            {isPinModalOpen && listToJoin && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setPinModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center capitalize">{listToJoin.name}</h2>
                        <p className="text-center text-slate-500 mb-4">Enter 4-Digit PIN to join</p>
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} placeholder="••••" maxLength={4} minLength={4} inputMode="numeric" required autoFocus className="w-full p-3 border rounded text-center tracking-[1em]"/>
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:bg-green-300">
                                {isLoading ? 'Verifying...' : 'Join List'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Admin Login Modal */}
            {isAdminModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setAdminModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
                            {adminExists ? 'Admin Login' : 'Create Admin Account'}
                        </h2>
                        {!adminExists && <p className="text-sm text-center text-slate-500 mb-4">Set up the single administrator account for this app.</p>}
                        <form onSubmit={handleAdminSubmit} className="space-y-4">
                            <input type="text" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="Admin Username" required autoFocus className="w-full p-3 border rounded"/>
                            <input type="password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} placeholder="Password" required className="w-full p-3 border rounded"/>
                            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-900">
                                {isLoading ? 'Processing...' : (adminExists ? 'Login' : 'Create Account')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};