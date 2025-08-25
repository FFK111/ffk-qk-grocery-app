
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="text-center p-4 text-gray-500 text-sm mt-8">
            <p>&copy; {new Date().getFullYear()} copyright Faisal</p>
        </footer>
    );
};
