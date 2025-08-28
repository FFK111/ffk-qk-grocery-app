import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="text-center p-4 text-slate-200 text-sm mt-8">
            <p>&copy; {new Date().getFullYear()} Faisal Firoz Khan. All rights reserved.</p>
        </footer>
    );
};