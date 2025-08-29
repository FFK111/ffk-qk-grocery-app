import React from 'react';
import type { UserProfile } from '../types';

interface HeaderProps {
    currentUser: UserProfile;
    onSwitchUser: () => void;
    onSwitchList: () => void;
    onDeleteList: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSwitchUser, onSwitchList, onDeleteList }) => {
    return (
        <header 
            className="bg-black/30 backdrop-blur-md text-slate-100 shadow-lg p-4 sticky top-0 z-40" 
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
            <div className="container mx-auto max-w-2xl flex justify-between items-center">
                 <div className="text-left">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                        Grocery Hub & Notes
                    </h1>
                    <p className="text-sm text-slate-200">
                        Welcome, <span className="font-bold">{currentUser.name}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                     <button onClick={onSwitchUser} className="text-sm font-semibold bg-white/10 hover:bg-white/20 text-white py-1.5 px-3 rounded-md transition-colors">
                        Switch User
                    </button>
                    <button onClick={onSwitchList} className="text-sm font-semibold bg-white/10 hover:bg-white/20 text-white py-1.5 px-3 rounded-md transition-colors">
                        Switch List
                    </button>
                    {currentUser.isAdmin && (
                         <button onClick={onDeleteList} className="text-sm font-semibold bg-red-500/20 hover:bg-red-500/40 text-red-200 py-1.5 px-3 rounded-md transition-colors">
                            Delete List
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};