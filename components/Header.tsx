
import React, { useState, useEffect } from 'react';

export const Header: React.FC = () => {
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
            <p className="text-sm text-slate-600 mt-1">{currentDate}</p>
        </header>
    );
};
