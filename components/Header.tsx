
import React, { useState, useEffect } from 'react';

export const Header: React.FC = () => {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const date = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setCurrentDate(date.toLocaleDateString('en-US', options));
    }, []);

    return (
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md p-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider">
                FAISAL & GUDIYA GROCERY
            </h1>
            <p className="text-sm text-blue-200 mt-1">{currentDate}</p>
        </header>
    );
};
