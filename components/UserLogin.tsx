

import React, { useState, useEffect } from 'react';
import { getUsersForList, createUserInList, deleteUserFromList } from '../firebase';
import type { UserProfile } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { TrashIcon } from './icons/TrashIcon';

interface UserLoginProps {
    listId: string;
    onLoginSuccess: (username: string) => void;
    onSwitchList: () => void;
}

type Mode = 'selectUser' | 'enterPin' | 'createUser' | 'error';

async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const UserLogin: React.FC<UserLoginProps> = ({ listId, onLoginSuccess, onSwitchList }) => {
    const [mode, setMode] = useState<Mode>('selectUser');
    const [existingUsers, setExistingUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [adminSessionUser, setAdminSessionUser] = useState<UserProfile | null>(null);
    
    const [newUsername, setNewUsername] = useState('');
    const [pin, setPin] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = () => {
        setIsLoading(true);
        setError(null);
        getUsersForList(listId)
            .then(users => {
                setExistingUsers(users);
                if (users.length === 0) {
                    setMode('createUser');
                } else {
                    setMode('selectUser');
                }
            })
            .catch(err => setError("Could not load user profiles. Check your Firebase rules."))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (!window.crypto || !window.crypto.subtle) {
            setError("This browser is not secure. PIN hashing is not available. Please use a modern browser on an HTTPS connection.");
            setIsLoading(false);
            setMode('error');
        } else {
            fetchUsers();
        }
    }, [listId]);

    const resetToSelection = () => {
        setMode('selectUser');
        setSelectedUser(null);
        setError(null);
        setPin('');
        setNewUsername('');
    }

    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin.trim() || !selectedUser) {
            setError('PIN cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const hashedPin = await hashPin(pin);
            if (selectedUser.pinHash !== hashedPin) {
                throw new Error('Incorrect PIN. Please try again.');
            }
            
            if (selectedUser.isAdmin) {
                setAdminSessionUser(selectedUser);
                resetToSelection();
                fetchUsers(); // Re-fetch to show latest user list in admin mode
            } else {
                onLoginSuccess(selectedUser.name);
            }
        } catch (err: any) {
            setError(err.message);
            setPin('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim() || !pin.trim()) {
            setError('Username and PIN cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const lowerCaseUsername = newUsername.trim().toLowerCase();
            if (existingUsers.some(u => u.name.toLowerCase() === lowerCaseUsername)) {
                throw new Error('This username is already taken on this list.');
            }
            const hashedPin = await hashPin(pin);
            await createUserInList(listId, newUsername.trim(), hashedPin);
            onLoginSuccess(newUsername.trim());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteUser = async (username: string) => {
        if(window.confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
            try {
                await deleteUserFromList(listId, username);
                fetchUsers(); // Re-fetch users to update the list
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert("Could not delete user.");
            }
        }
    };

    const handleExitAdminMode = () => {
        setAdminSessionUser(null);
    }

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center text-slate-600 font-semibold">Loading users...</div>;
        }

        if (mode === 'error') {
            return <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>;
        }

        if (mode === 'selectUser') {
            return (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
                        {adminSessionUser ? `Admin Mode` : 'Who are you?'}
                    </h2>
                     {adminSessionUser && (
                        <p className="text-center text-sm text-slate-600 -mt-4 mb-4">
                            Logged in as <strong className="font-semibold">{adminSessionUser.name}</strong>. Select a user to delete or tap your name to log in.
                        </p>
                    )}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {existingUsers.map(user => (
                            <div key={user.name} className="flex items-center gap-2 group">
                                <button 
                                    onClick={() => {
                                        if (adminSessionUser && adminSessionUser.name === user.name) {
                                            onLoginSuccess(user.name);
                                        } else {
                                            setSelectedUser(user);
                                            setMode('enterPin');
                                        }
                                    }}
                                    className="w-full text-left bg-white font-bold p-4 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow flex-1"
                                >
                                    {user.name} {user.isAdmin && <span className="text-xs font-normal text-blue-600">(Admin)</span>}
                                </button>
                                {adminSessionUser && adminSessionUser.name !== user.name && (
                                    <button 
                                        onClick={() => handleDeleteUser(user.name)}
                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-full transition-opacity"
                                        aria-label={`Delete user ${user.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300" /></div>
                        <div className="relative flex justify-center text-sm"><span className="bg-white/50 px-2 text-slate-500 font-medium">OR</span></div>
                    </div>
                     <button onClick={() => setMode('createUser')} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md">
                        Add New User
                    </button>
                    {adminSessionUser && (
                         <button onClick={handleExitAdminMode} className="w-full text-sm text-center text-slate-600 hover:text-red-600 hover:underline mt-4">
                            Exit Admin Mode
                        </button>
                    )}
                </div>
            );
        }

        if (mode === 'enterPin') {
            return (
                <div>
                    <button onClick={resetToSelection} className="absolute top-4 left-4 text-slate-500 hover:text-slate-800 z-10 p-2">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 text-center">Welcome, {selectedUser?.name}!</h2>
                    <p className="text-center text-slate-600 mb-6">Enter your 4-digit PIN to continue</p>
                    <form onSubmit={handlePinSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="pin" className="sr-only">4-Digit PIN</label>
                            <input
                                type="password"
                                id="pin"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                minLength={4}
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-[1em]"
                                placeholder="••••"
                                required
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md text-center">{error}</p>}
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md disabled:bg-blue-300">
                                {isLoading ? 'Verifying...' : 'Login'}
                            </button>
                        </div>
                    </form>
                </div>
            );
        }
        
        if (mode === 'createUser') {
            return (
                 <div>
                    {existingUsers.length > 0 && (
                        <button onClick={resetToSelection} className="absolute top-4 left-4 text-slate-500 hover:text-slate-800 z-10 p-2">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                    )}
                    <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">{existingUsers.length > 0 ? 'Create New User' : 'Create First User (Admin)'}</h2>
                    <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Your Name</label>
                            <input type="text" id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., Faisal" required />
                        </div>
                         <div>
                            <label htmlFor="pin-create" className="block text-sm font-medium text-slate-700">Create a 4-Digit PIN</label>
                            <input type="password" id="pin-create" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., 1234" required />
                        </div>
                        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md disabled:bg-blue-300">
                                {isLoading ? 'Creating...' : 'Create & Login'}
                            </button>
                        </div>
                    </form>
                </div>
            )
        }
    }

    return (
        <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Grocery Hub & Notes
                </h1>
                <p className="text-slate-200 mt-2 font-semibold">Please select or create a user to continue.</p>
            </div>
            <div className="w-full max-w-sm bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 relative">
                {renderContent()}
                 <div className="relative mt-6 pt-6 border-t border-slate-300/50">
                     <button onClick={onSwitchList} className="w-full text-sm text-center text-slate-600 hover:text-red-600 hover:underline">
                        Join a different list
                    </button>
                </div>
            </div>
        </div>
    );
};