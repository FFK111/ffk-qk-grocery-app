import React from 'react';

export const ConfigError: React.FC = () => {
    return (
        <div className="text-center p-6 bg-red-50 text-red-800 rounded-lg border-2 border-red-200/50 m-4">
            <h3 className="font-bold text-lg">Configuration Error</h3>
            <p className="mt-2">
                The Health &amp; Wellness Advisor feature cannot be initialized.
            </p>
            <div className="text-xs mt-4 text-left bg-red-100/50 p-3 rounded-md text-red-900">
                <p className="font-semibold">Technical Details:</p>
                <p className="mt-1">
                    The required <code>API_KEY</code> for the AI service was not found in the application's environment. Please ensure it is correctly configured by the hosting platform.
                </p>
            </div>
        </div>
    );
};
