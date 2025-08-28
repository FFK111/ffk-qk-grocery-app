
import React, { useState, useEffect } from 'react';

interface HeaderProps {
    isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isSyncing }) => {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(date.toLocaleDateString('en-US', options));
    }, []);

    return (
        <header className="bg-white/30 backdrop-blur-md text-slate-800 shadow-md p-4 text-center sticky top-0 z-40">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-slate-900">
                Our Grocery and Plan List
            </h1>
            <div className="h-5">
                 {isSyncing ? (
                    <p className="text-sm text-blue-600 font-semibold animate-pulse mt-1">Syncing from cloud...</p>
                 ) : (
                    <p className="text-sm text-slate-600 mt-1">{currentDate}</p>
                 )}
            </div>
        </header>
    );
};