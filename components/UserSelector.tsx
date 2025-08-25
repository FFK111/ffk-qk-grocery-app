
import React from 'react';
import type { User } from '../types';

interface UserSelectorProps {
    currentUser: User;
    setCurrentUser: (user: User) => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ currentUser, setCurrentUser }) => {
    const users: User[] = ['Faisal', 'Gudiya'];

    return (
        <div className="flex justify-center items-center space-x-2 mb-6 p-1 bg-slate-200/70 rounded-full">
            {users.map(user => (
                <button
                    key={user}
                    onClick={() => setCurrentUser(user)}
                    className={`w-full text-center py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out
                        ${currentUser === user ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-300/50'}`}
                >
                    {user}
                </button>
            ))}
        </div>
    );
};
