import React from 'react';

const LoadingScreen = ({ text = "Loading editor..." }) => {
    return (
        <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center font-sans">
            <div className="relative w-12 h-12 mb-6">
                <svg className="w-full h-full transform rotate-45" viewBox="0 0 50 50">
                    <rect
                        x="2.5"
                        y="2.5"
                        width="45"
                        height="45"
                        fill="none"
                        stroke="#7c3aed" /* violet-600 */
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="animate-draw-square"
                        style={{
                            strokeDasharray: '180',
                            strokeDashoffset: '180'
                        }}
                    />
                </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium tracking-wide animate-pulse">
                {text}
            </p>


        </div>
    );
};

export default LoadingScreen;
