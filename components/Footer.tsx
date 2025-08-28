
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="text-center p-4 text-slate-200 text-sm mt-auto sticky bottom-0 bg-black/20 backdrop-blur-sm">
            <p 
                className="font-semibold" 
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
            >
                &copy; {new Date().getFullYear()} Faisal Firoz Khan. All rights reserved.
            </p>
        </footer>
    );
};