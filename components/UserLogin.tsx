import React, { useState } from 'react';
import { getUsersForList, createUserInList, UserProfile } from '../firebase';

interface UserLoginProps {
    listId: string;
    onLoginSuccess: (username: string) => void;
    onSwitchList: () => void;
}

type Mode = 'login' | 'create';

// Simple but effective client-side hashing
async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-266', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const UserLogin: React.FC<UserLoginProps> = ({ listId, onLoginSuccess, onSwitchList }) => {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [mode, setMode] = useState<Mode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !pin.trim()) {
            setError('Username and PIN cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const users = await getUsersForList(listId);
            const lowerCaseUsername = username.trim().toLowerCase();
            const existingUser = users.find(u => u.name.toLowerCase() === lowerCaseUsername);
            const hashedPin = await hashPin(pin);

            if (mode === 'login') {
                if (!existingUser) {
                    throw new Error('Username not found in this list. Try creating a new user.');
                }
                if (existingUser.pinHash !== hashedPin) {
                    throw new Error('Incorrect PIN. Please try again.');
                }
                onLoginSuccess(existingUser.name);
            } else { // create mode
                if (existingUser) {
                    throw new Error('This username is already taken on this list.');
                }
                await createUserInList(listId, username.trim(), hashedPin);
                onLoginSuccess(username.trim());
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'create' : 'login');
        setError(null);
        setUsername('');
        setPin('');
    };

    return (
        <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-4">
             <div className="text-center mb-8" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                 <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-white font-amiri" dir="rtl">
                    قائمة مشترياتنا وخططنا
                </h1>
                <p className="text-slate-200 mt-2 font-semibold">Welcome to list: <strong className="font-mono text-white bg-black/20 px-1.5 py-0.5 rounded">{listId}</strong></p>
            </div>
            <div className="w-full max-w-sm bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-slate-800 text-center mb-6">
                    {mode === 'login' ? 'User Login' : 'Create New User'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700">User Name</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., Faisal"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="pin" className="block text-sm font-medium text-slate-700">4-Digit PIN</label>
                        <input
                            type="password"
                            id="pin"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g., 1234"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md disabled:bg-blue-300"
                        >
                            {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Create User')}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-4">
                    <button onClick={toggleMode} className="text-sm text-blue-600 hover:underline">
                        {mode === 'login' ? 'Need to create a new user?' : 'Already have a user? Login here.'}
                    </button>
                </div>
                 <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white/50 px-2 text-slate-500 font-medium">OR</span>
                    </div>
                </div>
                 <button onClick={onSwitchList} className="w-full mt-6 text-sm text-center text-slate-600 hover:text-red-600 hover:underline">
                    Join a different list
                </button>
            </div>
        </div>
    );
};