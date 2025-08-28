
import React from 'react';

interface HeaderProps {
    isSyncing?: boolean;
    listId: string | null;
    currentUser: string | null;
    onSwitchList: () => void;
    onSwitchUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSyncing, listId, currentUser, onSwitchList, onSwitchUser }) => {
    return (
        <header 
            className="bg-black/20 backdrop-blur-md text-slate-200 shadow-lg p-4 text-center sticky top-0 z-40" 
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
            <h1 className="text-4xl md:text-5xl font-bold tracking-wider text-white font-amiri" dir="rtl">
                قائمة مشترياتنا وخططنا
            </h1>
            <p className="text-lg text-slate-200 font-semibold -mt-2">Our Grocery & Plan List</p>
            
            <div className="h-12 flex flex-col items-center justify-center mt-2 space-y-1">
                 {isSyncing ? (
                    <p className="text-sm text-sky-300 font-semibold animate-pulse">Syncing from cloud...</p>
                 ) : (
                    <>
                        {listId && currentUser && (
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-sm text-slate-200">
                                    Welcome, <strong className="font-semibold text-white">{currentUser}</strong>!
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-slate-300">
                                        List ID: <strong className="font-mono bg-slate-800/50 text-slate-100 py-0.5 px-1.5 rounded">{listId}</strong>
                                    </p>
                                    <button onClick={onSwitchUser} className="text-xs text-sky-400 hover:text-sky-200 hover:underline">
                                        Switch User
                                    </button>
                                    <button onClick={onSwitchList} className="text-xs text-red-400 hover:text-red-200 hover:underline">
                                        Switch List
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                 )}
            </div>
        </header>
    );
};
